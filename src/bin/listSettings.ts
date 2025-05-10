import { extractEnvSpec } from './extractEnvSpec.js';

function padRight(value: string, width: number): string {
    return value + ' '.repeat(width - value.length);
}

export async function printSettings(): Promise<void> {
    const spec = await extractEnvSpec();

    for (const [section, group] of Object.entries(spec)) {
        const entries = Object.entries(group).filter(([k]) => k !== '_description');

        const rows: string[][] = [];
        rows.push(['Envar', 'Code', 'Type', 'Default']);
        rows.push(['--------------', '-----------------------', '--------------', '--------']);

        for (const [envar, entry] of entries) {
            if (typeof entry === 'object' && entry !== null) {
                const code = `settings.${section.toLowerCase()}.${entry.originalName}`;
                rows.push([envar + (entry.secret ? ' (secret)' : ''), code, entry.type, entry.default ?? '']);
            }
        }

        const colWidths = rows[0].map((_, i) => Math.max(...rows.map(row => row[i].length)));
        const hasSecrets = entries.some(([, entry]) => typeof entry === 'object' && entry?.secret);

        console.log(section.toLowerCase() + (hasSecrets ? ' (contains secrets)' : ''));
        console.log('='.repeat(section.length));

        for (const row of rows) {
            console.log(row.map((val, i) => padRight(val, colWidths[i])).join('  '));
        }

        console.log();
    }
}
