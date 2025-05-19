import { z, ZodTypeAny } from "zod";
import 'reflect-metadata';
import { toEnvVar } from "./utils.js";

const aliases = new WeakMap<Function, Record<string, string>>();
const fieldMetadata = new WeakMap<Function, Record<string, ZodTypeAny>>();



// Main decorator
export function setting(schema: ZodTypeAny): PropertyDecorator {
  return (target, key) => {
    registerField(target.constructor, key.toString(), schema);
  };
}

// Optional sugar methods (non-coercing by default)
setting.string = () => setting(z.string());
setting.number = () => setting(z.coerce.number());
setting.boolean = () => setting(z.coerce.boolean());
setting.date = () => setting(z.coerce.date());
setting.array = <T extends ZodTypeAny = z.ZodString>(itemSchema?: T) =>
    setting(z.array(itemSchema ?? z.string()));
setting.object = <T extends Record<string, ZodTypeAny>>(shape: T) =>
    setting(z.object(shape));

// Injects setting into process.env as ENVVAR
export function pushToEnv(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const className = target.constructor.name;
    const key = propertyKey.toString();

    const aliasMap = aliases.get(target.constructor) || {};
    const envar = aliasMap[key] ?? toEnvVar(className, key);

    Reflect.defineMetadata('envarna:pushToEnv', envar, target, key);
  };
}

// Marks a field as secret (for doc generation)
export function secret(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('envarna:secret', true, target, propertyKey.toString());
  };
}

// Alternate namespace for fully coercing Zod schemas
export const v = {
  string: z.string,
  number: z.coerce.number,
  boolean: z.coerce.boolean,
  date: z.coerce.date,
  object: z.object,
  enum: <T extends string>(values: [T, ...T[]]) => z.enum(values),
  array: <T extends ZodTypeAny = z.ZodString>(itemSchema?: T) =>
      z.preprocess(parseIfString, z.array(itemSchema ?? z.string())),
};


export function alias(name: string): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const klass = target.constructor;
    const map = aliases.get(klass) || {};
    map[propertyKey.toString()] = name;
    aliases.set(klass, map);
  };
}



export function isSecret(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata('envarna:secret', target, propertyKey.toString()) === true;
}

export function getAliases(klass: Function): Record<string, string> {
  const result: Record<string, string> = {};
  let current: any = klass;

  while (current && current !== Function.prototype) {
    const local = aliases.get(current);
    if (local) Object.assign(result, local);
    current = Object.getPrototypeOf(current);
  }

  return result;
}


// Registers the Zod schema for a decorated field
function registerField(klass: Function, key: string, schema: ZodTypeAny) {
  const meta = fieldMetadata.get(klass) || {};
  meta[key] = schema;
  fieldMetadata.set(klass, meta);
}

// --- Environment-friendly wrapper ---
function parseIfString(val: unknown): unknown {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}


// Exposes registered schemas for BaseSettings and doc generation
export function getFieldSchemas(klass: Function): Record<string, ZodTypeAny> {
  return fieldMetadata.get(klass) || {};
}
