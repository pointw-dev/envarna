import { expect } from 'chai';
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { EnvFixture } from './env-fixture'
import { BaseSettings, setting, createSettingsProxy, secret } from '../src';


interface DumpWorld {
  settings?: object;
  dump?: string;
}

let env: EnvFixture

Before(() => {
  env = new EnvFixture();
})

After(() => {
  env.cleanup()
})

Given('a settings object created following the standard pattern', function (this: DumpWorld) {
  class ApiSettings extends BaseSettings {
    @setting.string()
    host: string = 'host'
  }

  class FolderSettings extends BaseSettings {
    @setting.string()
    configFolder: string = 'config'

    @setting.string()
    workingFolder: string = 'working'
  }

  class DbSettings extends BaseSettings {
    @setting.string()
    @secret()
    connectionString: string = 'shhh'

    @setting.string()
    dbName: string = 'dev-db'
  }

  this.settings = createSettingsProxy({
    api: () => ApiSettings.load(),
    folder: () => FolderSettings.load(),
    db: () => DbSettings.load(),
  })
});

When('I dump the settings object', function (this: DumpWorld) {
  this.dump = JSON.stringify(this.settings)
});

Then('the result is stringified JSON', function () {
  expect(this.dump).to.be.a('string')
});