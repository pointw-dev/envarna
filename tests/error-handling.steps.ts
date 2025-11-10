import { expect } from 'chai'
import { Given, Then } from '@cucumber/cucumber'
import { BaseSettings } from '../src'

// World shape shared with other step files at runtime
type SettingsClass = typeof BaseSettings

interface World {
  settingsClass?: SettingsClass
  error?: any
}

// Utility: add a validated field to the current class without replacing it
Given('the class also includes a setting named {string} validated as {string}', function (this: World, field: string, expr: string) {
  if (!this.settingsClass) {
    class Tmp extends BaseSettings {}
    this.settingsClass = Tmp
  }
  const Klass = this.settingsClass as any
  const api = require('../src') as any
  const { z } = require('zod')
  const build: any = new Function('v','z', `return (${expr});`)
  const schema = build(api.v, z)
  api.setting(schema)(Klass.prototype, field)
  if (!(field in Klass.prototype)) {
    Klass.prototype[field] = undefined
  }
})

// Assertions specific to domain error handling
Then('the error is a validation error', function (this: World) {
  const { isValidationError, EnvarnaValidationError } = require('../src') as any
  expect(this.error).to.be.instanceOf(Error)
  expect(isValidationError(this.error)).to.equal(true)
  expect(this.error).to.be.instanceOf(EnvarnaValidationError)
})

Then('the error has {int} issues', function (this: World, count: number) {
  const { isValidationError } = require('../src') as any
  expect(isValidationError(this.error)).to.equal(true)
  expect(Array.isArray(this.error.issues)).to.equal(true)
  expect(this.error.issues.length).to.equal(count)
})

Then('the error includes an issue at path {string}', function (this: World, path: string) {
  const joined = (p: (string|number)[]) => p.map(String).join('.')
  const hit = (this.error?.issues ?? []).some((i: any) => joined(i.path) === path)
  expect(hit).to.equal(true)
})

Then('the error includes an issue message containing {string}', function (this: World, part: string) {
  const messages: string[] = (this.error?.issues ?? []).map((i: any) => String(i.message))
  expect(messages.join('\n')).to.contain(part)
})

Then('the error cause is present', function (this: World) {
  expect(this.error?.cause).to.not.equal(undefined)
})
