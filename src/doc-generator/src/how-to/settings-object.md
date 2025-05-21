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
The `.load()` function takes an optional object.  When passed to `.load()` that object's values supersede any default value and any environment

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
