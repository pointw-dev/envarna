import { z, ZodTypeAny, ZodStringCheck, ZodNumberCheck } from "zod";
import 'reflect-metadata';
import { toEnvVar } from "./utils.js";

const fieldMetadata = new WeakMap<Function, Record<string, z.ZodTypeAny>>();

function parseIfString(val: unknown): unknown {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val; // allow Zod to throw validation error
    }
  }
  return val;
}

export const setting = Object.assign(
  (schema: ZodTypeAny): PropertyDecorator => {
    return (target: Object, propertyKey: string | symbol) => {
      registerField(target.constructor, propertyKey.toString(), schema);
    };
  },
  {
    string: (options?: Parameters<typeof z.string>[0]): ZodDecoratorBuilder => wrap(z.string(options)),
    number: (options?: Parameters<typeof z.number>[0]): ZodDecoratorBuilder => wrap(z.coerce.number(options)),
    boolean: (): ZodDecoratorBuilder => wrap(z.coerce.boolean()),
    date: (): ZodDecoratorBuilder => wrap(z.coerce.date()),
    array: <T extends ZodTypeAny = z.ZodString>(itemSchema?: T): ZodDecoratorBuilder => {
      const schema = z.array(itemSchema ?? z.string());
      return wrap(z.preprocess(parseIfString, schema));
    },
    object: <T extends Record<string, ZodTypeAny>>(shape: T): ZodDecoratorBuilder => wrap(z.preprocess(parseIfString, z.object(shape))),
  }
);

export function secret() {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('envarna:secret', true, target, propertyKey);
  };
}

export function isSecret(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata('envarna:secret', target, propertyKey) === true;
}

type ZodDecoratorBuilder = ZodTypeAny & PropertyDecorator;

function wrap(baseSchema: ZodTypeAny): ZodDecoratorBuilder {
  const decorator: any = (target: Object, propertyKey: string | symbol) => {
    registerField(target.constructor, propertyKey.toString(), baseSchema);
  };

  return new Proxy(decorator, {
    get(_, key: string | symbol) {
      const method = baseSchema[key as keyof ZodTypeAny];
      if (typeof method === 'function') {
        return (...args: any[]) => wrap((method as Function).apply(baseSchema, args));
      }
      return method;
    }
  });
}

function registerField(klass: Function, key: string, schema: ZodTypeAny) {
  const meta = fieldMetadata.get(klass) || {};
  meta[key] = schema;
  fieldMetadata.set(klass, meta);
}

export function getFieldSchemas(klass: Function): Record<string, z.ZodTypeAny> {
  return fieldMetadata.get(klass) || {};
}

export function pushToEnv() {
  return function (target: any, propertyKey: string) {
    const className = target.constructor.name;
    const envVarName = toEnvVar(className, propertyKey);
    Reflect.defineMetadata('envarna:pushToEnv', envVarName, target, propertyKey);
  };
}
