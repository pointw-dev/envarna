# Settings object

> The following assumes that you create all settings classes in `src/settings`. Adjust as required if you put yours somewhere else.

## Basic
This is optional but highly recommended.

In the `index.ts` file, you aggregate all settings classes under a single `settings` object, then lazy-load them.

Use `createSettingsProxy()` to define a centralized `settings` object. This pattern defers loading until first access and enables test overrides.

```ts
// settings/index.ts
import { createSettingsProxy } from 'envarna';
import { AppSettings } from './app';
import { PageSettings } from './page';

export const settings = createSettingsProxy({
  app: () => AppSettings.load(),
  other: () => OtherSettings.load(),
});
```

> NOTE: earlier versions of envarna used this simpler pattern:
> ```typescript
> import { AppSettings } from './app';
> import { PageSettings } from './page';
> 
> export const settings = {
>   app: AppSettings.load(),
>   other: OtherSettings.load(),
> };
> ```
> This can still be used, but will introduce challenges if you have complicated testing of how these values influence your application.  The good news is if you start with the simpler version, it can be changed to the recommended version later without affecting the code that uses these values.

## Injecting values
The `.load()` function takes an optional object.  When passed to `.load()` that object's values supersede any default value and any environment variable.  The object can add only the values you want - all others will behave as normal.

Let's take this settings class as an example:
```typescript
export class SmtpSettings extends BaseSettings {
  @setting.string()
  host: string = 'localhost';

  @setting.number()
  port: number = 25;

  @setting.string()
  fromEmail: string = 'noreply@example.org';
}
```
and this `.env` file:
```plaintext
SMPT_PORT=1025
SMPT_FROM_MAIL=billing-system@example.org
```
When we build the settings object, we can force `port` to be 666:
```typescript
const settings = {
    smtp: () => SmtpSettings.load({port: 666})
}
```
This will result in the following:

| Setting                   | Value                          | Comment                          |
|---------------------------|--------------------------------|----------------------------------|
| `settings.smtp.host`      | `'localhost'`                  | from the default value           |
| `settings.smtp.port`      | `666`                          | from the injected object at load |
| `settings.smtp.fromEmail` | `'billing-system@example.org'` | from the `.env` file             |

This technique can be used to bring values in from sources other than the environment/`.env` file.  This can be done unconditionally as above, or through conditional loading. 

## Conditional loading

```typescript
// settings/index.ts
import { createSettingsProxy } from "envarna";
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { AppSettings } from './app';
import { MongoSettings } from './mongo';
import { GoogleSettings } from './google';

export const settings = createSettingsProxy({
  app: () => AppSettings.load(),
  google: () => GoogleSettings.load(),
  mongo: () => loadMongoSettings(),
});

function loadMongoSettings() {
  const app = AppSettings.load(); // safe: can be overridden in tests

  if (!app.loadSettingsFromGcp) {
    return MongoSettings.load();
  }

  // load from GCP
  const google = GoogleSettings.load(); // also safe: can be overridden
  const secretManager = new SecretManagerServiceClient();

  const result = syncFetchMongoUriFromSecretManager(app.name, google.cloudProject); // see below
  return MongoSettings.load({ uri: result });
}
```

## Load priority
As you see, the values applied to a setting can come from various places.  Here is the order of priority from highest to lowest:

* assignment after calling `.load()`
  ```typescript
  const smtp = SmtpSettings.load();
  smtp.host = 'highest-priority@example.org';
  ```
* value injected into `.load()`
  ```typescript
  const smtp = SmtpSettings.load({host: 'override.example.org'});
  ```
* environment variable of the process
  ```bash
  export SMTP_HOST=envar@example.org  # bash
  --
  set SMTP_HOST=envar@example.org     # Windows
  ```
* environment variable in the `.env` file
  ```plaintext
  SMTP_HOST=env-file@example.org
  ```
* direct default assignment in the settings class
  ```typescript
  @setting.string()
  host: string = 'direct-assignment@example.org';
  ``` 
* `v` validation chain's `default()`
  ```typescript
  @setting(v.string().default('lowest-priority@example.org')
  host: string;
  ``` 

## Logging the settings object
The `BaseSettings` class implements `toJSON()` in a way that respects settings marked `@secret()`.  Therefore, this is a safe operation:

```typescript
import { settings } from './settings';

console.log(JSON.stringify(settings, null, 2))
```
Any values marked `@secret()` will show a value of `'***'` instead of its actual value.

::: warning
There is nothing stopping a developer from logging a secret value:
```typescript
console.log(settings.database.password)
```
:::