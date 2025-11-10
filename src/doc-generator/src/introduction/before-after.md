---
title: Before vs. After
---

# Before vs. After: From ad‑hoc dotenv to envarna

This guide contrives a realistic service configuration that’s hard to manage with plain `dotenv` + `process.env`, then shows how envarna solves it with typed settings, fail‑fast validation, defaults, good DX, and CLI automation.

## Scenario

Payments API needs to read configuration for HTTP, database, auth, logging, and ops:

- HTTP: `HTTP_PORT` (number), `BASE_URL` (derived), `ALLOWED_ORIGINS` (array)
- Auth: `JWT_SECRET` (secret), `TOKEN_TTL_MINUTES` (number w/ bounds)
- Database: `DB_URI` (string), `POOL` (number), `OPTIONS_JSON` (JSON object)
- Ops: `ENABLE_METRICS` (boolean), `METRICS_PATH` (default "/metrics")
- Env: `APP_ENV` (enum: dev|staging|prod). In prod, `JWT_SECRET` must be present.

## Before: dotenv + manual parsing

```ts
// examples/before-after/before.ts
import dotenv from 'dotenv'
dotenv.config()

function bool(val: string | undefined, def = false) {
  if (val == null) return def
  // Common bug: "false" is truthy if you forget to compare.
  return val === 'true' || val === '1'
}

function num(val: string | undefined, def: number) {
  const n = Number(val)
  return Number.isFinite(n) ? n : def
}

function json<T>(val: string | undefined, def: T): T {
  if (!val) return def
  try { return JSON.parse(val) as T } catch { return def }
}

export function getConfig() {
  // No single source of truth; defaults scattered and unchecked
  const APP_ENV = process.env.APP_ENV ?? 'dev' // could be any string
  const HTTP_PORT = num(process.env.HTTP_PORT, 3000) // accepts 0, -1, NaN silently
  const BASE_URL = process.env.BASE_URL ?? `http://localhost:${HTTP_PORT}` // may not match real host
  const ALLOWED_ORIGINS = json<string[]>(process.env.ALLOWED_ORIGINS, []) // accepts bad shapes silently

  const DB_URI = process.env.DB_URI // may be missing; crash later when connecting
  const POOL = num(process.env.POOL, 5)
  const OPTIONS_JSON = json(process.env.OPTIONS_JSON, { ssl: false })

  const ENABLE_METRICS = bool(process.env.ENABLE_METRICS, true)
  const METRICS_PATH = process.env.METRICS_PATH ?? '/metrics'

  const JWT_SECRET = process.env.JWT_SECRET // missing in prod? we won’t know yet
  const TOKEN_TTL_MINUTES = num(process.env.TOKEN_TTL_MINUTES, 60)

  if (APP_ENV === 'prod' && !JWT_SECRET) {
    // Fail late at runtime instead of on startup
    throw new Error('Missing JWT_SECRET in production')
  }

  return {
    env: { APP_ENV },
    http: { HTTP_PORT, BASE_URL, ALLOWED_ORIGINS },
    db: { DB_URI, POOL, OPTIONS_JSON },
    ops: { ENABLE_METRICS, METRICS_PATH },
    auth: { JWT_SECRET, TOKEN_TTL_MINUTES },
  }
}
```

Pain points:

- Missing/invalid values fail late (e.g., `DB_URI`, `JWT_SECRET`) or are silently coerced.
- Type safety is manual and partial; strings like "false" are easy to mishandle.
- No cross‑field validation or env‑aware rules (e.g., prod requires `JWT_SECRET`).
- No single source for docs or templates; `.env.example` drifts from code.
- Hard to represent arrays/objects; ad‑hoc JSON parsing is fragile.

## After: envarna settings + CLI

```ts
// examples/before-after/after.ts
import { BaseSettings, setting, v, secret, devOnly, pushToEnv, createSettingsProxy } from 'envarna'

export class EnvSettings extends BaseSettings {
  /** Allowed values constrain CI and runtime */
  @setting(v.enum(['dev','staging','prod']))
  appEnv: 'dev' | 'staging' | 'prod' = 'dev'
}

export class HttpSettings extends BaseSettings {
  @setting.number()
  port: number = 3000

  /** Optional but derived and pushed to process.env for other libs */
  @setting.string()
  @pushToEnv()
  baseUrl: string = ''

  /** JSON string coerced to array (e.g., '["https://a.com"]') */
  @setting(v.array())
  allowedOrigins: string[] = []

