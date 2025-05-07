import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';

const envFilename = '.env.sample'
const OUTPUT_FILE = path.join(PROJECT_ROOT, envFilename);

export function writeEnvFile(): void {
  const spec = extractEnvSpec();

  const lines: string[] = [];
  for (const [, group] of Object.entries(spec)) {
    const entries = Object.entries(group).filter(([k]) => k !== '_description');

    for (const [envVar, entry] of entries) {
      if (typeof entry === 'object' && entry !== null) {
        const def = entry.default ?? `{${entry.type}}`;
        lines.push(`${envVar}=${def}`);
      }
    }
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
  console.log(`${envFilename} written to ${OUTPUT_FILE}`);
}
