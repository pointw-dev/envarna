# Decorators

## @setting
`@setting` declares a setting field and its basic type. Use the helpers for common cases:

```ts
@setting.string()
host: string = 'localhost'

@setting.number()
port!: number

@setting.boolean()
debug = false

@setting.date()
launch!: Date

@setting.array()         // defaults to array of strings
hosts!: string[]

@setting.object({ /* shape */ }) // JSON‑parsed object; optional shape or schema
```

Notes
- Decorators define how environment variables are coerced and validated into strongly typed fields.
- Defaults can be provided via assignment (e.g., `= 'localhost'`) or via the validator chain (see `v`).

## @secret
- Marks a field as sensitive.
- Appears as `(secret)` in CLI/list output.
- Redacts in JSON dumps (`toJSON` shows `'****'`).

```ts
@setting.string()
@secret()
password?: string
```

## @alias
- Overrides the derived environment variable name for a field.

```ts
@setting.string()
@alias('GOOGLE_CLOUD_PROJECT')
projectId = 'my-project'
```

## @devOnly
- Indicates a field is intended for development usage.
- Surfaces in CLI/list output and can be omitted with `--skip-dev`.
- Does not change runtime behavior.

```ts
@setting.string()
@devOnly()
localOnlyFlag?: string
```

## `v` (validation builder)
`v` composes richer validation while handling coercion (numbers, booleans, dates, arrays, etc.). Use with `@setting(v.*)`:

```ts
@setting(v.number().int().min(1).max(10).default(5))
retries!: number

@setting(v.enum(['debug','info','warn','error']))
logLevel!: string

@setting(v.string().email())
contact!: string
```

See [Validation with v](/how-to/validation) for more recipes.

### Objects
- `@setting.object()` JSON‑parses env strings like `APP_CFG={"a":1}`.
- Provide a shape for strong typing: `@setting.object({ a: v.number() })`.
- Or pass a full Zod schema: `@setting(v.object({ a: v.number() }).strict())`.

Example
```ts
class SomeSettings extends BaseSettings {
  @setting.object({ name: v.string(), age: v.number() })
  record = { name: '', age: 0 }
}
// SOME_RECORD={"name":"Michael","age":56}
```

## @pushToEnv (use sparingly)
Writes the field's value back into `process.env` (using the alias if present) when missing. This can be handy for local tooling that expects env vars, but it carries risks:

```ts
@setting.string()
@pushToEnv()
host = 'localhost'
```

Warnings
- Hidden side effects: Mutating `process.env` at runtime can surprise other code and tests.
- Coupling: Makes your app's behavior depend on write‑time ordering and may mask missing env in non‑JS tooling.
- Propagation: Child processes/tests may inherit mutated values, creating hard‑to‑debug flakiness.
- Security: Be extra cautious not to push sensitive values (even though `@secret()` redacts in JSON, `process.env` is readable).

Prefer using it only for local development ergonomics; avoid in production paths unless you fully control the environment.
