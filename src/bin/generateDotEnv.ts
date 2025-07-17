import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec } from './extractEnvSpec.js';
import { formatType } from './formatType.js';
import { PROJECT_ROOT } from '../lib/paths.js';

const envFilename = '.env.template';
const OUTPUT_FILE = path.join(PROJECT_ROOT, envFilename);

export async function writeEnvFile(): Promise<void> {
  const spec = await extractEnvSpec();

  const lines: string[] = [];
  for (const [, group] of Object.entries(spec)) {
    for (const [envar, entry] of Object.entries(group)) {
      if (envar.startsWith('_')) continue;
      if (typeof entry !== 'object' || entry === null || !('default' in entry)) continue;

      const name = entry.alias ?? envar;
      const typeLabel = formatType(entry.type, entry.devOnly);
      const def = entry.default ?? `{${typeLabel}}`;
      lines.push(`${name}=${def}`);
    }

    lines.push('');
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
  console.log(`${envFilename} written to ${OUTPUT_FILE}`);
}
