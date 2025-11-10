import { expect } from 'chai';
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { EnvFixture } from './env-fixture'
import { BaseSettings, setting, v } from '../src';



type SettingsClass = typeof BaseSettings;

interface BasicWorld {
    settingsClass?: SettingsClass;
    settings?: BaseSettings;
    consoleLines?: string[];
}

let env: EnvFixture

Before(() => {
    env = new EnvFixture();
})

After(() => {
    env.cleanup()
})


Given(/^the environment variable "([^"]+)" is set to "(.*)"$/, function (key: string, value: string) {
    // Normalize common Cucumber-escaped quotes in JSON payloads
    const normalized = value.replace(/\\"/g, '"')
    env.setEnvVariable(key, normalized);
});

Given('an .env file that contains:', function (fileString: string) {
    env.createDotenvFile(fileString);
    env.loadDotenv();
});

Given('a class named ApiSettings includes a setting named host', function(this: BasicWorld) {
    class ApiSettings extends BaseSettings {
        // @ts-ignore
        @setting.string()
        host: string = 'nope'
    }

    this.settingsClass = ApiSettings
})

Given('a class named ApiSettings includes a setting named apiKey', function(this: BasicWorld) {
    class ApiSettings extends BaseSettings {
        // @ts-ignore
        @setting.string()
        apiKey: string = 'nope'
    }

    this.settingsClass = ApiSettings
})

Given('a class named ApiSettings includes a setting named {string} of type {string}', function(this: BasicWorld, name: string, type: string) {
  class ApiSettings extends BaseSettings {

  }

  this.settingsClass = ApiSettings
  const Klass = this.settingsClass! as any;
  let decorator: PropertyDecorator
  switch (type) {
    case 'string':
      decorator = setting.string();
      break;
    case 'number':
      decorator = setting.number();
      break;
    case 'boolean':
      decorator = setting.boolean();
      break;
    case 'date':
      decorator = setting.date();
      break;
    case 'array':
      decorator = setting.array()
      break;
    case 'object':
      // no shape; just ensure JSON is parsed
      decorator = (setting as any).object();
      break;
    default:
      throw new Error(`Unknown type "${type}"`);
  }
  decorator(Klass.prototype, name)
})

Given('a fresh class named {string} includes a setting named {string} of type {string}', function(this: BasicWorld, className: string, name: string, type: string) {
  // Dynamically create a class with the given name
  const safeName = String(className).replace(/[^A-Za-z0-9_]/g, '')
  const Klass = eval(`(class ${safeName} extends (require('../src').BaseSettings) {})`)
  this.settingsClass = Klass

  let decorator: PropertyDecorator
  switch (type) {
    case 'string':
      decorator = (require('../src').setting as any).string();
      break;
    case 'number':
      decorator = (require('../src').setting as any).number();
      break;
    case 'boolean':
      decorator = (require('../src').setting as any).boolean();
      break;
    case 'date':
      decorator = (require('../src').setting as any).date();
      break;
    case 'array':
      // Use coercing array so JSON env parses
      decorator = (require('../src').setting as any)((require('../src').v as any).array());
      break;
    case 'object':
      decorator = (require('../src').setting as any).object();
      break;
    default:
      throw new Error(`Unknown type "${type}"`);
  }
  decorator((Klass as any).prototype, name)
})

Given('a fresh class named {string} includes a setting named {string} validated as {string}', function(this: BasicWorld, className: string, field: string, expr: string) {
  const safeName = String(className).replace(/[^A-Za-z0-9_]/g, '')
  const Klass = eval(`(class ${safeName} extends (require('../src').BaseSettings) {})`)
  this.settingsClass = Klass
  const api = require('../src') as any
  const { z } = require('zod')
  const build: any = new Function('v','z', `return (${expr});`)
  const schema = build(api.v, z)
  api.setting(schema)((Klass as any).prototype, field)
})

