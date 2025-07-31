import { expect } from 'chai';
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { EnvFixture } from './env-fixture'
import { BaseSettings, setting, createSettingsProxy, secret, initializeLoaders } from '../src';


interface LoaderWorld {
  settings: Record<string, {}>;
  initialize: () => Promise<void>;
}

let env: EnvFixture

Before(() => {
  env = new EnvFixture();
})

After(() => {
  env.cleanup()
})

Given('a settings object created following the async loading pattern', function (this: LoaderWorld) {
  function sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
  async function simulateGetUri(): Promise<string> {
    console.log("Starting delayed operation...");
    await sleep(500); // Simulate a 2-second delay
    console.log("Delayed operation complete!");
    return 'mongodb://localhost:27017';
  }

  class DbSettings extends BaseSettings {
    @setting.string()
    @secret()
    connectionString: string = 'shhh'

    @setting.string()
    name: string = 'dev-db'
  }

  this.settings = createSettingsProxy();

  this.initialize = async () => {
    await initializeLoaders({
      db: async () => {
        const uri = await simulateGetUri()
        return uri ? DbSettings.load({ connectionString: uri }) : DbSettings.load()
      },
    })
  }
});

When('I initialize settings', async function (this: LoaderWorld) {
  await this.initialize();
});

Then("the setting {string} key's value is {string}", async function (this: LoaderWorld, key: string, expected: string) {
  expect(this.settings[key]).to.eq(expected);
});
