# Motivations

Why build another configuration library on top of `process.env` and `dotenv`? Because as apps and teams grow, “just read an env var” turns into scattered parsing, ad‑hoc defaults, hard‑to‑debug failures, and brittle tests. Envarna keeps the good parts of environment configuration and adds structure where it pays off.

## Problems Envarna Solves

- Type drift and silent coercion: Strings everywhere; forgotten `parseInt` or `=== 'true'` bugs. Envarna validates and coerces at the edge using Zod.
- Scattered defaults: Different files apply different fallbacks. Envarna keeps defaults adjacent to the setting.
- Hidden assumptions: Constraints (length, enum, range) live in code paths. Envarna makes them explicit in decorators.
- Testing pain: Tests mutate `process.env`, reload modules, and bleed across suites. Envarna supports late‑bound overrides per class.
- Discoverability: “What config do we have?” becomes tribal knowledge. Envarna’s CLI lists, documents, and exports the full spec.

## Core Ideas

- Settings as classes: Each domain (SMTP, Mongo, Pub/Sub) is a first‑class settings class extending `BaseSettings`.
- Declarative decorators: Use `@setting.*()` for simple types or `@setting(v.*)` for richer validation. Mark secrets with `@secret()` and dev‑only fields with `@devOnly()`.
- A single `settings` object: `createSettingsProxy({...})` centralizes access. Pass classes for full IntelliSense.
- Async‑first overrides: Keep sync DX by applying async overrides up front: `await settings.$override({ mongo: async () => MongoSettings.load({ uri }) })`.
- Test‑friendly by default: `Class.overrideForTest()` injects values without DI or Jest mocks; clear with `Class.clearOverride()`.

## Why Not Just `process.env`?

`process.env` is universal and it works — until it doesn’t:

- You repeat defaults and parsing logic
- You accept invalid values at runtime
- You bury config behavior inside business code
- You struggle to explain “what variables exist” to other teams

Envarna complements `process.env` by centralizing definitions, validating inputs, and generating accurate documentation and artifacts (e.g., `.env.template`, `values.yaml`, Compose/K8s env stanzas).

## Value for Teams

- Consistency: A standard way to define, validate, and consume configuration across repos.
- Confidence: Fail fast on malformed inputs; protect secrets from accidental leaks in JSON dumps.
- Velocity: Cleaner app code (no env plumbing), better tests, and an always‑current config spec.

## Operational Nuances (The Good Kind)

- Lazy vs cached values: Keys you don’t override remain “live” (reflecting changes to `process.env` on access). Keys you pass to `$override` are resolved once and cached, shielding them from later env changes (still mutable by code).
- Secrets & async: Use `$override` to hydrate values from secret stores or RPCs while keeping `settings.*` reads synchronous.
- CLI outputs: Generate `.env.template`, JSON/YAML/Markdown specs, `values.yaml`, Compose/K8s env blocks — all derived from the same source of truth.

## Try It

Start with one settings class. Add a second. Create a `settings` object. Run `npx envarna list`. Try a per‑test override. You’ll keep the simplicity of env vars, with the reliability of a schema and the ergonomics of a single, typed object.

