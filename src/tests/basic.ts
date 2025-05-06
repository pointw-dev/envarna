import { expect } from 'chai';
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { EnvFixture } from './env-fixture.js'
import { BaseSettings, setting } from '../lib/index.js';


type SettingsClass = typeof BaseSettings;
interface TestWorld {
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

Given('an .env file that contains:', function (docString: string) {
    env.createDotenvFile(docString);
    env.loadDotenv();
});

Given('a class named ApiSettings includes a setting named host', function(this: TestWorld) {
    class ApiSettings extends BaseSettings {
        @setting.string()
        host: string = 'nope'
    }

    this.settingsClass = ApiSettings
})


When('I load settings', function () {
    this.settings = this.settingsClass.load();  // or new BaseSettings().load() if not static
});

When('I load settings with a value {string}', function (injection: string) {
    this.settings = this.settingsClass.load({host: injection});
});


Then('the setting value is {string}', function (expected: string) {
    const actual = this.settings.host;
    expect(actual).to.equal(expected);
});
