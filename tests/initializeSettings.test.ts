import { strict as assert } from 'assert'
import { BaseSettings, setting, createSettingsProxy, initializeLoaders } from '../src';


class MongoSettings extends BaseSettings {
  @setting.string()
  uri = ''

  @setting.string()
  dbName = 'test'

}

const settings = createSettingsProxy()

async function fakeSecretFetch(): Promise<string> {
  return 'mongodb://secret-uri'
}

async function run() {
  await initializeLoaders({
    mongo: async () => {
      const uri = await fakeSecretFetch()
      return MongoSettings.load({ uri })
    }
  })

  assert.equal(settings.mongo.uri, 'mongodb://secret-uri')
}

run()
