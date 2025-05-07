import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';
import { camelCase } from 'change-case';

const OUTPUT_FILE = path.join(PROJECT_ROOT, 'values.yaml');

export function writeValuesYaml(): void {
  const spec = extractEnvSpec();
  const lines: string[] = [];

  for (const [section, group] of Object.entries(spec)) {
    lines.push(`${section.toLowerCase()}:`);
    const entries = Object.entries(group).filter(([k]) => k !== '_description');

    for (const [, entry] of entries) {
      if (typeof entry === 'object' && entry !== null) {
        const key = camelCase(entry.originalName);
        const value = entry.default ?? `{${entry.type}}`;
        lines.push(`  ${key}: ${value}`);
      }
    }
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
  console.log(`values.yaml written to ${OUTPUT_FILE}`);
}
