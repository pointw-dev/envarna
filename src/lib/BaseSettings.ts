import { z, ZodObject, ZodRawShape, ZodTypeAny, ZodError } from "zod";
import 'reflect-metadata';
import dotenv from "dotenv";
import { extractPrefixedEnv } from "./utils.js";
import {getAliases, getFieldSchemas, isSecret} from "./decorators.js";
import { DOTENV_PATH } from "./paths.js";

export class BaseSettings {
  /** Holds test override values, if any. */
  private static _testOverrides: Map<Function, Record<string, unknown>> = new Map();

  /**
   * Subclasses can override this to hook into the Zod schema before validation.
   * Used for `.superRefine()` or other advanced schema manipulations.
   */
  protected static refineSchema(
      schema: ZodObject<ZodRawShape, "strip", ZodTypeAny>
  ): ZodObject<ZodRawShape, "strip", ZodTypeAny> {
    return schema;
  }

  /**
   * Subclasses can override this to add custom validation logic after instantiation.
   */
  protected validate(): void {
    // Default no-op
  }

  /**
   * Overrides values for testing. Must be called before `.load()`.
   */
  static overrideForTest<T extends typeof BaseSettings>(this: T, values: Record<string, unknown>): void {
    BaseSettings._testOverrides.set(this, values);
  }

  /**
   * Clears any test override values.
   */
  static clearOverride<T extends typeof BaseSettings>(this: T): void {
    BaseSettings._testOverrides.delete(this);
  }

  /**
   * Loads a settings instance by validating and merging values from one of two sources:
   *
   * - If test overrides exist, they are used.
   * - Else if `values` is provided, those values are used directly.
   * - Else values are loaded from environment variables.
   */
  static load<T extends typeof BaseSettings>(
      this: T,
      values?: Record<string, unknown>
  ): InstanceType<T> {
    const schemaShape = getFieldSchemas(this);
    if (Object.keys(schemaShape).length === 0) {
      throw new Error(`No fields declared for ${this.name}. Did you forget to decorate fields with @setting()?`);
    }

    let schema = z.object(schemaShape).strip();
    schema = this.refineSchema(schema);

    const instance = new this() as InstanceType<T>;
    const defaults = Object.fromEntries(Object.entries(instance));

    const testOverride = BaseSettings._testOverrides.get(this);
    let merged: Record<string, unknown> = {};

    if (testOverride) {
      merged = { ...defaults, ...testOverride };
    } else if (values) {
      merged = { ...defaults, ...values };
    } else {
      dotenv.config({ path: DOTENV_PATH });
      const prefix = this.name.replace(/Settings$/, '').toUpperCase() + '_';
      const rawEnv = extractPrefixedEnv(prefix, process.env);
      const overrides = getAliases(this);

      for (const [key, envvar] of Object.entries(overrides)) {
        const val = process.env[envvar];
        if (val !== undefined) {
          rawEnv[key] = val;
        }
      }

      merged = { ...defaults, ...rawEnv };
    }

    const parsed = schema.safeParse(merged);
    if (!parsed.success) {
      const className = this.name;
      const adjustedErrors = parsed.error.errors.map((issue) => ({
        ...issue,
        message: `[${className}.${issue.path}] ${issue.message}`,
      }));
      throw new ZodError(adjustedErrors);
    }

    Object.assign(instance, parsed.data);

    for (const key of Object.keys(instance)) {
      const envar = Reflect.getMetadata('envarna:pushToEnv', instance, key);
      const value = String((instance as any)[key])
      if (envar && value.length > 0) {
        process.env[envar] = String((instance as any)[key]);
      }
    }

    instance.validate();
    return instance;
  }

  /**
   * Returns a JSON representation of the settings instance.
   * Secret values (marked with `@secret`) will appear as `'****'`.
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      result[key] = isSecret(this, key) ? '****' : (this as any)[key];
    }
    return result;
  }
}
