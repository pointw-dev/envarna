import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'chai'
import yaml from 'yaml'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

interface CliWorld {
  jsonText?: string
  yamlText?: string
  envPath?: string
  valuesPath?: string
  tmpRoot?: string
  consoleLines?: string[]
}

type SpecEntry = {
  fieldName: string
  type: string
  default?: string
  alias?: string
  devOnly?: boolean
}

type Spec = Record<string, Record<string, SpecEntry | string | boolean>>

function buildStubSpec(): Spec {
  return {
    Demo: {
      _description: 'Demo settings',
      DEMO_APP_NAME: { fieldName: 'appName', type: 'string', default: 'myapp' },
      DEMO_MAX: { fieldName: 'max', type: 'number', default: '10' },
      DEMO_DEBUG: { fieldName: 'debug', type: 'boolean', default: 'false' },
      DEMO_DEV_ONLY: { fieldName: 'devOnlyFlag', type: 'boolean [optional, devOnly]', default: 'true', devOnly: true },
      DEMO_LOG_LEVEL: { fieldName: 'logLevel', type: 'string optional' },
    },
    Smtp: {
      _description: 'SMTP settings',
      _hasAlias: true,
      SMTP_FROM: { fieldName: 'fromEmail', type: 'string', default: 'noreply@example.org' },
      SMTP_PORT: { fieldName: 'port', type: 'number', default: '25' },
      SMTP_HOST: { fieldName: 'host', type: 'string', default: 'localhost', alias: 'MAIL_SERVER_HOST_NAME' },
    },
  }
}

function installExtractEnvSpecStub(spec: Spec, tmpRoot?: string) {
  const tsModulePath = require.resolve('../src/bin/extractEnvSpec')
  const jsModulePath = path.resolve(__dirname, '../src/bin/extractEnvSpec.js')
  const tsFormatPath = require.resolve('../src/bin/formatType')
  const jsFormatPath = path.resolve(__dirname, '../src/bin/formatType.js')
  const tsPathsPath = require.resolve('../src/lib/paths')
  const jsPathsPath = path.resolve(__dirname, '../src/lib/paths.js')
  const stub = {
    extractEnvSpec: async (_root?: unknown, skipDev?: boolean) => {
      if (!skipDev) return spec
      const filtered: Spec = {}
      for (const [group, entries] of Object.entries(spec)) {
        filtered[group] = {}
        for (const [key, meta] of Object.entries(entries)) {
          if (typeof meta !== 'object' || meta === null) { filtered[group][key] = meta as any; continue }
          if ((meta as any).devOnly) continue
          filtered[group][key] = meta
        }
      }
      return filtered
    }
  }
  // Install/replace the module in the require cache
  require.cache[tsModulePath] = {
    id: tsModulePath,
    filename: tsModulePath,
    loaded: true,
    exports: stub,
    children: [],
    paths: [],
  } as any
  require.cache[jsModulePath] = {
    id: jsModulePath,
    filename: jsModulePath,
    loaded: true,
    exports: stub,
    children: [],
    paths: [],
  } as any
  const formatStub = {
    formatType: (meta: any) => meta?.type ?? 'string'
  }
  require.cache[tsFormatPath] = {
    id: tsFormatPath,
    filename: tsFormatPath,
    loaded: true,
    exports: formatStub,
    children: [],
    paths: [],
  } as any
  require.cache[jsFormatPath] = {
    id: jsFormatPath,
    filename: jsFormatPath,
    loaded: true,
    exports: formatStub,
    children: [],
    paths: [],
  } as any
  if (tmpRoot) {
    const pathsStub = { PROJECT_ROOT: tmpRoot }
    require.cache[tsPathsPath] = {
      id: tsPathsPath,
      filename: tsPathsPath,
      loaded: true,
      exports: pathsStub,
      children: [],
      paths: [],
    } as any
    require.cache[jsPathsPath] = {
      id: jsPathsPath,
      filename: jsPathsPath,
      loaded: true,
      exports: pathsStub,
      children: [],
      paths: [],
    } as any
  }
  // Patch module resolver to redirect to our stubs
  const Module = require('module')
  const originalResolve = Module._resolveFilename
  Module._resolveFilename = function(request: string, parent: any, ...rest: any[]) {
    if (request.endsWith('/extractEnvSpec.js') || request === './extractEnvSpec.js') {
      return jsModulePath
    }
    if (request.endsWith('/formatType.js') || request === './formatType.js') {
      return jsFormatPath
    }
    if (tmpRoot && (request.endsWith('/paths.js') || request === '../lib/paths.js' || request === './paths.js')) {
      return jsPathsPath
    }
    return originalResolve.call(this, request, parent, ...rest)
  }
  // Invalidate dependents to ensure they re-read the stub
  try { delete require.cache[require.resolve('../src/bin/generateJson')] } catch {}
  try { delete require.cache[require.resolve('../src/bin/generateYaml')] } catch {}
  try { delete require.cache[require.resolve('../src/bin/generateDotEnv')] } catch {}
  try { delete require.cache[require.resolve('../src/bin/generateValues')] } catch {}
  try { delete require.cache[require.resolve('../src/bin/generateCompose')] } catch {}
  try { delete require.cache[require.resolve('../src/bin/generateK8s')] } catch {}
  try { delete require.cache[require.resolve('../src/bin/listSettings')] } catch {}
  try { delete require.cache[require.resolve('../src/bin/generateRaw')] } catch {}
}

