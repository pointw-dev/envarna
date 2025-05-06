import { z, ZodObject, ZodRawShape, ZodTypeAny } from "zod";
import 'reflect-metadata';
import { extractPrefixedEnv } from "./utils";
import { getFieldSchemas } from "./decorators";
import dotenv from "dotenv";

export class BaseSettings {
  // Subclasses can override this to hook into Zod schema building
  protected static refineSchema(
    schema: ZodObject<ZodRawShape, "strip", ZodTypeAny>
  ): ZodObject<ZodRawShape, "strip", ZodTypeAny> {
    return schema;
  }

  // Subclasses can override this to validate an instantiated object
  protected validate(): void {
    // Default no-op
  }

  static load<T extends typeof BaseSettings>(
    this: T,
    envSource: Record<string, string | undefined> = process.env
  ): InstanceType<T> {
    // Ensure dotenv config is loaded if not already
    dotenv.config();

    const schemaShape = getFieldSchemas(this);
    let schema = z.object(schemaShape).strip();
    schema = this.refineSchema(schema);

    const prefix = this.name.replace(/Settings$/, '').toUpperCase() + '_';
    const rawEnv = extractPrefixedEnv(prefix, envSource);

    const instance = new this() as InstanceType<T>;
    const defaults = Object.fromEntries(Object.entries(instance));
    const merged = { ...defaults, ...rawEnv };

    const parsed = schema.safeParse(merged);
    if (!parsed.success) {
      throw parsed.error;
    }

    Object.assign(instance, parsed.data);

    for (const key of Object.keys(instance)) {
      const envVarName = Reflect.getMetadata('envarna:pushToEnv', instance, key);
      if (envVarName) {
        process.env[envVarName] = String((instance as any)[key]);
      }
    }

    instance.validate();
    return instance;
  }
}