  protected validate() {
    // Post‑parse fixup and cross‑field logic
    if (!this.baseUrl) this.baseUrl = `http://localhost:${this.port}`
  }
}

export class DbSettings extends BaseSettings {
  @setting.string()
  uri: string = ''

  @setting.number().min(1).max(50)
  pool: number = 5

  /** Arbitrary options expressed as JSON in env */
  @setting.object({ ssl: v.boolean(), connectTimeoutMs: v.number().optional() })
  options: { ssl: boolean; connectTimeoutMs?: number } = { ssl: false }
}

export class AuthSettings extends BaseSettings {
  @setting.string()
  @secret()
  jwtSecret: string = ''

  @setting.number().min(5).max(24 * 60)
  tokenTtlMinutes: number = 60
}

export class OpsSettings extends BaseSettings {
  @setting.boolean()
  enableMetrics: boolean = true

  @setting.string()
  metricsPath: string = '/metrics'

  /** Handy for local development only */
  @setting.boolean()
  @devOnly()
  seedDemoData: boolean = false
}

// Optional: cross‑group constraint
export class AppSettings extends BaseSettings {
  static refineSchema(schema: any) {
    return schema.superRefine((data, ctx) => {
      const env = EnvSettings.load()
      if (env.appEnv === 'prod' && !AuthSettings.load().jwtSecret) {
        ctx.addIssue({ code: 'custom', message: 'JWT secret required in prod' })
      }
    })
  }
}

// Compose a typed proxy for DI‑free access in app code
export const settings = createSettingsProxy({
  env: EnvSettings,
  http: HttpSettings,
  db: DbSettings,
  auth: AuthSettings,
  ops: OpsSettings,
})

// Optionally resolve async/derived values once at startup
export async function initialize() {
  await settings.$override({
    env: () => EnvSettings.load(),
    http: () => HttpSettings.load(),
    db: () => DbSettings.load(),
    auth: async () => {
      const s = AuthSettings.load()
      // e.g., s.jwtSecret = await fetchSecret('jwt')
      return s
    },
    ops: () => OpsSettings.load(),
  })
}

// Usage
// await initialize()
// console.log(settings.http.baseUrl) // typed and validated
```

What’s improved:

- Fail‑fast: On `load()`, Zod validates types, enums, bounds, shapes, and cross‑field rules. Missing or invalid values throw immediately with contextual errors like `[AuthSettings.jwtSecret] Required`.
- Type safety: Decorators define the exact type, including arrays/objects via `v.array()` / `setting.object()` with JSON pre‑parsing.
- Defaults: Declared alongside fields; merged before env; survive refactors.
- Secrets: Marked with `@secret()` — redacted in dumps and docs.
- Dev‑only: Mark with `@devOnly()` and filter via CLI `--skip-dev`.
- Derived values: `@pushToEnv()` sets `process.env[ENVVAR]` post‑validation for libraries that only read env.
- Async loaders: `createSettingsProxy()` + `$override()` cleanly fetch secrets or compute values once.

## CLI as documentation and pipeline glue

- `npx envarna list` — prints grouped, typed, defaulted envs (aliases, secrets, dev‑only annotated).
- `npx envarna env` — writes `.env.template` from classes (no drift).
- `npx envarna md` — writes `SETTINGS.md` for team visibility and code review.
- `npx envarna json --root cfg --flat --code` — emits CI‑ready JSON with code keys for templating.
- `npx envarna k8s` — prints Kubernetes `env:` items; `values` writes Helm `values.yaml`.

Examples:

```bash
# Authoritative template
npx envarna env

# CI: embed typed config for preview deploys
npx envarna json --root cfg --flat --code > config.json

# Docs in PRs
npx envarna md && git add SETTINGS.md
```

## Extra tips and patterns

- Aliases: Use `alias('SOME_OTHER_NAME')` to support legacy env names while migrating.
- Validation hooks: Use `refineSchema()` for multi‑field rules, or instance `validate()` post‑parse for derived fields.
- Pushing derived env: e.g., compute `HTTP_BASE_URL` once and `@pushToEnv()` so downstream HTTP clients can read it from `process.env`.
- Testing: `Class.overrideForTest({ ... })` + `clearOverride()` keeps tests simple without DI; or initialize the proxy with `$override()` in suite setup.

See also: How‑to pages on decorators, validation, testing, command line, and async loading.
