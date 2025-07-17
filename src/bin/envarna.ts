#!/usr/bin/env node

import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

import { writeSettingsMarkdown } from "./generateMarkdown.js"
import { writeEnvFile } from './generateDotEnv.js'
import { writeValuesYaml } from './generateValues.js'
import { printSettings } from './listSettings.js'
import { writeComposeEnvFile } from './generateCompose.js'
import { generateJson } from './generateJson.js'
import { generateYaml } from './generateYaml.js'
import { generateK8s } from './generateK8s.js'
import { writeRawEnvSpec } from "./generateRaw.js";

// Locate package.json relative to *compiled* file (e.g., dist/bin/envarna.js)
// const __filename = ''  // fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
const pkgPath = path.resolve(__dirname, '..', '..', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))


yargs(hideBin(process.argv))
  .version(pkg.version)
  .scriptName('envarna')
  .option('skip-dev', {
    type: 'boolean',
    default: false,
    describe: 'Exclude fields marked @devOnly',
  })

  .command('list', 'Display settings details', () => {}, async argv => {
    await printSettings(argv.skipDev as boolean)
  })
  .command('env', 'Write ".env.template"', () => {}, async argv => {
    await writeEnvFile(argv.skipDev as boolean)
  })
  .command('md', 'Write "SETTINGS.md"', () => {}, async argv => {
    await writeSettingsMarkdown(argv.skipDev as boolean)
  })
  .command('values', 'Write "values.yaml"', () => {}, async argv => {
    await writeValuesYaml(argv.skipDev as boolean)
  })
  .command('compose', 'Display docker-compose style environment yaml', () => {}, async argv => {
    const output = await writeComposeEnvFile(argv.skipDev as boolean);
    console.log(output);
  })
  .command('k8s', 'Display kubernetes style env var structure', () => {}, async argv => {
      const output = await generateK8s(argv.skipDev as boolean);
      console.log(output);
    }
  )
  .command(
    'json [root]',
    'Display JSON settings structure',
    yargs => yargs.positional('root', {
      describe: 'Optional root object name',
      type: 'string',
      default: null,
    })
    .option('flat', {
        type: 'boolean',
        describe: 'Flatten the output under root (no group nesting)',
        default: false,
    })
    .option('code', {
      type: 'boolean',
      describe: 'Use the camelCase class field, not the envar',
      default: false,
    }),
    async argv => {
      const output = await generateJson(argv.root ?? null, argv.flat, argv.code, argv.skipDev as boolean);
      console.log(output);
    }
  )
  .command(
    'yaml [root]',
    'Display YAML settings structure',
    yargs => yargs.positional('root', {
      describe: 'Optional root object name',
      type: 'string',
      default: 'settings',
    })
    .option('flat', {
        type: 'boolean',
        describe: 'Flatten the output under root (no group nesting)',
        default: false,
    })
    .option('code', {
        type: 'boolean',
        describe: 'Use the camelCase class field, not the envar',
        default: false,
    }),
    async argv => {
      const output = await generateYaml(argv.root, argv.flat, argv.code, argv.skipDev as boolean);
      console.log(output);
    }
  )
  .command('raw', 'Display the raw structure extracted from the settings classes used to power the other formats', () => {}, async argv => {
    const output = await writeRawEnvSpec(argv.skipDev as boolean);
    console.log(output);
  })
  .demandCommand()
  .strict()
  .help()
  .parse();
