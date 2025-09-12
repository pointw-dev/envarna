
import { camelCase } from "change-case";
import { getInitializedSetting, getInitializedKeys, settingsInitialized, initializeLoaders, waitForInitialization } from "./initializeLoaders";
import { BaseSettings } from "./BaseSettings";

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


// Type helpers
type Ctor<T> = new (...args: any[]) => T
type InstanceOf<T> = T extends Ctor<infer R> ? R : never

type SettingsFromLoaders<L extends Record<string, () => any>> = {
  [K in keyof L]: ReturnType<L[K]>;
}

type SettingsFromClasses<C extends Record<string, Ctor<BaseSettings>>> = {
  [K in keyof C]: InstanceOf<C[K]>;
}

type SettingsProxyExtras = {
  $override: (loaders: Record<string, () => Promise<BaseSettings> | BaseSettings>) => Promise<void>;
  $initialized: boolean;
  $ready: () => Promise<void>;
}

export function createSettingsProxy(): SettingsProxyExtras & Record<string, any>;
export function createSettingsProxy<C extends Record<string, Ctor<BaseSettings>>>(classes: C): SettingsFromClasses<C> & SettingsProxyExtras;
export function createSettingsProxy<L extends Record<string, () => any>>(loaders: L): SettingsFromLoaders<L> & SettingsProxyExtras;
export function createSettingsProxy(arg?: any): any {
  // Normalize provided argument into loader functions for runtime
  const localLoaders: Record<string, () => any> = {};
  if (arg && typeof arg === 'object') {
    for (const [key, val] of Object.entries(arg)) {
      if (typeof val === 'function') {
        // If it's a class (subclass of BaseSettings), derive a loader
        if ('prototype' in val && (val as any).prototype instanceof BaseSettings) {
          const Klass = val as Ctor<BaseSettings> & typeof BaseSettings;
          localLoaders[key] = () => (Klass as any).load();
        } else {
          // Assume it's a loader function
          localLoaders[key] = val as () => any;
        }
      }
    }
  }

  let proxy: any;
  const handler: ProxyHandler<any> = {
    get(_, key: string | symbol) {
      if (key === '$override') {
        return (loaders: Record<string, () => any>) => initializeLoaders(loaders)
      }
      if (key === '$initialized') {
        return settingsInitialized()
      }
      if (key === '$ready') {
        return () => waitForInitialization()
      }
      if (key === 'toJSON') {
        return () => {
          const result: Record<string, unknown> = {};
          for (const prop of Reflect.ownKeys(proxy)) {
            if (typeof prop !== 'string') continue;
            const value = (proxy as any)[prop];
            if (value instanceof Promise) {
              throw new Error(
                'Settings contain async loaders. Call initializeLoaders() or $override() before dumping to JSON.'
              );
            }
            result[prop] = value && typeof value.toJSON === 'function' ? value.toJSON() : value;
          }
          return result;
        };
      }
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
        `Settings for '${key}' accessed before initialization. Did you forget to call initializeLoaders() or $override()?`
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
  };

  proxy = new Proxy({}, handler);
  return proxy;
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
