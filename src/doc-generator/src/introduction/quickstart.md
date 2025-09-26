# Getting started
This quick start guide walks you through setting up envarna in your project, creating your first settings classes, and gradually layering in validation and more advanced features.

## Installation

```bash
npm install envarna
```

## Basic Usage

### Create settings classes
Settings are grouped into classes, each representing a coherent domain of configuration. For example, general application settings might live in `AppSettings`, while database settings go in `MongoSettings`.

```ts
// settings/app.ts
import { BaseSettings, setting } from 'envarna';

export class AppSettings extends BaseSettings {
  @setting.string()
  name!: string;

  @setting.boolean()
  debug: boolean = false;
}
```

```ts
// settings/other.ts
import { BaseSettings, setting } from 'envarna';

export class OtherSettings extends BaseSettings {
  @setting.number()
  numRetries!: number;
}
```

### Collect your settings into a proxy
This is optional but highly recommended.

Use `createSettingsProxy()` to define a centralized `settings` object. Pass classes for full IntelliSense. This pattern works with lazy values by default and supports async overrides.

```ts
// settings/index.ts
import { createSettingsProxy } from 'envarna';
import { AppSettings } from './app';
import { OtherSettings } from './other';

export const settings = createSettingsProxy({
  app: AppSettings,
  other: OtherSettings,
});
```
 
### Use your settings in application code

```ts
// main.ts
import { settings } from './settings';

if (settings.app.debug) {
  console.debug(`Retry count ${settings.other.numRetries}`);
}
```

### Provide environment variables
Envarna loads the settings with values from environment variables. The names of these variables are derived from:

* The **class name** (e.g., `OtherSettings`) is used as a prefix, with `Settings` stripped and converted to uppercase: `OTHER_`
* Each **field name** (e.g., `numRetries`) is transformed from camelCase to uppercase with underscores: `NUM_RETRIES`
* The full environment variable becomes: `APP_NAME` , `OTHER_NUM_RETRIES`

By default, envarna loads variables from first from the process environment (`process.env`) and secondly (if it exists) from `.env` file using `dotenv`.

```plaintext
APP_NAME=MyApp
APP_DEBUG=true
OTHER_NUM_RETRIES=50
```

If a required variable is missing (without a default) or is malformed, envarna will throw a validation error at startup.

## Beyond the basics
You can expand your schema using Zod-compatible validators with a `v` extension.  You can also override the naming convention by providing an alias.

```ts
// settings/service.ts
import { BaseSettings, settings, v } from 'envarna';

export class ServiceSettings extends BaseSettings {
  @setting(v.string().length(10))
  apiKey: string;

  @setting(v.url())
  @alias('ACME_API_URL')
  endpoint: string;
}
```

```plaintext
SERVICE_API_KEY=abcdefghij
AMCE_API_URL=https://api.example.com
```

## What is `v`?
Most of the time you will decorate your setting field with one of:
* `@setting.string()`
* `@setting.number()`
* `@setting.boolean()`
* `@setting.date()`
* `@setting.array()`
* `@setting.object()  // in progress`

If you want more control over the validation, use `v`:

```ts
@setting(v.number().int().min(10).max(100).default(42))
```

`v` is for "validation".  It is a light extension of `z` from Zod designed for use in a settings environment.
* automatic coercion (e.g. `v.number()` accepts strings like "42")
* access to Zod validations e.g.:
  ```ts
  @setting(v.url())
  @setting(v.email())
  @setting(v.string().startsWith('aaa').includes('mmm').length(15).toUpperCase())
  ```
* handling for arrays (and soon objects)

You can still use raw Zod if needed, just remember to be aware of coercion:

```ts
@setting(v.date().min(new Date("1984-01-01")))
// is the same as...
@setting(z.coerce.date().min(new Date("1984-01-01")))
```

See the sections (string formats, numbers, etc.) under [Zod's Defining schemas](https://zod.dev/api?id=strings) for more details.


## Discover and Document Your Settings

Once your settings classes are defined, you can explore and document them with envarna's CLI.

To list all known settings:
```bash
npx envarna list
```

To generate a `.env.template` showing required and optional variables:
```bash
npx envarna env > .env.template
```

This helps you avoid missing variables and makes it easier to onboard new developers or deploy to new environments.



## What’s Next?

For many projects, this is all you need. But when config complexity increases, envarna is ready:

* Load values from external sources like GCP Secret Manager
* Use conditional logic (e.g., different loaders based on env flags)
* Inject test values safely with `.overrideForTest()`
* Generate `.env.template` and validation reports with `npx envarna`

See `Testing Best Practices` and `Advanced Loading` guides for more.
