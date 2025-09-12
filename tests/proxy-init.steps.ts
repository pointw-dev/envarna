import { Before, After, Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'chai'
import { BaseSettings, setting, createSettingsProxy } from '../src'

interface World {
  settings?: any
  error?: Error
  TestClass?: typeof BaseSettings
}

Before(function () {
  // Reset global initialization state between scenarios (test helper)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { __resetInitializationForTest } = require('../src/lib/initializeLoaders')
    if (typeof __resetInitializationForTest === 'function') __resetInitializationForTest()
  } catch {}
  (this as World).settings = undefined
  ;(this as World).error = undefined
})

After(function () {
  (this as World).settings = undefined
})

Given('a blank settings proxy', function (this: World) {
  this.settings = createSettingsProxy()
})

When('I try to access the key {string}', function (this: World, key: string) {
  try {
    // @ts-ignore
    const _ = this.settings[key]
  } catch (e: any) {
    this.error = e
  }
})

Then('an error is thrown containing {string}', function (this: World, part: string) {
  expect(this.error).to.be.instanceOf(Error)
  expect(String(this.error?.message)).to.contain(part)
})

Given('a typed proxy for a class named TestSettings with a field named flag defaulting to {string}', function (this: World, def: string) {
  class TestSettings extends BaseSettings {
    @setting.string()
    flag: string = def
  }
  this.TestClass = TestSettings
  this.settings = createSettingsProxy({ test: TestSettings })
})

Then('settings is not initialized', function (this: World) {
  expect(this.settings.$initialized).to.equal(false)
})

When('I initialize settings now setting flag to {string}', async function (this: World, value: string) {
  await this.settings.$override({
    test: () => {
      const Klass = this.TestClass!
      return (Klass as any).load({ flag: value })
    }
  })
})

Then('settings is initialized', function (this: World) {
  expect(this.settings.$initialized).to.equal(true)
})

When('I schedule async initialization after {int} ms setting flag to {string}', function (this: World, ms: number, value: string) {
  const s = this.settings
  setTimeout(() => {
    s.$override({
      test: async () => {
        class Local extends BaseSettings { @setting.string() flag: string = value }
        return Local.load({ flag: value })
      }
    })
  }, ms)
})

Then('waiting for settings to be ready succeeds', async function (this: World) {
  await this.settings.$ready()
})

Given('a proxy with an async loader for key {string}', function (this: World, key: string) {
  class Dummy extends BaseSettings {
    @setting.string()
    name: string = 'x'
  }
  this.settings = createSettingsProxy({ [key]: async () => {
    return new Promise<InstanceType<typeof Dummy>>((resolve) => {
      setTimeout(() => resolve(Dummy.load({ name: 'ok' })), 10)
    })
  } })
})

When('I stringify the settings object', function (this: World) {
  try {
    JSON.stringify(this.settings)
  } catch (e: any) {
    this.error = e
  }
})
