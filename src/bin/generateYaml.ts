// bin/generateYaml.ts
import { extractEnvSpec } from './extractEnvSpec.js';
import yaml from 'yaml';

export async function generateYaml(root: string = 'settings', flat = false, useCodeAsKey = false): Promise<string> {
  const spec = await extractEnvSpec();
  const output: Record<string, any> = {};
  output[root] = {};

  for (const [group, vars] of Object.entries(spec)) {
    for (const [envar, meta] of Object.entries(vars)) {
      if (envar.startsWith('_')) continue;
      if (typeof meta !== 'object' || meta == null || !('default' in meta)) continue;

      const yamlKey = useCodeAsKey ? meta.originalName : meta.alias ?? envar;
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
        value = `-{-${meta.type}-}-`;
      }

      if (flat) {
        output[root][yamlKey] = value;
      } else {
        const groupKey = group.toLowerCase();
        output[root][groupKey] ??= {};
        output[root][groupKey][yamlKey] = value;
      }
    }
  }

  let yamlText = yaml.stringify(output);
  yamlText = yamlText.replace(/"?-\{-\s*([^}]+?)\s*-\}-"?/g, '{$1}');
  return yamlText;
}
