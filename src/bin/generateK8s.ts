import yaml from 'yaml';
import { extractEnvSpec } from './extractEnvSpec.js';



export async function generateK8s(): Promise<string> {
  const spec = await extractEnvSpec();
  const envList: { name: string; value: string }[] = [];

  for (const vars of Object.values(spec)) {
    for (const [key, meta] of Object.entries(vars)) {
      if (key === '_description') continue;
      if (typeof meta === 'string' || meta == null) continue;

      const fallback = meta.default ?? `{${meta.type}}`;
      envList.push({
        name: key,
        value: String(fallback),
      });
    }
  }

  return yaml.stringify({ env: envList });
}
