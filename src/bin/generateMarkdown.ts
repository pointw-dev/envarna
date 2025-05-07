import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec, PROJECT_ROOT } from './extractEnvSpec.js';

const OUTPUT_FILE = path.join(PROJECT_ROOT, 'SETTINGS.md');

function toMarkdownTable(
    section: string,
    group: Record<
        string,
        {
            default: string | null;
            originalName: string;
            secret: boolean;
            type: string;
            description?: string | null;
            pattern?: string | null;
        }
    >
): string {
    const description = group._description ?? null;
    const entries = Object.entries(group).filter(([k]) => k !== '_description');

    const header = `| Envar | Code | Type | Default |
| -------------- | ----------------------- | ------------------ | --------- |`;

    const rows = entries.map(([envVar, entry]) => {
        const code = `settings.${section.toLowerCase()}.${entry.originalName}`;
        return `| ${envVar + (entry.secret ? ' (secret)' : '')} | ${code} | ${entry.type} | ${entry.default ?? ''} |`;
    });

    const hasSecrets = entries.some(([, entry]) => entry.secret);
    const sectionHeader = `## ${section.toLowerCase()}`;
    const secretsLine = hasSecrets ? `\n> contains secrets\n` : '';
    const descriptionLine = description ? `\n${description}\n` : '';

    // Add field-level detail blocks
    const details = entries
        .filter(([, entry]) => entry.description || entry.pattern)
        .map(([envVar, entry]) => {
            const code = `settings.${section.toLowerCase()}.${entry.originalName}`;
            const lines = [];

            if (entry.description) lines.push(entry.description);
            if (entry.pattern) lines.push(`**Pattern:** \`${entry.pattern}\``);

            return `### ${code}\n\n${lines.join('\n\n')}`;
        });

    const extras = details.length > 0 ? `\n\n${details.join('\n\n')}` : '';

    return `${sectionHeader}${secretsLine}${descriptionLine}\n${header}\n${rows.join('\n')}${extras}`;
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
