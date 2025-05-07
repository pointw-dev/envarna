import { extractEnvSpec } from './extractEnvSpec.js';
import { fileURLToPath } from 'url';

function padRight(value: string, width: number): string {
    return value + ' '.repeat(width - value.length);
}

export function printSettings(): void {
    const spec = extractEnvSpec();

    for (const [section, group] of Object.entries(spec)) {
        const rows: string[][] = [];

        const hasSecrets = Object.values(group).some(entry => entry.secret);

        rows.push(['Code', 'Envar', 'Type', 'Default', 'Required']);
        rows.push([
            '-----------------------',
            '--------------',
            '---------',
            '---------',
            '--------',
        ]);

        for (const [envVar, { default: def, required, originalName, secret, type }] of Object.entries(group)) {
            const code = `settings.${section.toLowerCase()}.${originalName}` + (secret ? ' (secret)' : '');
            rows.push([
                code,
                envVar,
                type,
                def ?? '',
                required ? 'Yes' : 'No',
            ]);
        }

        const colWidths = rows[0].map((_, colIndex) =>
            Math.max(...rows.map(row => row[colIndex].length))
        );

        const sectionHeader = section.toLowerCase() + (hasSecrets ? ' (contains secrets)' : '');
        console.log(sectionHeader);
        console.log('='.repeat(sectionHeader.length));

        for (const row of rows) {
            const line = row
                .map((value, i) => padRight(value, colWidths[i]))
                .join(' ');
            console.log(line);
        }

        console.log();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    printSettings();
}
