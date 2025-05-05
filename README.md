# envarna

![](https://www.pointw.com/img/envarna-logo.svg)

> **Settings managed.**  

## Why envarna?
The main benefits of envarna over, say, plain-jane dotenv are:

* Types
* Validation
* Centralization
* Flexible
* Testable
* Discoverable
* Improved DX

In short, settings become first-class citizens in your application - or at least a `class`ed citizen :-)   This is especially helpful in large applications with many settings, or with many small microservices with similar settings groups.  By taking a first-class citizen approach, settings plays nicer not only with development (code-completion, syntactic sugar) but with testing (explicit tests not based on external factors like environment or .env files), with DevOps (the settings an app requires are discoverable), and the enterprise (standardize the names and schemas for settings sets by sharing a well-defined settings class).  These are amongst the many benefits we will look at more closely.

## Order

injected > environment > .env > default

## Miscellaneous

.optional() must be after transformations:

✅	`@settings.string().toUpperCase().optional()`

❌	`@settings.string().optional().toUpperCase()`





## Quick start

### Create settings classes
> (recommend in `/src/settings`)

```Typescript
import { BaseSettings, setting } from "envarna";

export class SmtpSettings extends BaseSettings {
  @setting.string()
  host: string = 'localhost'

  @setting.number()
  port: number = 25

  @setting.string()
  from: string = 'noreply@example.org'
}

```

### Configuration by convention
* the name of the class is the settings prefix (title case) + `Settings`: e.g. `SmtpSettings`
* extend `BaseSettings` imported from `envarna`
* each setting in this group is decorated with a setting type, one of `string` | `number` | `boolean` 
    * more to come
    * if you are familiar with `zod` you can pass any `zod` validations
* the setting name itself is camelCase
* adding `!` denotes the setting is mandatory
* default values are optional


### settings/index.ts
A typical `index.ts` would follow this example:

```Typescript
import { SmtpSettings } from "./smtp"
import { MongoSettings } from "./mongo"

export const settings = {
  smtp: SmtpSettings.load(),
  mongo: MongoSettings.load()  
}
```

* This will load settings from a .env file or from the process environment variables.  
* You can override this by passing an object to `.load()`
    * This is convenient for testing - no juggling various .env files for various scenarios
    * This is also convenient to load settings from a secrets vault or other locations

### Putting it all together

The above produces the following settings for `smtp`:

```plaintext
Code                    Envar          Default
----------------------- -------------- ---------
settings.smtp.host      SMTP_HOST      localhost
settings.smtp.port      SMTP_PORT      25
settings.smtp.from      SMTP_FROM      noreply@example.org
```

* In your code,
```Typescript
import { settings } from './settings'
````
then when you need a settings value, you use a POJO, e.g. `settings.smtp.host`


## Command Line Interface

In the current beta mode, all settings classes must be in `/src/settings` for the envarna command to work.  This will be more flexible in future releases.

`npx envarna --help`

```plaintext
envarna <command>

Commands:
  envarna list    Displays settings details
  envarna md      Generate "SETTINGS.md" file
  envarna env     Generate ".env.sample" file
  envarna values  Generate "values.yaml" file

Options:
  --version  Show version number
  --help     Show help

```

> NOTE: ignore the Optional column with `list` and `md` for now - there is an ambiguity that needs clearing up before it is accurate.