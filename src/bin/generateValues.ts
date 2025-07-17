import * as fs from 'fs';
import * as path from 'path';
import { camelCase } from 'change-case';
import { extractEnvSpec } from './extractEnvSpec.js';
import { formatType } from './formatType.js';
import { PROJECT_ROOT } from '../lib/paths.js';

const OUTPUT_FILE = path.join(PROJECT_ROOT, 'values.yaml');

export async function writeValuesYaml(skipDev = false): Promise<void> {
  const spec = await extractEnvSpec(undefined, skipDev);
  const lines: string[] = [];

  for (const [section, group] of Object.entries(spec)) {
    lines.push(`${section.toLowerCase()}:`);
    const entries = Object.entries(group).filter(([k]) => k !== '_description');

    for (const [, entry] of entries) {
      if (typeof entry === 'object' && entry !== null) {
        const key = camelCase(entry.fieldName);
        const typeLabel = formatType(entry);
        const value = entry.default ?? `{${typeLabel}}`;
        lines.push(`  ${key}: ${value}`);
      }
    }
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
  console.log(`values.yaml written to ${OUTPUT_FILE}`);
}
