import { extractEnvSpec } from './extractEnvSpec.js';

export async function generateJson(root: string | null = null, flat = false): Promise<string> {
  const spec = await extractEnvSpec();
  const output: any = root ? { [root]: {} } : {};

  for (const [group, vars] of Object.entries(spec)) {
    for (const [key, meta] of Object.entries(vars)) {
      if (key === '_description') continue;
      if (typeof meta === 'string' || meta == null) continue;

      let value: any;

      if (meta.default != null) {
        const declaredType = meta.type.split(' ')[0];

        switch (declaredType) {
          case 'number': {
            const asNumber = Number(meta.default);
            value = !isNaN(asNumber) ? asNumber : meta.default;
            break;
          }
          case 'boolean': {
            const lower = meta.default.toLowerCase();
            value = lower === 'true' ? true : lower === 'false' ? false : meta.default;
            break;
          }
          case 'array':
          case 'object': {
            try {
              const parsed = JSON.parse(meta.default);
              if (
                  (declaredType === 'array' && Array.isArray(parsed)) ||
                  (declaredType === 'object' && parsed && typeof parsed === 'object' && !Array.isArray(parsed))
              ) {
                value = parsed;
              } else {
                value = meta.default;
              }
            } catch {
              value = meta.default;
            }
            break;
          }
          default:
            value = meta.default;
        }
      } else {
        value = `{${meta.type}}`;
      }

      if (flat && root) {
        output[root][key] = value;
      } else if (flat && !root) {
        output[key] = value;
      } else if (root) {
        output[root][group.toLowerCase()] ??= {};
        output[root][group.toLowerCase()][key] = value;
      } else {
        output[group.toLowerCase()] ??= {};
        output[group.toLowerCase()][key] = value;
      }
    }
  }

  return JSON.stringify(output, null, 2);
}