Given('a stubbed CLI settings spec', function (this: CliWorld) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'envarna-cli-'))
  this.tmpRoot = tmp
  this.envPath = path.join(tmp, '.env.template')
  this.valuesPath = path.join(tmp, 'values.yaml')
  installExtractEnvSpecStub(buildStubSpec(), tmp)
})

When('I generate JSON with default options', async function (this: CliWorld) {
  const { generateJson } = require('../src/bin/generateJson')
  this.jsonText = await generateJson()
})

When('I generate JSON with code keys', async function (this: CliWorld) {
  const { generateJson } = require('../src/bin/generateJson')
  this.jsonText = await generateJson(null, false, true, false)
})

Then('the JSON group {string} has key {string} equal to {string}', function (this: CliWorld, group: string, key: string, expected: string) {
  const obj = JSON.parse(this.jsonText!)
  expect(obj[group]).to.be.an('object')
  expect(String(obj[group][key])).to.equal(expected)
})

Then('the JSON group {string} has key {string} equal to {int}', function (this: CliWorld, group: string, key: string, expected: number) {
  const obj = JSON.parse(this.jsonText!)
  expect(obj[group]).to.be.an('object')
  expect(obj[group][key]).to.equal(expected)
})

Then('the JSON group {string} has key {string} equal to boolean {word}', function (this: CliWorld, group: string, key: string, expectedWord: string) {
  const obj = JSON.parse(this.jsonText!)
  const expected = expectedWord === 'true'
  expect(obj[group]).to.be.an('object')
  expect(obj[group][key]).to.equal(expected)
})

When('I generate YAML with default options', async function (this: CliWorld) {
  const { generateYaml } = require('../src/bin/generateYaml')
  this.yamlText = await generateYaml(undefined, false, false, false)
})

Then('the YAML under root {string} group {string} has key {string} equal to {string}', function (this: CliWorld, root: string, group: string, key: string, expected: string) {
  const obj = yaml.parse(this.yamlText!)
  expect(obj[root]).to.be.an('object')
  expect(obj[root][group]).to.be.an('object')
  expect(String(obj[root][group][key])).to.equal(expected)
})

When('I generate JSON with root {string} flat {word} code {word} skipDev {word}', async function (this: CliWorld, root: string, flat: string, code: string, skip: string) {
  const { generateJson } = require('../src/bin/generateJson')
  const r = root === 'null' ? null : root
  this.jsonText = await generateJson(r, flat === 'true', code === 'true', skip === 'true')
})

Then('the flat JSON under root {string} has key {string} equal to {string}', function (this: CliWorld, root: string, key: string, expected: string) {
  const obj = JSON.parse(this.jsonText!)
  expect(String(obj[root][key])).to.equal(expected)
})

Then('the flat JSON under root {string} lacks key {string}', function (this: CliWorld, root: string, key: string) {
  const obj = JSON.parse(this.jsonText!)
  expect(obj[root]).to.be.an('object')
  expect(Object.prototype.hasOwnProperty.call(obj[root], key)).to.equal(false)
})

When('I generate YAML with root {string} flat {word} code {word} skipDev {word}', async function (this: CliWorld, root: string, flat: string, code: string, skip: string) {
  const { generateYaml } = require('../src/bin/generateYaml')
  this.yamlText = await generateYaml(root, flat === 'true', code === 'true', skip === 'true')
})

Then('the flat YAML under root {string} has key {string} equal to {string}', function (this: CliWorld, root: string, key: string, expected: string) {
  const obj = yaml.parse(this.yamlText!)
  expect(String(obj[root][key])).to.equal(expected)
})

