import yaml from 'yaml';
import { extractEnvSpec } from './extractEnvSpec.js';
import { formatType } from './formatType.js';

export async function generateK8s(): Promise<string> {
  const spec = await extractEnvSpec();
  const envList: { name: string; value: any }[] = [];

  for (const vars of Object.values(spec)) {
    for (const [key, meta] of Object.entries(vars)) {
      if (key.startsWith('_')) continue;
      if (typeof meta !== 'object' || meta == null || !('default' in meta)) continue;
      const name = meta.alias ?? key;
      let rawValue: string;

      if (meta.default != null) {
        const declaredType = meta.type.split(' ')[0];

        switch (declaredType) {
          case 'number': {
            const asNumber = Number(meta.default);
            rawValue = !isNaN(asNumber) ? String(asNumber) : meta.default;
            break;
          }
          case 'boolean': {
            const lower = meta.default.toLowerCase();
            rawValue = lower === 'true' ? 'true' : lower === 'false' ? 'false' : meta.default;
            break;
          }
          case 'array':
          case 'object': {
            try {
              const parsed = JSON.parse(meta.default);
              rawValue = Array.isArray(parsed)
                  ? parsed.join(',')           // array → "a,b,c"
                  : JSON.stringify(parsed);    // object → '{"x":1}'
            } catch {
              rawValue = meta.default;
            }
            break;
          }
          default:
            rawValue = meta.default; // Let YAML quote as needed
        }
      } else {
        const typeLabel = formatType(meta.type, meta.devOnly);
        rawValue = `__PLACEHOLDER__{${typeLabel}}__`; // marker for post-processing
      }

      envList.push({
        name,
        value: rawValue,
      });
    }
  }

  let yamlText = yaml.stringify({ env: envList });

  // 1. Unwrap placeholders
  yamlText = yamlText.replace(/value:\s["']?__PLACEHOLDER__(\{[^}]+})__["']?/g, 'value: $1');

  // 2. Quote unquoted strings (safe fallback for Kubernetes)
  yamlText = yamlText.replace(
      /value:\s([a-zA-Z0-9_.@:\/\-]+)$/gm,
      'value: "$1"'
  );

  return yamlText;
}
