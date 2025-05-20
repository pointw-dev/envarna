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


### Create a settings object
Taking, for example, all settings classes are defined in `src/settings`, aggregate access to their values under a `settings` object in the `index.ts` in that folder.  For example:

```Typescript
import { createSettingsProxy } from 'envarna'
import { SmtpSettings } from "./smtp"
import { MongoSettings } from "./mongo"

export const settings = createSettingsProxy({
  smtp: SmtpSettings.load(),
  mongo: MongoSettings.load()  
});
```

This will load settings values the process environment variables, or from a `.env` file if it .  

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