Then('the flat YAML under root {string} lacks key {string}', function (this: CliWorld, root: string, key: string) {
  const obj = yaml.parse(this.yamlText!)
  expect(Object.prototype.hasOwnProperty.call(obj[root], key)).to.equal(false)
})

Then('the env file does not contain {string}', function (this: CliWorld, name: string) {
  const text = fs.readFileSync(this.envPath!, 'utf-8')
  expect(text.includes(name)).to.equal(false)
})

Then('values.yaml does not have key {string} under group {string}', function (this: CliWorld, key: string, group: string) {
  const obj = yaml.parse(fs.readFileSync(this.valuesPath!, 'utf-8'))
  expect(Object.prototype.hasOwnProperty.call(obj[group], key)).to.equal(false)
})

When('I print settings list skipping dev fields', async function (this: CliWorld) {
  const { printSettings } = require('../src/bin/listSettings')
  const original = console.log
  const lines: string[] = []
  this.consoleLines = lines
  ;(console as any).log = (msg?: any) => { lines.push(String(msg ?? '')) }
  try {
    await printSettings(true)
  } finally {
    console.log = original
  }
})

Then('the list output does not include {string}', function (this: CliWorld, text: string) {
  expect(this.consoleLines!.join('\n')).to.not.contain(text)
})

// ---- .env.template generation ----

When('I write the env template with default options', async function (this: CliWorld) {
  const { writeEnvFile } = require('../src/bin/generateDotEnv')
  await writeEnvFile(false)
})

Then('the env file contains {string} = {string}', function (this: CliWorld, name: string, value: string) {
  const text = fs.readFileSync(this.envPath!, 'utf-8')
  expect(text).to.contain(`${name}=${value}`)
})

// ---- values.yaml generation ----

When('I write values.yaml with default options', async function (this: CliWorld) {
  const { writeValuesYaml } = require('../src/bin/generateValues')
  await writeValuesYaml(false)
})
When('I write the env template skipping dev fields', async function (this: CliWorld) {
  const { writeEnvFile } = require('../src/bin/generateDotEnv')
  await writeEnvFile(true)
})

When('I write values.yaml skipping dev fields', async function (this: CliWorld) {
  const { writeValuesYaml } = require('../src/bin/generateValues')
  await writeValuesYaml(true)
})

Then('values.yaml has key {string} under group {string} equal to {string}', function (this: CliWorld, key: string, group: string, expected: string) {
  const obj = yaml.parse(fs.readFileSync(this.valuesPath!, 'utf-8'))
  expect(String(obj[group][key])).to.equal(expected)
})

// ---- compose and k8s ----

When('I generate compose env', async function (this: CliWorld) {
  const { writeComposeEnvFile } = require('../src/bin/generateCompose')
  this.yamlText = await writeComposeEnvFile(false)
})

Then('the compose yaml has {string}: {string}', function (this: CliWorld, name: string, value: string) {
  const obj = yaml.parse(this.yamlText!)
  expect(obj.environment[name]).to.equal(value)
})

When('I generate k8s env', async function (this: CliWorld) {
  const { generateK8s } = require('../src/bin/generateK8s')
  this.yamlText = await generateK8s(false)
})

Then('the k8s env has name {string} with value {string}', function (this: CliWorld, name: string, value: string) {
  const obj = yaml.parse(this.yamlText!)
  const match = (obj.env as any[]).find(e => e.name === name)
  expect(match).to.exist
  expect(String(match.value)).to.equal(value)
})

// ---- list and raw ----

When('I print settings list', async function (this: CliWorld) {
  const { printSettings } = require('../src/bin/listSettings')
  const original = console.log
  const lines: string[] = []
  this.consoleLines = lines
  ;(console as any).log = (msg?: any) => { lines.push(String(msg ?? '')) }
  try {
    await printSettings(false)
  } finally {
    console.log = original
  }
})

Then('the list output includes a header for {string}', function (this: CliWorld, group: string) {
  expect(this.consoleLines!.join('\n')).to.contain(group)
})

When('I generate raw JSON', async function (this: CliWorld) {
  const { writeRawEnvSpec } = require('../src/bin/generateRaw')
  this.jsonText = await writeRawEnvSpec(false)
})

Then('the raw JSON has group {string} and key {string}', function (this: CliWorld, group: string, key: string) {
  const obj = JSON.parse(this.jsonText!)
  expect(obj[group]).to.be.an('object')
  expect(obj[group][key]).to.exist
})
