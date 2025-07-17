import { extractEnvSpec } from './extractEnvSpec.js';
import { formatType } from './formatType.js';

export async function generateJson(
  root: string | null = null,
  flat = false,
  useCodeAsKey = false,
  skipDev = false
): Promise<string> {
  const spec = await extractEnvSpec(undefined, skipDev);
  const output: any = root ? { [root]: {} } : {};

  for (const [group, vars] of Object.entries(spec)) {
    for (const [envar, meta] of Object.entries(vars)) {
      if (envar.startsWith('_')) continue;
      if (typeof meta !== 'object' || meta == null || !('default' in meta)) continue;
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
        const typeLabel = formatType(meta);
        value = `{${typeLabel}}`;
      }

      const outputKey = useCodeAsKey ? meta.fieldName : meta.alias ?? envar;

      if (flat && root) {
        output[root][outputKey] = value;
      } else if (flat && !root) {
        output[outputKey] = value;
      } else if (root) {
        output[root][group.toLowerCase()] ??= {};
        output[root][group.toLowerCase()][outputKey] = value;
      } else {
        output[group.toLowerCase()] ??= {};
        output[group.toLowerCase()][outputKey] = value;
      }
    }
  }

  return JSON.stringify(output, null, 2);
}
