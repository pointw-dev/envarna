import { extractEnvSpec } from './extractEnvSpec.js';

export async function writeComposeEnvFile(): Promise<string> {
    const spec = await extractEnvSpec();

    const lines: string[] = ['environment:'];
    for (const [, group] of Object.entries(spec)) {
        for (const [envar, entry] of Object.entries(group)) {
            if (envar.startsWith('_')) continue;
            if (typeof entry !== 'object' || entry === null || !('default' in entry)) continue;
            const name = entry.alias ?? envar;
            const typeLabel = `${entry.type}${entry.devOnly ? ' [devOnly]' : ''}`;
            const def = entry.default ?? `{${typeLabel}}`;
            lines.push(`  ${name}: ${def}`);
        }
    }

    return lines.join('\n') + '\n';
}
