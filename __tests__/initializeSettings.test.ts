import { strict as assert } from 'assert'
import { BaseSettings, setting, createSettingsProxy, initializeSettings } from '../src';


class MongoSettings extends BaseSettings {
  @setting.string()
  uri = ''
}

const settings = createSettingsProxy()

async function fakeSecretFetch(): Promise<string> {
  return 'mongodb://secret-uri'
}

async function run() {
  await initializeSettings({
    mongo: async () => {
      const uri = await fakeSecretFetch()
      return MongoSettings.load({ uri })
    }
  })

  assert.equal(settings.mongo.uri, 'mongodb://secret-uri')
}

run()
