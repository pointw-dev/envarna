#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { writeSettingsMarkdown } from "./generateMarkdown.js";
import { writeEnvFile } from './generateDotEnv.js'
import { writeValuesYaml } from './generateValues.js'
import { printSettings } from './listSettings.js';
import path from 'path'

// Locate package.json relative to *compiled* file (e.g., dist/bin/envarna.js)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pkgPath = path.resolve(__dirname, '..', '..', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))


yargs(hideBin(process.argv))
  .version(pkg.version)
  .scriptName('envarna')
  .command('list', 'Displays settings details', () => {}, () => {
    printSettings()
  })
  .command('md', 'Generate "SETTINGS.md" file', () => {}, () => {
    writeSettingsMarkdown()
  })
  .command('env', 'Generate ".env.sample" file', () => {}, () => {
    writeEnvFile()
  })
  .command('values', 'Generate "values.yaml" file', () => {}, () => {
    writeValuesYaml()
  })
  .demandCommand()
  .strict()
  .help()
  .parse();

