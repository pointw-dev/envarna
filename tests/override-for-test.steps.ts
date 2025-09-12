import { Before, After, Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'chai'
import { BaseSettings, setting, createSettingsProxy } from '../src'

interface World {
  PaginationClass?: typeof BaseSettings
  settings?: any
  printed?: string[]
  appSettings?: any
}

Before(function () {
  this.printed = []
  try {
    const { __resetInitializationForTest } = require('../src/lib/initializeLoaders')
    if (typeof __resetInitializationForTest === 'function') __resetInitializationForTest()
  } catch {}
})

After(function () {
  // best-effort: clear override if class exists
  if (this.PaginationClass && typeof (this.PaginationClass as any).clearOverride === 'function') {
    ;(this.PaginationClass as any).clearOverride()
  }
})

Given('a PaginationSettings class with default maxPageSize {int}', function (this: World, def: number) {
  class PaginationSettings extends BaseSettings {
    @setting.number()
    maxPageSize: number = def
  }
  this.PaginationClass = PaginationSettings
})

Given('a lazy settings proxy exposing pagination', function (this: World) {
  const Klass = this.PaginationClass!
  this.settings = createSettingsProxy({ pagination: () => (Klass as any).load() })
})

Given('I override PaginationSettings for tests with {string}', function (this: World, json: string) {
  const overrides = JSON.parse(json)
  const Klass = this.PaginationClass!
  ;(Klass as any).overrideForTest(overrides)
})

Given('I override PaginationSettings for tests with:', function (this: World, doc: string) {
  const overrides = JSON.parse(doc)
  const Klass = this.PaginationClass!
  ;(Klass as any).overrideForTest(overrides)
})

Given('I clear the PaginationSettings test override', function (this: World) {
  const Klass = this.PaginationClass!
  ;(Klass as any).clearOverride()
})

When('my app lists widgets with no page size', function (this: World) {
  const printed = this.printed!
  // Simulate app code: reads from settings without DI/mocks
  const settings = this.settings!
  function showWidgets(pageSize?: number) {
    const size = pageSize ?? settings.pagination.maxPageSize
    for (let i = 1; i <= size; i++) printed.push(`widget #${i}`)
  }
  showWidgets()
})

Then('it prints {int} widgets', function (this: World, expected: number) {
  expect(this.printed).to.have.length(expected)
})

Given('an app that reads settings from a module-level variable', function (this: World) {
  // Default appSettings uses our lazy proxy (created later or mocked by step)
  this.appSettings = this.settings
})

Given('I mock app settings to {string}', function (this: World, json: string) {
  this.appSettings = JSON.parse(json)
})

Given('I mock app settings to:', function (this: World, doc: string) {
  this.appSettings = JSON.parse(doc)
})

When('my app lists widgets with no page size using the mock', function (this: World) {
  const printed = this.printed!
  const appSettings = this.appSettings!
  function showWidgets(pageSize?: number) {
    const size = pageSize ?? appSettings.pagination.maxPageSize
    for (let i = 1; i <= size; i++) printed.push(`widget #${i}`)
  }
  showWidgets()
})