Given(/^the environment variable for class "([^"]+)" field "([^"]+)" is set to "(.*)"$/, function (className: string, field: string, value: string) {
  const envar = `${className.replace(/Settings$/, '').toUpperCase()}_` + field.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
  const normalized = value.replace(/\\"/g, '"')
  env.setEnvVariable(envar, normalized)
});


Given('the class also includes a setting named name', function(this: BasicWorld) {
    const Klass = this.settingsClass! as any;
    // Dynamically add the field to the existing class so previous fields remain
    setting.string()(Klass.prototype, 'name');
    Klass.prototype.name = 'default';
});


When('I load settings', function () {
    this.settings = this.settingsClass.load();  // or new BaseSettings().load() if not static
});

When('I load settings with a value {string}', function (injection: string) {
    this.settings = this.settingsClass.load({host: injection});
});


Then(/^the setting "([^"]+)" value is "(.*)"$/, function (settingKey: string, expected: string) {
    const actual = (this.settings as any)[settingKey];
    // Unescape any Cucumber-escaped quotes for JSON comparisons
    const normalized = expected.replace(/\\"/g, '"')
    try {
        const parsed = JSON.parse(normalized);
        expect(actual).to.deep.equal(parsed);
    } catch {
        expect(String(actual)).to.equal(normalized);
    }
});

Given('a class named DemoSettings includes comprehensive demo fields', function(this: BasicWorld) {
    class DemoSettings extends BaseSettings {
        // Strings and defaults
        @setting.string()
        appName!: string

        @setting.string()
        defaultAssignment: string = 'default by assignment'

        @setting(v.string().default('default by decorator'))
        defaultDecorator!: string

        @setting(v.string().default('default by decorator'))
        defaultBoth: string = 'default by assignment'

        @setting(v.string().default('default by decorator'))
        dualDefault: string = 'default by assignment'

        // Numbers with constraints
        @setting(v.number().gte(2112))
        port!: number

        @setting(v.number().gt(99).lt(600))
        statusCode!: number

        // Optional and devOnly
        @setting(v.boolean().optional())
        @((require('../src') as any).devOnly())
        highVelocity?: boolean

        @setting(v.number().int().default(5))
        maxConnections!: number

        @setting(v.number().gte(1).lte(10).optional())
        retries?: number

        @setting(v.boolean().optional())
        dryRun?: boolean

        @setting(v.number().optional())
        maxRetries?: number

        // String validations
        @setting(v.string().email())
        contact!: string

        @setting(v.string().optional())
        logLevel?: string

        @setting(v.string().nullable())
        optionalComment!: string | null

        @setting(v.string().regex(/^[a-z]{3,10}$/).optional())
        @((require('../src') as any).devOnly())
        slug!: string

        @setting(v.string().min(5).max(15))
        username!: string

        @setting(v.string().length(36))
        uuid!: string

        // Booleans
        @setting.boolean()
        debug!: boolean

        // Secrets and enums
        @setting(v.string({ required_error: 'DEMO_API_ENV is required. Contact Bob.' }))
        @((require('../src') as any).secret())
        apiKey!: string

        @setting(v.enum(['debug','info','warn','error']))
        mode!: string

        // Arrays
        @setting(v.array())
        hosts!: string[]

        // Dates and labels
        @setting.date()
        launchDate!: Date

        @setting(v.string().date())
        dateLabel!: string

        // Simple array default
        @setting.array()
        someList: string[] = ['a','b']

        // Objects
        @setting.object()
        someObject: object = { name: 'Michael', age: 56 }
    }
    this.settingsClass = DemoSettings
})

Given('a class named SomeSettings includes an object setting named record with name string and age number', function(this: BasicWorld) {
    class SomeSettings extends BaseSettings {
        // @ts-ignore
        @setting.object({ name: v.string(), age: v.number() })
        record: { name: string, age: number } = { name: '', age: 0 }
    }
    this.settingsClass = SomeSettings
})

When('I print the fields record.name and record.age', function(this: BasicWorld) {
    const original = console.log
    const lines: string[] = []
    this.consoleLines = lines
    ;(console as any).log = (msg?: any) => { lines.push(String(msg ?? '')) }
    try {
        const s: any = this.settings
        console.log(s.record.name)
        console.log(s.record.age)
    } finally {
        console.log = original
    }
})

Then('the printed lines are:', function(this: BasicWorld, docString: string) {
    const expected = docString.trim().split(/\r?\n/)
    expect(this.consoleLines).to.deep.equal(expected)
});
