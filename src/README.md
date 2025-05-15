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

## Zod validation for settings
`z` vs `v`
* https://zod.dev/?id=strings
* https://zod.dev/?id=numbers
* etc

## Command Line Interface

In the current beta mode, all settings classes must be in `/src/settings` for the envarna command to work.  This will be more flexible in future releases.

`npx envarna --help`

```plaintext
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

Options:
  --version  Show version number
  --help     Show help
```

## Order

injected > environment (alias > convention) > .env > default


## Miscellaneous

* .optional() must be after transformations:

✅	`@settings(v.string().toUpperCase().optional())`
❌	`@settings(v.string().optional().toUpperCase())`


* @pushToEnv always pushes to the convention-based envar.
  * If you also want to push to an @alias, @pushToEnv must come before the @alias


## 