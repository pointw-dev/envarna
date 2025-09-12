import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'chai'
import { BaseSettings, setting, pushToEnv, alias, v } from '../src'
import { isDevOnly } from '../src/lib/decorators'

type SettingsClass = typeof BaseSettings

interface AdvancedWorld {
  settingsClass?: SettingsClass
  settings?: BaseSettings
  error?: Error
  dump?: string
}

// ----- Alias + pushToEnv -----

Given('a class named PubsubSettings includes a setting named projectId aliased to {string} and pushed to env', function (this: AdvancedWorld, envar: string) {
  class PubsubSettings extends BaseSettings {
    @setting.string()
    @pushToEnv()
    @alias(envar)
    projectId: string = 'default'
  }
  this.settingsClass = PubsubSettings
})

Given('a class named ApiSettings includes a setting named host pushed to env', function (this: AdvancedWorld) {
  class ApiSettings extends BaseSettings {
    @setting.string()
    @pushToEnv()
    host: string = 'nope'
  }
  this.settingsClass = ApiSettings
})

When('I load settings injecting {string} = {string}', function (this: AdvancedWorld, key: string, value: string) {
  this.settings = this.settingsClass!.load({ [key]: value })
})

Then('the process environment variable {string} equals {string}', function (this: AdvancedWorld, envar: string, expected: string) {
  expect(process.env[envar]).to.equal(expected)
})

// ----- Defaults behavior -----

Given('a class named DemoSettings includes a setting named defaultAssignment with assignment default {string}', function (this: AdvancedWorld, def: string) {
  class DemoSettings extends BaseSettings {
    @setting.string()
    defaultAssignment: string = def
  }
  this.settingsClass = DemoSettings
})

Given('a class named DemoSettings includes a setting named defaultDecorator with decorator default {string}', function (this: AdvancedWorld, def: string) {
  class DemoSettings extends BaseSettings {
    @setting(v.string().default(def))
    defaultDecorator!: string
  }
  this.settingsClass = DemoSettings
})

Given('a class named DemoSettings includes a setting named dualDefault with assignment default {string} and decorator default {string}', function (this: AdvancedWorld, assignDef: string, decoDef: string) {
  class DemoSettings extends BaseSettings {
    @setting(v.string().default(decoDef))
    dualDefault: string = assignDef
  }
  this.settingsClass = DemoSettings
})

// ----- Validation failures -----

Given('a class named SmtpSettings with paired credentials validation', function (this: AdvancedWorld) {
  class SmtpSettings extends BaseSettings {
    @setting(v.string().optional())
    username?: string

    @setting(v.string().optional())
    password?: string

    protected override validate(): void {
      const u = this.username !== undefined
      const p = this.password !== undefined
      if (u !== p) {
        throw new Error('Both username and password must be set together or left undefined.')
      }
    }
  }
  this.settingsClass = SmtpSettings
})

When('I attempt to load settings', function (this: AdvancedWorld) {
  try {
    this.settings = this.settingsClass!.load()
  } catch (e: any) {
    this.error = e
  }
})

Then('loading fails with an error containing {string}', function (this: AdvancedWorld, part: string) {
  expect(this.error).to.be.instanceOf(Error)
  expect(String(this.error?.message)).to.contain(part)
})

// ----- Secret redaction check on dumped JSON -----

Then('the JSON path {string} is redacted', function (this: AdvancedWorld, path: string) {
  const json = JSON.parse(this.dump!)
  const parts = path.split('.')
  let current: any = json
  for (const p of parts) {
    current = current[p]
  }
  expect(current).to.equal('****')
})

// ----- Environment sanitation for default tests -----

Given('no environment variables with prefix {string} are set', function (this: AdvancedWorld, prefix: string) {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith(prefix)) delete (process.env as any)[key]
  }
})

// ----- Extended assertions for coercion -----

Then('the date setting {string} ISO equals {string}', function (this: AdvancedWorld, field: string, expected: string) {
  const anySettings: any = (this as any).settings
  const value: any = anySettings[field]
  expect(value).to.be.instanceOf(Date)
  expect((value as Date).toISOString().slice(0, 10)).to.equal(expected)
})

