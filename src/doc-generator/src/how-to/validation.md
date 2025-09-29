# Validation with `v`

`v` is a convenience wrapper around Zod tailored for settings. It enables coercion and concise validation chains.

## Coercion by default

```ts
@setting(v.number().int().min(1).max(10).default(5))
retries!: number

@setting(v.boolean())
debug!: boolean

@setting(v.date())
launchDate!: Date
```

All accept strings from env (e.g., `"5"`, `"true"`, `"2025-05-16"`).

## Strings

```ts
@setting(v.string().min(5).max(15))
username!: string

@setting(v.string().email())
contact!: string

@setting(v.string().regex(/^[a-z]{3,10}$/))
slug!: string
```

## Enums

```ts
@setting(v.enum(['debug','info','warn','error']))
logLevel!: string
```

## Arrays and objects

```ts
@setting(v.array(v.number()))
thresholds!: number[]

@setting.array() // defaults to array of strings
hosts!: string[]

// Objects
@setting(v.object({ name: v.string(), age: v.number() }))
user!: { name: string; age: number }
// or generic JSON object
@setting.object()
meta!: Record<string, unknown>
```

Objects are JSON‑parsed from env strings (e.g., `APP_META={"a":1}`). Use a shape for strict typing when available.

Env examples
```bash
# arrays
export APP_HOSTS='["a.example.org","b.example.org"]'

# objects
export APP_META='{"version":"1.2.3","flags":["x","y"]}'
```

## Defaults

Two default styles:

```ts
@setting.string()
host: string = 'localhost'        // assignment default

@setting(v.string().default('x'))
name!: string                     // validator default
```

Assignment defaults are typically clearer for simple cases; validator defaults shine when combined with other constraints.
