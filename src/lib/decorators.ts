import { z, ZodTypeAny } from "zod";
import 'reflect-metadata';
import { toEnvVar } from "./utils";

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
setting.boolean = () => setting(z.preprocess(parseIfString, z.boolean()));
setting.date = () => setting(z.coerce.date());
setting.array = <T extends ZodTypeAny = z.ZodString>(itemSchema?: T) =>
    setting(z.array(itemSchema ?? z.string()));
// Accepts optional shape or full schema; JSON-parses env string values first
setting.object = (
    schemaOrShape?: ZodTypeAny | Record<string, ZodTypeAny>
) => {
  const schema =
      !schemaOrShape
          ? z.record(z.any())
          : (isZodType(schemaOrShape)
              ? schemaOrShape
              : z.object(schemaOrShape as Record<string, ZodTypeAny>));
  return setting(z.preprocess(parseIfString, schema));
}

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

// Marks a field as secret (for doc generation/scripting)
export function secret(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('envarna:secret', true, target, propertyKey.toString());
  };
}

// Marks a field as dev only (for doc generation/scripting)
export function devOnly(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('envarna:devOnly', true, target, propertyKey.toString());
  };
}

// Alternate namespace for fully coercing Zod schemas
export const v = {
  string: z.string,
  number: z.coerce.number,
  boolean: () => z.preprocess(parseIfString, z.boolean()),
  date: z.coerce.date,
  // JSON-parses env string values before validating
  object: (schemaOrShape?: ZodTypeAny | Record<string, ZodTypeAny>) => {
    const schema =
        !schemaOrShape
            ? z.record(z.any())
            : (isZodType(schemaOrShape)
                ? schemaOrShape
                : z.object(schemaOrShape as Record<string, ZodTypeAny>));
    return z.preprocess(parseIfString, schema);
  },
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

export function isDevOnly(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata('envarna:devOnly', target, propertyKey.toString()) === true;
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

function isZodType(x: unknown): x is ZodTypeAny {
  return !!x && typeof x === 'object' && (x as any)._def !== undefined;
}


// Exposes registered schemas for BaseSettings and doc generation
export function getFieldSchemas(klass: Function): Record<string, ZodTypeAny> {
  return fieldMetadata.get(klass) || {};
}
