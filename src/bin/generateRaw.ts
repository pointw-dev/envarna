import { extractEnvSpec } from './extractEnvSpec.js';

export async function writeRawEnvSpec(): Promise<string> {
    const spec = await extractEnvSpec();

    return JSON.stringify(spec, null, 2);
}
