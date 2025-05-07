import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec } from './extractEnvSpec.js';
import { PROJECT_ROOT } from '../lib/paths.js';

const OUTPUT_FILE = path.join(PROJECT_ROOT, 'environment.yml');

export async function writeComposeEnvFile(): Promise<void> {
    const spec = await extractEnvSpec();

    const lines: string[] = ['environment:'];
    for (const [, group] of Object.entries(spec)) {
        const entries = Object.entries(group).filter(([k]) => k !== '_description');

        for (const [envVar, entry] of entries) {
            if (typeof entry === 'object' && entry !== null) {
                const def = entry.default ?? `{${entry.type}}`;
                lines.push(`  ${envVar}: ${def}`);
            }
        }
    }

    fs.writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n');
    console.log(`environment.yml written to ${OUTPUT_FILE}`);
}
