import { expect } from 'chai';
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { EnvFixture } from './env-fixture'
import { BaseSettings, setting, createSettingsProxy, secret } from '../src';
import { isSecret } from '../src/lib/decorators';


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

Then('the setting {string} is marked secret', function (this: DumpWorld, path: string) {
  const parts = path.split('.')
  if (parts.length !== 2) throw new Error('path must be of form "group.field"')
  const [group, field] = parts
  const instance: any = (this as any).settings[group]
  expect(instance).to.exist
  expect(isSecret(instance, field)).to.eq(true)
});

Given('a settings object with SMTP settings where password is marked secret', function (this: DumpWorld) {
  class SmtpSettings extends BaseSettings {
    @setting.string()
    host: string = 'localhost'

    @setting.number()
    port: number = 25

    @setting.string()
    @secret()
    password: string = 'shhh'
  }

  this.settings = createSettingsProxy({
    smtp: () => SmtpSettings.load(),
  })
});

Given('a settings object with Redis settings where uri is marked secret', function (this: DumpWorld) {
  class RedisSettings extends BaseSettings {
    @setting.string()
    @secret()
    uri: string = 'redis://localhost:6379'
  }

  this.settings = createSettingsProxy({
    redis: () => RedisSettings.load(),
  })
});
