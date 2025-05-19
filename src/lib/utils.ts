
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


export function createSettingsProxy<T extends Record<string, () => any>>(loaders: T): {
  [K in keyof T]: ReturnType<T[K]>;
} {
  return new Proxy({}, {
    get(_, key: string | symbol) {
      if (typeof key !== "string" || !(key in loaders)) {
        return undefined;
      }

      return loaders[key as keyof T](); // Call fresh every time
    },
    ownKeys: () => Reflect.ownKeys(loaders),
    getOwnPropertyDescriptor: (_, key) => {
      if (typeof key === "string" && key in loaders) {
        return {
          configurable: true,
          enumerable: true,
          value: loaders[key as keyof T],
        };
      }
      return undefined;
    }
  }) as {
    [K in keyof T]: ReturnType<T[K]>;
  };
}



export function withMemo<T>(fn: () => T): () => T {
  let cached: T;
  let called = false;

  return () => {
    if (!called) {
      cached = fn();
      called = true;
    }
    return cached;
  };
}