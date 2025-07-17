import { extractEnvSpec } from './extractEnvSpec.js';

export async function writeRawEnvSpec(skipDev = false): Promise<string> {
    const spec = await extractEnvSpec(undefined, skipDev);

    return JSON.stringify(spec, null, 2);
}
