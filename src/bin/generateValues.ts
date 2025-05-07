import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';

const __filename = fileURLToPath(import.meta.url);
const VALUES_OUTPUT = path.join(PROJECT_ROOT, 'values.yaml');

function toYaml(obj: Record<string, any>, indent = 0): string {
  const pad = '  '.repeat(indent);
  const entries = Object.entries(obj);
  return entries
      .map(([key, val], index) => {
        const yaml =
            typeof val === 'object' && val !== null
                ? `${pad}${key}:\n${toYaml(val, indent + 1)}`
                : `${pad}${key}: ${typeof val === 'string' ? `"${val}"` : val}`;
        return yaml + (index < entries.length - 1 && indent === 0 ? '\n' : '');
      })
      .join('\n');
}
export function writeValuesYaml(): void {
  const spec = extractEnvSpec();

  const yamlObj: Record<string, Record<string, string | number>> = {};

  for (const [section, group] of Object.entries(spec)) {
    const sectionKey = section.toLowerCase();
    yamlObj[sectionKey] = {};

    for (const [, { type, default: def, originalName }] of Object.entries(group)) {
      yamlObj[sectionKey][originalName] = def ?? `{${type}}`;
    }
  }

  const yamlContent = toYaml(yamlObj) + '\n';
  fs.writeFileSync(VALUES_OUTPUT, yamlContent);
  console.log(`values.yaml written to ${VALUES_OUTPUT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeValuesYaml();
}
