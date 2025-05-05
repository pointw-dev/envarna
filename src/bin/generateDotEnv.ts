import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';

const __filename = fileURLToPath(import.meta.url);
const ENV_OUTPUT = path.join(PROJECT_ROOT, '.env.sample');

export function writeEnvFile() {
  const spec = extractEnvSpec();

  const sections: string[] = [];

  for (const group of Object.values(spec)) {
    const lines = Object.entries(group).map(
      ([envVar, { default: def }]) => `${envVar}=${def ?? '--VALUE--'}`
    );
    sections.push(lines.join('\n'));
  }

  fs.writeFileSync(ENV_OUTPUT, sections.join('\n\n') + '\n');
  console.log(`.env.sample written to ${ENV_OUTPUT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeEnvFile();
}
