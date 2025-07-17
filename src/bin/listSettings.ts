import { extractEnvSpec } from './extractEnvSpec.js';
import { formatType } from './formatType.js';

function padRight(value: string, width: number): string {
    return value + ' '.repeat(width - value.length);
}

export async function printSettings(): Promise<void> {
    const spec = await extractEnvSpec();

    for (const [section, group] of Object.entries(spec)) {
        const entries = Object.entries(group).filter(([k]) => k !== '_description' && k !== '_hasAlias');
        const hasAlias = '_hasAlias' in group;

        const rows: string[][] = [];
        const header = ['Env Var', ...(hasAlias ? ['Alias'] : []), 'Usual Path', 'Type', 'Default'];
        rows.push(header);
        rows.push(header.map(h => '-'.repeat(h.length)));

        for (const [envar, entry] of entries) {
            if (typeof entry === 'object' && entry !== null) {
                const code = `settings.${section.toLowerCase()}.${entry.fieldName}`;
                const row = [
                    envar + (entry.secret ? ' (secret)' : ''),
                    ...(hasAlias ? [entry.alias ?? ''] : []),
                    code,
                    formatType(entry.type, entry.devOnly),
                    entry.default ?? ''
                ];
                rows.push(row);
            }
        }

        const colWidths = rows[0].map((_, i) => Math.max(...rows.map(row => row[i].length)));
        const containsSecrets = entries.some(([, entry]) => typeof entry === 'object' && entry?.secret);

        console.log(section.toLowerCase() + (containsSecrets ? ' (contains secrets)' : ''));
        console.log('='.repeat(section.length));

        for (const row of rows) {
            console.log(row.map((val, i) => padRight(val, colWidths[i])).join('  '));
        }

        console.log();
    }
}
