
import { camelCase } from "change-case";

export function extractPrefixedEnv(prefix: string, env = process.env): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefix)) {
      const strippedKey = key.slice(prefix.length);
      const camel = camelCase(strippedKey);
      result[camel] = value!;
    }
  }
  return result;
}

export function toEnvVar(className: string, propName: string): string {
  return `${className.replace(/Settings$/, '').toUpperCase()}_${propName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;
}
