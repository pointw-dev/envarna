import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec } from './extractEnvSpec.js';
import { PROJECT_ROOT } from '../lib/paths.js';

const envFilename = '.env.template'
const OUTPUT_FILE = path.join(PROJECT_ROOT, envFilename);

export async function writeEnvFile(): Promise<void> {
  const spec = await extractEnvSpec();

  const lines: string[] = [];
  for (const [, group] of Object.entries(spec)) {
    const entries = Object.entries(group).filter(([k]) => k !== '_description');

    for (const [envar, entry] of entries) {
      if (typeof entry === 'object' && entry !== null) {
        const def = entry.default ?? `{${entry.type}}`;
        lines.push(`${envar}=${def}`);
      }
    }
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
  console.log(`${envFilename} written to ${OUTPUT_FILE}`);
}
