
import { camelCase } from "change-case";
import { getInitializedSetting, getInitializedKeys, settingsInitialized } from "./initializeSettings";

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


export function createSettingsProxy<T extends Record<string, () => any>>(loaders?: T): {
  [K in keyof T]: ReturnType<T[K]>;
} {
  const localLoaders: Record<string, () => any> = loaders ?? {};

  return new Proxy({}, {
    get(_, key: string | symbol) {
      if (typeof key !== "string") {
        return undefined;
      }

      if (settingsInitialized()) {
        const value = getInitializedSetting(key);
        if (value !== undefined) {
          return value;
        }
        if (key in localLoaders) {
          return localLoaders[key]();
        }
        throw new Error(
          `Settings for '${key}' accessed but not initialized.`
        );
      }

      if (key in localLoaders) {
        return localLoaders[key]();
      }

      throw new Error(
        `Settings for '${key}' accessed before initialization. Did you forget to call initializeSettings()?`
      );
    },
    ownKeys: () => {
      if (settingsInitialized()) {
        const keys = new Set<string>([...Object.keys(localLoaders), ...getInitializedKeys()])
        return Array.from(keys)
      }
      return Reflect.ownKeys(localLoaders)
    },
    getOwnPropertyDescriptor: (_, key) => {
      if (typeof key === "string" && key in localLoaders) {
        return {
          configurable: true,
          enumerable: true,
          value: localLoaders[key],
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