import { z } from "zod";
import 'reflect-metadata';
import { extractPrefixedEnv } from "./utils";
import { getFieldSchemas } from "./decorators";
import dotenv from "dotenv";

export class BaseSettings {
  static load<T extends new (...args: any[]) => any>(
    this: T,
    envSource: Record<string, string | undefined> = process.env
  ): InstanceType<T> {
    dotenv.config(); // Ensure dotenv is loaded early

    const schemaShape = getFieldSchemas(this);
    const schema = z.object(schemaShape);

    const prefix = this.name.replace(/Settings$/, '').toUpperCase() + '_';

    const rawEnv = extractPrefixedEnv(prefix, envSource);

    // Create an instance and capture defaults
    const instance = new this() as any;
    const defaults = Object.fromEntries(Object.entries(instance));

    // Merge defaults and raw environment values
    const merged = { ...defaults, ...rawEnv };

    const parsed = schema.safeParse(merged);

    if (!parsed.success) {
      throw parsed.error;
    }

    Object.assign(instance, parsed.data);
    (this as any).__envarna_loaded__ = true

    for (const key of Object.keys(instance)) {
      const envVarName = Reflect.getMetadata('envarna:pushToEnv', instance, key);
      if (envVarName) {
        process.env[envVarName] = String((instance as any)[key]);
      }
    }

    return instance;
  }
}
