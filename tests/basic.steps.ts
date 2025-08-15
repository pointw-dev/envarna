import { expect } from 'chai';
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { EnvFixture } from './env-fixture'
import { BaseSettings, setting } from '../src';
import { set } from "zod";
import { de } from "zod/dist/types/v4/locales";


type SettingsClass = typeof BaseSettings;

interface BasicWorld {
    settingsClass?: SettingsClass;
    settings?: BaseSettings;
}

let env: EnvFixture

Before(() => {
    env = new EnvFixture();
})

After(() => {
    env.cleanup()
})


Given('the environment variable {string} is set to {string}', function (key: string, value: string) {
    env.setEnvVariable(key, value);
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
    default:
      throw new Error(`Unknown type "${type}"`);
  }
  decorator(Klass.prototype, name)
})


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


Then('the setting {string} value is {string}', function (settingKey: string, expected: string) {
    const actual = this.settings[settingKey].toString();
    expect(actual).to.equal(expected);
});
