import { extractEnvSpec } from './extractEnvSpec.js';
import {fileURLToPath} from "url";

function padRight(value: string, width: number): string {
    return value + ' '.repeat(width - value.length);
}

export function printSettings(): void {
    const spec = extractEnvSpec();

    for (const [section, group] of Object.entries(spec)) {
        const rows: string[][] = [];

        // Prepare header and data rows
        rows.push(['Code', 'Envar', 'Default', 'Optional']);
        rows.push(['-----------------------', '--------------', '---------', '--------']);

        for (const [envVar, { default: def, optional, originalName }] of Object.entries(group)) {
            rows.push([
                `settings.${section.toLowerCase()}.${originalName}`,
                envVar,
                def ?? '',
                optional ? 'Yes' : 'No',
            ]);
        }

        // Determine max width per column
        const colWidths = rows[0].map((_, colIndex) =>
            Math.max(...rows.map(row => row[colIndex].length))
        );

        // Print section title
        console.log(section.toLowerCase());
        console.log('='.repeat(section.length));

        // Print rows with padding
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
