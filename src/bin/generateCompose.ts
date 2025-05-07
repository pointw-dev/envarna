import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';

const __filename = fileURLToPath(import.meta.url);
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'environment.yml');

export function writeComposeEnvFile(): void {
    const spec = extractEnvSpec();
    const lines: string[] = [];

    lines.push('    environment:');

    for (const group of Object.values(spec)) {
        for (const [envVar, { default: def, type }] of Object.entries(group)) {
            const value = def ?? `{${type}}`;
            lines.push(`      ${envVar}: ${value}`);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
    console.log(`environment.yml written to ${OUTPUT_FILE}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    writeComposeEnvFile();
}