Then('the array setting {string} JSON equals {string}', function (this: AdvancedWorld, field: string, json: string) {
  const anySettings: any = (this as any).settings
  const value: any = anySettings[field]
  expect(Array.isArray(value)).to.equal(true)
  expect(JSON.stringify(value)).to.equal(json)
})

// ----- Optional and nullable assertions -----

Then('the setting {string} is undefined', function (this: AdvancedWorld, field: string) {
  const anySettings: any = (this as any).settings
  expect(anySettings[field]).to.equal(undefined)
})

Then('the setting {string} is null', function (this: AdvancedWorld, field: string) {
  const anySettings: any = (this as any).settings
  expect(anySettings[field]).to.equal(null)
})

// ----- Builders for common validations -----

Given('a class named ApiSettings includes a setting named contact validated as email', function (this: AdvancedWorld) {
  class ApiSettings extends BaseSettings {
    @setting(v.string().email())
    contact!: string
  }
  this.settingsClass = ApiSettings
})

Given('a class named ApiSettings includes a setting named {string} as a coercing array', function (this: AdvancedWorld, name: string) {
  class ApiSettings extends BaseSettings {}
  this.settingsClass = ApiSettings
  const Klass = this.settingsClass! as any
  Klass.prototype[name] = undefined
  setting(v.array())(Klass.prototype, name)
})

Given('a class named ApiSettings includes a setting named {string} as a coercing numeric array', function (this: AdvancedWorld, name: string) {
  class ApiSettings extends BaseSettings {}
  this.settingsClass = ApiSettings
  const Klass = this.settingsClass! as any
  Klass.prototype[name] = undefined
  setting(v.array(v.number()))(Klass.prototype, name)
})

Given('a class named ApiSettings includes a setting named fromEmail pushed to env', function (this: AdvancedWorld) {
  class ApiSettings extends BaseSettings {
    @setting.string()
    @pushToEnv()
    fromEmail: string = ''
  }
  this.settingsClass = ApiSettings
})

Given('a class named DemoSettings includes a setting named optionalComment as nullable string defaulting to null', function (this: AdvancedWorld) {
  class DemoSettings extends BaseSettings {
    @setting(v.string().nullable().default(null))
    optionalComment!: string | null
  }
  this.settingsClass = DemoSettings
})

Given('a class named DemoSettings includes a setting named logLevel as optional string', function (this: AdvancedWorld) {
  class DemoSettings extends BaseSettings {
    @setting(v.string().optional())
    logLevel?: string
  }
  this.settingsClass = DemoSettings
})

Given('a class named DemoSettings includes a setting named slug marked devOnly', function (this: AdvancedWorld) {
  class DemoSettings extends BaseSettings {
    @setting.string()
    // this is metadata only; no runtime effect, but should be present
    @((require('../src') as any).devOnly())
    slug!: string
  }
  this.settingsClass = DemoSettings
})

Then('the field {string} is marked devOnly', function (this: AdvancedWorld, field: string) {
  const Klass = this.settingsClass!
  const instance: any = new (Klass as any)()
  expect(isDevOnly(instance, field)).to.eq(true)
})

Given('a class named ApiSettings includes a setting named mode as enum {string}', function (this: AdvancedWorld, csv: string) {
  const values = csv.split(',').map(s => s.trim()) as [string, ...string[]]
  class ApiSettings extends BaseSettings {
    @setting(v.enum(values as any))
    mode!: string
  }
  this.settingsClass = ApiSettings
})

Given('a class named ApiSettings includes a setting named uuid with length {int}', function (this: AdvancedWorld, len: number) {
  class ApiSettings extends BaseSettings {
    @setting(v.string().length(len))
    uuid!: string
  }
  this.settingsClass = ApiSettings
})

Given('a class named ApiSettings includes a setting named port with minimum {int}', function (this: AdvancedWorld, min: number) {
  class ApiSettings extends BaseSettings {
    @setting(v.number().gte(min))
    port!: number
  }
  this.settingsClass = ApiSettings
})
