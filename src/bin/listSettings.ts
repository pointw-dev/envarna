import { extractEnvSpec } from './extractEnvSpec.js';
import { fileURLToPath } from 'url';

function padRight(value: string, width: number): string {
    return value + ' '.repeat(width - value.length);
}

export function printSettings(): void {
    const spec = extractEnvSpec();

    for (const [section, group] of Object.entries(spec)) {
        const rows: string[][] = [];

        // Header and rule
        rows.push(['Code', 'Envar', 'Type', 'Default']);
        rows.push(['-----------------------', '--------------', '------------------', '---------']);

        for (const [envVar, { default: def, originalName, secret, type }] of Object.entries(group)) {
            rows.push([
                `settings.${section.toLowerCase()}.${originalName}${secret ? ' (secret)' : ''}`,
                envVar,
                type,
                def ?? '',
            ]);
        }

        // Determine column widths
        const colWidths = rows[0].map((_, colIndex) =>
            Math.max(...rows.map(row => row[colIndex].length))
        );

        // Print section
        console.log(section.toLowerCase());
        console.log('='.repeat(section.length));

        const hasSecrets = Object.values(group).some(entry => entry.secret);
        if (hasSecrets) {
            console.log('(contains secrets)');
        }

        for (const row of rows) {
            const line = row
                .map((value, i) => padRight(value, colWidths[i]))
                .join(' ');
            console.log(line);
        }

        console.log(); // Blank line between sections
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    printSettings();
}
