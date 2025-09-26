# Decorators (Reference)

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

## @secret
- Marks a field as sensitive, adds “(secret)” in CLI, and redacts in JSON dumps.

```ts
@setting.string()
@secret()
password?: string
```

## @alias
- Overrides the derived environment variable name used for a field.

```ts
@setting.string()
@alias('GOOGLE_CLOUD_PROJECT')
projectId = 'my-project'
```

## @devOnly
- Indicates a field intended for development. Omit with `--skip-dev` in CLI.

```ts
@setting.string()
@devOnly()
localOnlyFlag?: string
```

## `v` (validation builder)
Compose richer validation chains with coercion:

```ts
@setting(v.number().int().min(1).max(10).default(5))
retries!: number

@setting(v.enum(['debug','info','warn','error']))
logLevel!: string

@setting(v.string().email())
contact!: string
```

See also: Reference > Validation with v.

## @pushToEnv (use sparingly)
Writes the field’s value back into `process.env` when missing.

```ts
@setting.string()
@pushToEnv()
host = 'localhost'
```

Warnings
- Hidden side effects; mutates global state.
- Order/coupling concerns; can mask missing env for other tools.
- Propagation to child processes/tests.
- Security: avoid pushing sensitive values.
