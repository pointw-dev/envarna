# Decorators

## @setting
Declares a setting field and its basic type. Helpers cover common cases:

```ts
@setting.string()
host: string = 'localhost'

@setting.number()
port!: number

@setting.boolean()
debug = false

@setting.date()
launch!: Date

@setting.array()
hosts!: string[]

@setting.object({ /* shape */ })
```

Notes
- Decorators define coercion and validation for environment inputs.
- Defaults via assignment or validator default (see `v`).

### Objects
- `@setting.object()` JSON‑parses env strings into objects and validates against:
  - a generic object schema when no args are given (`record<any>`), or
  - a provided shape (`{ key: zodType }`), or
  - a full Zod schema.

Examples
```ts
// Generic object (any keys)
@setting.object()
cfg!: Record<string, unknown>

// With shape (recommended)
@setting.object({ name: v.string(), age: v.number() })
record!: { name: string; age: number }

// With explicit Zod schema
@setting(v.object({ version: v.string(), flags: v.array(v.string()) }))
meta!: { version: string; flags: string[] }
```
Input is read from env as a JSON string, e.g. `APP_RECORD={"name":"Alice","age":33}`.

## @secret
- Marks a field as sensitive, adds “(secret)” in CLI generated documents
- and redacts this value JSON dumps.

```ts
@setting.string()
@secret()
password?: string;
```

## @alias
- Normally the name of the environment variable that populates a setting is derived from the name of the class and the name of the setting (see [Naming Convention](/how-to/settings-classes#naming-convention) )
- Using `@alias` causes that environment variables to also populate the class.
- Naming convention takes precedence if both environment variables are set.

```ts
@setting.string()
@alias('GOOGLE_CLOUD_PROJECT')
projectId = 'my-project';
```

## @devOnly
- Indicates a field intended for development. Decorating a setting with `@devOnly()` does three things.
  * Acts as a reminder to whoever reads the class code that the setting is intended for development only
  * Adds this indication to outputs from the command line <br/>e.g. `npx envarna list` or `npx envarna md`, etc.
  * Command line options with `--skip-dev` will ensure these settings are not included <br/>e.g. `npx envarna yaml --skip-dev` or `npx envarna compose --skip-dev`, etc.

```ts
@setting.string()
@devOnly()
localOnlyFlag?: string;
```

## `v` (validation builder)
Compose richer validation chains with coercion:

```ts
@setting(v.number().int().min(1).max(10).default(5))
retries!: number;

@setting(v.enum(['debug','info','warn','error']))
logLevel!: string;

@setting(v.string().email())
contact!: string;
```

See also: [Validation with v](validation.md).

Objects with `v`
```ts
@setting(v.object({ name: v.string(), age: v.number() }))
user!: { name: string; age: number };
```

## @pushToEnv (use sparingly)
- Always writes the field’s value back into `process.env` during load (overwriting if present).

```ts
@setting.string()
@pushToEnv()
host = 'localhost';
```

- Warnings
  - Hidden side effects; mutates global state.
  - Order/coupling concerns; can mask missing env for other tools.
  - Propagation to child processes/tests.
  - Security: avoid pushing sensitive values.
