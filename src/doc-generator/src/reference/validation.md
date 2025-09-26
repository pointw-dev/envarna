# Validation with `v` (Reference)

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

Accepts strings from env (e.g., `"5"`, `"true"`, `"2025-05-16"`).

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
```

For objects, use `@setting.object(...)` or define nested `BaseSettings` classes.

## Defaults

Two default styles:

```ts
@setting.string()
host: string = 'localhost'        // assignment default

@setting(v.string().default('x'))
name!: string                     // validator default
```

Assignment defaults are clear for simple cases; validator defaults shine with other constraints.
