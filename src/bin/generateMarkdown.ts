import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';

const __filename = fileURLToPath(import.meta.url);
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'SETTINGS.md');

function toMarkdownTable(
    section: string,
    group: Record<
        string,
        {
            default: string | null;
            required: boolean;
            originalName: string;
            secret: boolean;
            type: string;
        }
    >
): string {
    const header = `| Code | Envar | Type | Default | Required |
| ----------------------- | -------------- | --------- | --------- | -------- |`;

    const rows = Object.entries(group).map(([envVar, entry]) => {
        const {
            default: def,
            required,
            originalName,
            secret,
            type
        } = entry;

        const code = `settings.${section.toLowerCase()}.${originalName}` + (secret ? ' (secret)' : '');
        const value = def ?? '';
        const req = required ? 'Yes' : 'No';

        return `| ${code} | ${envVar} | ${type} | ${value} | ${req} |`;
    });

    const hasSecrets = Object.values(group).some(entry => entry.secret);
    const headerLine = `## ${section.toLowerCase()}`;
    const secretsLine = hasSecrets ? `\n> contains secrets\n` : '';

    return `${headerLine}${secretsLine}\n\n${header}\n${rows.join('\n')}\n`;
}

export function writeSettingsMarkdown(): void {
    const spec = extractEnvSpec();
    const sections = Object.entries(spec)
        .map(([section, group]) => toMarkdownTable(section, group))
        .join('\n\n');

    const doc = '# Settings\n\n' + sections + '\n';
    fs.writeFileSync(OUTPUT_FILE, doc);
    console.log(`SETTINGS.md written to ${OUTPUT_FILE}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    writeSettingsMarkdown();
}
