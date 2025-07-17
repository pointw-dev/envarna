import * as fs from 'fs';
import * as path from 'path';
import { extractEnvSpec } from './extractEnvSpec.js';
import { PROJECT_ROOT } from '../lib/paths.js';

const OUTPUT_FILE = path.join(PROJECT_ROOT, 'SETTINGS.md');

type EnvVarSpec = {
    default: string | null;
    fieldName: string;
    secret: boolean;
    devOnly: boolean;
    type: string;
    description?: string | null;
    pattern?: string | null;
    alias?: string;
};

type EnvVarGroup = {
    _description?: string | null;
    _hasAlias?: boolean;
} & Record<string, EnvVarSpec | unknown>;  // key point: we acknowledge mixed types

function isEnvVarSpec(entry: unknown): entry is EnvVarSpec {
    return (
        typeof entry === 'object' &&
        entry !== null &&
        'fieldName' in entry &&
        typeof (entry as any).fieldName === 'string'
    );
}

function toMarkdownTable(section: string, group: EnvVarGroup): string {
    const description = group._description ?? null;
    const hasAlias = group._hasAlias === true;

    const entries = Object.entries(group).filter(
        ([k, v]) => !k.startsWith('_') && isEnvVarSpec(v)
    ) as [string, EnvVarSpec][];

    const header = `| Env Var |${hasAlias ? ' Alias |' : ''} Usual Path | Type | Default |
| -------------- |${hasAlias ? ' ------ |' : ''} ----------------------- | ------------------ | --------- |`;

    const rows = entries.map(([envar, entry]) => {
        const code = `settings.${section.toLowerCase()}.${entry.fieldName}`;
        const aliasCell = hasAlias ? ` ${entry.alias ?? ''} |` : '';
        const typeCell = `${entry.type}${entry.devOnly ? ' [devOnly]' : ''}`;
        return `| ${envar + (entry.secret ? ' (secret)' : '')} |${aliasCell} ${code} | ${typeCell} | ${entry.default ?? ''} |`;
    });

    const hasSecrets = entries.some(([, entry]) => entry.secret);
    const sectionHeader = `### ${section.toLowerCase()}`;
    const secretsLine = hasSecrets ? `\n> contains secrets\n` : '';
    const descriptionLine = description ? `\n${description}\n` : '';

    const details = entries
        .filter(([, entry]) => entry.description || entry.pattern)
        .map(([envar, entry]) => {
            const lines = [];
            if (entry.description) lines.push(entry.description);
            if (entry.pattern) lines.push(`**Pattern:** \`${entry.pattern}\``);
            return `#### \`${envar}\`\n\n${lines.join('\n\n')}`;
        });

    const extras = details.length > 0 ? `\n\n${details.join('\n\n')}` : '';

    return `${sectionHeader}${secretsLine}${descriptionLine}\n${header}\n${rows.join('\n')}${extras}`;
}

export async function writeSettingsMarkdown(): Promise<void> {
    const spec = await extractEnvSpec();
    const sections = Object.entries(spec)
        .map(([section, group]) => toMarkdownTable(section, group))
        .join('\n\n');

    const doc = '## Settings\n\n' + sections + '\n';
    fs.writeFileSync(OUTPUT_FILE, doc);
    console.log(`SETTINGS.md written to ${OUTPUT_FILE}`);
}
