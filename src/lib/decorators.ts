import { z, ZodTypeAny } from "zod";
import 'reflect-metadata';
import { toEnvVar } from "./utils.js";

const fieldMetadata = new WeakMap<Function, Record<string, ZodTypeAny>>();

// Registers the Zod schema for a decorated field
function registerField(klass: Function, key: string, schema: ZodTypeAny) {
  const meta = fieldMetadata.get(klass) || {};
  meta[key] = schema;
  fieldMetadata.set(klass, meta);
}

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

// Marks a field as secret (for doc generation)
export function secret(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('envarna:secret', true, target, propertyKey.toString());
  };
}

export function isSecret(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata('envarna:secret', target, propertyKey.toString()) === true;
}

// Injects setting into process.env as ENVVAR
export function pushToEnv(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const className = target.constructor.name;
    const envVarName = toEnvVar(className, propertyKey.toString());
    Reflect.defineMetadata('envarna:pushToEnv', envVarName, target, propertyKey.toString());
  };
}

// Exposes registered schemas for BaseSettings and doc generation
export function getFieldSchemas(klass: Function): Record<string, ZodTypeAny> {
  return fieldMetadata.get(klass) || {};
}
