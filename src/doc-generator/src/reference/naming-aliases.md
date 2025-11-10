# Naming & aliases

## Naming convention
- Class prefix: before `Settings`, uppercased (e.g., `MongoSettings` → `MONGO`).
- Field name: camelCase → UPPER_SNAKE_CASE (e.g., `connectionString` → `CONNECTION_STRING`).
- Environment variable: `<PREFIX>_<FIELD>`.

## Aliases
- `@alias('ENV_VAR_NAME')` maps a field to a specific env var and takes precedence.

## push-to-env
- `@pushToEnv()` always writes the field’s value into `process.env` during load (overwriting if present). Use sparingly, and avoid using it for secrets.
