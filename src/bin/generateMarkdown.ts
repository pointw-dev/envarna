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
        { default: string | null; optional: boolean; originalName: string }
    >
): string {
    const header = `| Code | Envar | Default | Optional |
| ----------------------- | -------------- | --------- | -------- |`;

    const rows = Object.entries(group).map(([envVar, { default: def, optional, originalName }]) => {
        const code = `settings.${section.toLowerCase()}.${originalName}`;
        const value = def ?? '';
        const opt = optional ? 'Yes' : 'No';
        return `| ${code} | ${envVar} | ${value} | ${opt} |`;
    });

    return `## ${section.toLowerCase()}\n\n${header}\n${rows.join('\n')}\n`;
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
