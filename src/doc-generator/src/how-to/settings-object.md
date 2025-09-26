# Settings object

> The following assumes that you create all settings classes in `src/settings`. Adjust as required if you put yours somewhere else.

## Basic
This is optional but highly recommended.

In the `index.ts` file, you aggregate all settings classes under a single `settings` object, then lazy-load them.

Use `createSettingsProxy()` to define a centralized `settings` object. Prefer passing classes for a fully typed shape.

```ts
// settings/index.ts
import { createSettingsProxy } from 'envarna';
import { AppSettings } from './app';
import { OtherSettings } from './other';

export const settings = createSettingsProxy({
  app: AppSettings,
  other: OtherSettings,
})

// Optionally resolve + cache specific groups (sync/async overrides)
export async function applyOverrides() {
  await settings.$override({
    app: () => AppSettings.load(),
    // other: async () => OtherSettings.load(),
  })
}
```

> NOTE: You can also use a simpler, eager pattern:
> ```typescript
> import { AppSettings } from './app';
> import { PageSettings } from './page';
> 
> export const settings = {
>   app: AppSettings.load(),
>   other: OtherSettings.load(),
> };
> ```
> This can still be used, but it makes test overrides and async sources less ergonomic. You can migrate to the proxy at any time without changing call sites.

## Lazy vs cached values

- Lazy (default): Keys not passed to `$override` are computed on each access via `Class.load()`. They reflect changes to `process.env` over time.
- Cached (after `$override`): Keys you pass are resolved once and cached; later reads do not consult the environment. Instances are not frozen.

For any async source (secrets/DB), include that key in `$override` before first use to preserve synchronous DX.

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
export const settings = createSettingsProxy({
  smtp: SmtpSettings,
})

await settings.$override({ smtp: () => SmtpSettings.load({ port: 666 }) })
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
  app: AppSettings,
  google: GoogleSettings,
  mongo: MongoSettings,
});

export async function applyOverrides() {
  await settings.$override({
    mongo: async () => {
      const app = AppSettings.load();
      if (!app.loadSettingsFromGcp) return MongoSettings.load();

      const google = GoogleSettings.load();
      const secretManager = new SecretManagerServiceClient();
      const result = await fetchMongoUriFromSecretManager(app.name, google.cloudProject);
      return MongoSettings.load({ uri: result });
    },
  })
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
