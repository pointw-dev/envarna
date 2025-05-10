import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec } from './extractEnvSpec.js';

export async function writeComposeEnvFile(): Promise<string> {
    const spec = await extractEnvSpec();

    const lines: string[] = ['environment:'];
    for (const [, group] of Object.entries(spec)) {
        const entries = Object.entries(group).filter(([k]) => k !== '_description');

        for (const [envar, entry] of entries) {
            if (typeof entry === 'object' && entry !== null) {
                const def = entry.default ?? `{${entry.type}}`;
                lines.push(`  ${envar}: ${def}`);
            }
        }
    }

    return lines.join('\n') + '\n';
}
