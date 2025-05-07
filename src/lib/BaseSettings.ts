import { z, ZodObject, ZodRawShape, ZodTypeAny } from "zod";
import 'reflect-metadata';
import { extractPrefixedEnv } from "./utils.js";
import { getFieldSchemas, isSecret } from "./decorators.js";
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

  /**
   * Loads a settings instance by validating and merging values from one of two sources:
   *
   * - If `values` is provided, those values are used directly with no fallback to `.env` or `process.env`.
   * - If `values` is omitted, settings are loaded from environment variables (after `dotenv.config()`),
   *   filtered by the class prefix (e.g., `SMTP_` for `SmtpSettings`).
   *
   * In both cases, defaults defined on the class instance are applied first and overridden by the source values.
   *
   * @param values - Optional direct settings object. If provided, skips env file and env var loading entirely.
   * @returns An instance of the settings class with all fields validated and assigned.
   */
  static load<T extends typeof BaseSettings>(
      this: T,
      values?: Record<string, unknown>
  ): InstanceType<T> {
    const schemaShape = getFieldSchemas(this);
    let schema = z.object(schemaShape).strip();
    schema = this.refineSchema(schema);

    const instance = new this() as InstanceType<T>;
    const defaults = Object.fromEntries(Object.entries(instance));

    let merged: Record<string, unknown> = {};

    if (values) {
      // Use direct values only; skip env file and process.env entirely
      merged = { ...defaults, ...values };
    } else {
      // Load from .env and process.env using prefixed keys
      //
      // Precedence hierarchy:
      //   1. Injected values passed to `load()` (if provided)
      //   2. Environment variables in `process.env`
      //   3. Variables loaded from `.env` by `dotenv` (only if not already in `process.env`)
      //   4. Defaults declared in the class
      //
      // Note: `dotenv.config()` will not override existing `process.env` values.
      dotenv.config();
      const prefix = this.name.replace(/Settings$/, '').toUpperCase() + '_';
      const rawEnv = extractPrefixedEnv(prefix, process.env);
      merged = { ...defaults, ...rawEnv };
    }

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

  toJSON() {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      result[key] = isSecret(this, key) ? '****' : (this as any)[key];
    }
    return result;
  }
}
