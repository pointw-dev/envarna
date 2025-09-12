# envarna

![](https://www.pointw.com/img/envarna-logo.svg)

> **Settings managed.**  

Envarna is a TypeScript library that helps you manage application configuration.  These are the settings that control how an application behaves and how it connects to other services.  It is a lightweight wrapper over the [Zod validation library](https://zod.dev/api?id=strings), the [dotenv environment variable loader](https://www.npmjs.com/package/dotenv), with some syntactic sugar to make it all easy to use.

(full docs [here](https://pointw-dev.github.io/envarna/))

## Quick start

### Create settings classes
> (recommend in `/src/settings`)

For each group of settings create a class as follows:

```Typescript
import { BaseSettings, setting } from "envarna";

export class SmtpSettings extends BaseSettings {
  @setting.string()
  host: string = 'localhost';

  @setting.number()
  port: number = 25;

  @setting.string()
  fromEmail: string = 'noreply@example.org';
}
```

### Configuration by convention

The environment variables that populate the fields of the class are derived from the naming convention of the class and the fields themselves.  In the above example:

* `host` is populated by the envar `SMTP_HOST`
* `port` is populated by `SMTP_PORT`
* `fromEmail` is populated by `SMTP_FROM_EMAIL`

Each environment variable is derived from the class name (`SMTP_`) plus the field name (`FROM_EMAIL`)


### Create a settings object (typed proxy)
If your settings classes live in `src/settings`, expose a single, typed `settings` object. Pass the classes for IntelliSense, then initialize once at startup.

```Typescript
// src/settings/index.ts
import { createSettingsProxy } from 'envarna'
import { SmtpSettings } from './smtp'
import { MongoSettings } from './mongo'

export const settings = createSettingsProxy({
  smtp: SmtpSettings,
  mongo: MongoSettings,
})

// Apply overrides (optional): resolve and cache specific keys (sync or async)
export async function applyOverrides() {
  await settings.$override({
    smtp: () => SmtpSettings.load(),
    mongo: () => MongoSettings.load(), // can be async if needed
  })
}
```

This loads values from process environment variables or a `.env` file. For secrets, use an async loader:

```Typescript
await settings.$override({
  mongo: async () => {
    const s = MongoSettings.load()
    // e.g., fetch from a secrets manager
    // s.uri = await getSecret('prod-mongo-uri')
    return s
  },
})
```

### Putting it all together

The above produces the following settings for `smtp`:

```plaintext
Env Var          Usual Path               Default
-------          ----------               -------
SMTP_HOST        settings.smtp.host       localhost
SMTP_PORT        settings.smtp.port       25
SMTP_FROM_EMAIL  settings.smtp.fromEmail  noreply@example.org
```

* In your code,
```Typescript
import { settings } from './settings'
````
Then when you need a settings value, you use  `settings.smtp.host`


(full docs [here](https://pointw-dev.github.io/envarna/))


## Command Line

Generate docs and environment artifacts directly from your settings classes.

- Basics: `npx envarna --help` 
  ```
  envarna <command>
  
  Commands:
    envarna list         Display settings details
    envarna env          Write ".env.template"
    envarna md           Write "SETTINGS.md"
    envarna values       Write "values.yaml"
    envarna compose      Display docker-compose style environment yaml
    envarna k8s          Display kubernetes style env var structure
    envarna json [root]  Display JSON settings structure
    envarna yaml [root]  Display YAML settings structure
    envarna raw          Display the raw structure extracted from the settings
                         classes used to power the other formats
  
  Options:
    --version   Show version number                                      [boolean]
    --skip-dev  Exclude fields marked @devOnly          [boolean] [default: false]
    --help      Show help                                                [boolean]
  ```

For `json` and `yaml`:

- `json --root <name> --flat --code`: set root object, flatten groups, and use field names instead of ENVAR keys.
- `yaml --root <name> --flat --code`: same for YAML output.

Example
```bash
npx envarna list
npx envarna env
npx envarna json --root cfg --flat --code --skip-dev
```


## Testing

Envarna keeps testing simple without DI or heavy mocks. Two common patterns are supported:

- Per-test override: Set the value that drives behavior inside each test, then restore.
- Suite-level override: Set once in `beforeEach` (or `beforeAll`) when shared across tests.

>  Note: You can still DI or mock the module that exports `settings` , or the indivdual settings classes if preferred

Per-test override (behavior-driven)

```ts
// settings/pagination.ts
export class PaginationSettings extends BaseSettings {
  @setting.number() maxPageSize = 10
}

// settings/index.ts (lazy proxy)
export const settings = createSettingsProxy({ pagination: () => PaginationSettings.load() })

// showWidgets.test.ts
import { PaginationSettings } from './settings/pagination'
import { settings } from './settings'

it('prints 7 widgets when maxPageSize=7', () => {
  try {
    PaginationSettings.overrideForTest({ maxPageSize: 7 })
    expect(settings.pagination.maxPageSize).toBe(7)
  } finally {
    PaginationSettings.clearOverride()
  }
})
```

Suite-level override (shared setup)

```ts
beforeEach(() => PaginationSettings.overrideForTest({ maxPageSize: 7 }))
afterEach(() => PaginationSettings.clearOverride())
```

Jest-style mock (optional)

```ts
jest.mock('./settings', () => ({ settings: { pagination: { maxPageSize: 3 } } }))
```

Tip: For BDD or multi-scenario tests, be sure to `clearOverride()` and reset any cached keys if you used `$override` during a scenario.
