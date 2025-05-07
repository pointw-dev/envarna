import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';

const envFilename = '.env.template'
const ENV_OUTPUT = path.join(PROJECT_ROOT, envFilename);

export function writeEnvFile() {
  const spec = extractEnvSpec();

  const sections: string[] = [];

  for (const group of Object.values(spec)) {
    const lines = Object.entries(group).map(
      ([envVar, { type, default: def }]) => `${envVar}=${def ?? `{${type}}`}`
    );
    sections.push(lines.join('\n'));
  }

  fs.writeFileSync(ENV_OUTPUT, sections.join('\n\n') + '\n');
  console.log(`${envFilename} written to ${ENV_OUTPUT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeEnvFile();
}
