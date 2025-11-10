# Validation with `v`

`v` is a convenience wrapper around Zod tailored for settings. It enables coercion and concise validation chains.

## Syntactic sugar
```ts
@setting.string()
name: string;

// is syntactic sugar for:

@setting(v.string())
name: string;
```
This is perfect if you just want to declare a setting as a simple type.


## Quick samples
If you want to control validation, use `v` explicitly.

```ts
@setting(v.string().optional())
dbPrefix?: string;

@setting(v.number().int().min(1).max(10).default(5))
retries!: number
```


## Coercion by default
`v` extends `z` (from Zod) to ensure the always string environment variable is coerced into a value of the correct type.  Always use `v` instead of `z` to ensure you get the values correctly.

```ts
@setting(v.number().int().min(1).max(10).default(5))
retries!: number

@setting(v.boolean())
debug!: boolean

@setting(v.date())
launchDate!: Date
```

So strings incoming from the environment e.g., `"5"`, `"true"`, `"2025-05-16"`, becomes `5`, `true`, `Date(2025,5,16)` respectively.


## Numbers
```ts
@setting(v.number().int().min(1).max(10).default(5))
rating!: number;
```
See [Numbers](https://zod.dev/api#numbers) in the zod documentation.


## Strings

```ts
@setting(v.string().min(5).max(15))
username!: string

@setting(v.string().email())
contact!: string

@setting(v.string().regex(/^[a-z]{3,10}$/))
slug!: string
```
See [String formats](https://zod.dev/api#string-formats) in the zod documentation.

## Enums

```ts
@setting(v.enum(['debug','info','warn','error']))
logLevel!: string
```

See [Enums](https://zod.dev/api#enums) in the zod documentation.

## Arrays and objects

```ts
@setting(v.array(v.number()))
thresholds!: number[]

@setting.array() // defaults to array of strings
hosts!: string[]

// Objects
@setting(v.object({ name: v.string(), age: v.number() }))
user!: { name: string; age: number }
// or, simple JSON object without a shape
@setting.object()
meta!: Record<string, unknown>
```

Objects are JSON‑parsed from env strings (e.g., `APP_USER={"name":"Ada","age":42}`).

Env examples
```bash
# arrays
export APP_HOSTS='["a.example.org","b.example.org"]'

# objects
export APP_USER='{"name":"Ada","age":42}'
```

## Defaults

Two default styles:

```ts
@setting.string()
host: string = 'localhost'        // assignment default

@setting(v.string().default('x'))
name!: string                     // validator default
```

Assignment defaults are clear for simple cases; validator defaults shine with other constraints.
