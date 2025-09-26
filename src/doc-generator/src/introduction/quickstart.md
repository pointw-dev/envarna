# Getting started
This quick start gets you productive fast. Define a couple of settings, wire them into a proxy, and you’re off. Inline links point to deeper docs when you want more.

## Installation

```bash
npm install envarna
```

## Basic Usage

### Create settings classes
Settings are grouped into classes by concern. Start small, then add a richer example.

```ts
// settings/app.ts
import { BaseSettings, setting, v } from 'envarna'

export class AppSettings extends BaseSettings {
  @setting.string()
  name: string = 'MyApp'

  @setting(v.enum(['debug','info','warn','error']))
  logLevel: string = 'info'
}
```

```ts
// settings/smtp.ts
import { BaseSettings, setting, secret, v } from 'envarna'

export class SmtpSettings extends BaseSettings {
  @setting.string()
  host: string = 'localhost'

  @setting.number()
  port: number = 25

  @setting.string()
  from: string = 'noreply@example.org'

  // Credentials are optional individually, but must be set together
  @setting(v.string().optional())
  username?: string

  @setting(v.string().optional())
  @secret()
  password?: string

  // Cross‑field check: both username and password or neither
  protected override validate(): void {
    const u = this.username !== undefined
    const p = this.password !== undefined
    if (u !== p) {
      throw new Error('Both username and password must be set together or left undefined.')
    }
  }
}
```

### Collect your settings into a proxy
Use `createSettingsProxy()` to define a centralized `settings` object. Pass classes for full IntelliSense. This pattern supports lazy loading and async overrides.

```ts
// settings/index.ts
import { createSettingsProxy } from 'envarna'
import { AppSettings } from './app'
import { SmtpSettings } from './smtp'

export const settings = createSettingsProxy({
  app: AppSettings,
  smtp: SmtpSettings,
})
```
 
### Use your settings in application code

```ts
// main.ts
import { settings } from './settings'

console.log(`[${settings.app.name}] SMTP → ${settings.smtp.host}:${settings.smtp.port}`)
```

### Provide environment variables
Envarna loads values from environment variables. Names are derived from:

* The **class name** with `Settings` stripped and uppercased: `AppSettings` → `APP_`, `SmtpSettings` → `SMTP_`
* The **field name** uppercased with underscores: `logLevel` → `LOG_LEVEL`, `from` → `FROM`
* Combined: `APP_NAME`, `APP_LOG_LEVEL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`

By default, envarna reads variables first from `process.env`, then from a local `.env` (if present) via `dotenv`.

```plaintext
APP_NAME=My Worker
APP_LOG_LEVEL=info
SMTP_HOST=mail.example.org
SMTP_PORT=587
SMTP_FROM=noreply@example.org
# SMTP_USERNAME and SMTP_PASSWORD are optional but must be set together
```

If a required variable is missing (and no default is provided) or is malformed, envarna throws a validation error at startup.

## Beyond the basics
Use validators for constraints, aliases for naming, arrays/objects for structure, and a proxy for composition. Here are quick examples with links to more.

```ts
// Validation with v (min/max, enum, email)
import { BaseSettings, setting, v, alias } from 'envarna';

export class ServiceSettings extends BaseSettings {
  @setting(v.number().int().min(1).max(10).default(5))
  retries!: number;

  @setting(v.enum(['debug','info','warn','error']))
  logLevel!: string;

  @setting(v.string().email())
  contact!: string;

  @setting(v.url())
  @alias('ACME_API_URL')
  endpoint!: string;
}

// Arrays and objects (JSON from env)
export class DataSettings extends BaseSettings {
  @setting(v.array(v.number()))
  weights!: number[];              // DATA_WEIGHTS=[1,2,3]

  @setting.object({ name: v.string(), age: v.number() })
  user!: { name: string; age: number }; // DATA_USER={"name":"Ada","age":42}
}

// Secrets and redaction (safe in JSON dumps)
import { secret } from 'envarna'
export class DbSettings extends BaseSettings {
  @setting.string()
  @secret()
  connectionString!: string;
}

// Testing: override values per test (no process.env mutation)
// DbSettings.overrideForTest({ connectionString: 'mongodb://test' })
// DbSettings.clearOverride()

// Settings proxy: compose classes with lazy/async loaders
import { createSettingsProxy } from 'envarna'
export const settings = createSettingsProxy({
  service: ServiceSettings,
  data: DataSettings,
  db: async () => {
    const s = DbSettings.load()
    // e.g., await fetch secret here if needed
    return s
  },
})
```

See more:
- Decorators and shapes: [Decorators](/how-to/decorators)
- Validation recipes: [Validation with v](/how-to/validation)
- Naming and aliases: [Naming rules](/how-to/naming-aliases)
- Secrets and redaction: [Protect secrets](/how-to/security-redaction)
- Testing overrides: [Testing](/how-to/testing)
- Settings proxy and async: [Settings object](/how-to/settings-object), [Async loading](/how-to/async-loading)

## What is `v`?
`v` builds Zod validators with environment‑friendly coercion (strings → numbers/booleans/dates, JSON arrays/objects). Use it when you need constraints:

```ts
@setting(v.number().int().min(10).max(100).default(42))
```

Prefer `v.*` for env safety; you can still reach for raw Zod if needed.


## Discover and Document Your Settings

Once your settings classes are defined, you can explore and document them with envarna's CLI.

List all known settings:
```bash
npx envarna list
```

Generate a `.env.template` of required/optional variables:
```bash
npx envarna env > .env.template
```

More outputs:
```bash
npx envarna json --root cfg --flat --code
npx envarna yaml --root cfg --flat --code
npx envarna values        # Helm values.yaml
npx envarna compose       # docker-compose environment:
npx envarna k8s           # Kubernetes env: list
```

This helps you avoid missing variables and makes it easier to onboard new developers or deploy to new environments.



## What’s Next?

For many projects, this is all you need. When you need more, explore:

- Rich validators and shapes: [Validation with v](/how-to/validation)
- Aliases and naming: [Naming rules](/how-to/naming-aliases)
- Secrets and redaction: [Protect secrets](/how-to/security-redaction)
- Settings proxy and async sources: [Settings object](/how-to/settings-object), [Async loading](/how-to/async-loading)
- Test overrides: [Testing](/how-to/testing)
