# Naming, aliases, and push-to-env

## Naming convention

- Class name prefix: portion before `Settings`, uppercased (e.g., `MongoSettings` → `MONGO`).
- Field name: camelCase transformed to UPPER_SNAKE_CASE (e.g., `connectionString` → `CONNECTION_STRING`).
- Environment variable: `<PREFIX>_<FIELD>`.

```ts
export class MongoSettings extends BaseSettings {
  @setting.string()
  connectionString = 'mongodb://localhost:27017'
}
// → MONGO_CONNECTION_STRING
```

## Aliases

Use `@alias('ENV_VAR_NAME')` to map a field to a specific env var. Aliases take precedence when present.

```ts
export class PubsubSettings extends BaseSettings {
  @setting.string()
  @alias('GOOGLE_CLOUD_PROJECT')
  projectId = 'my-project'
}
```

## push-to-env

Use `@pushToEnv()` to write a field’s value into `process.env` during load when the env var is missing. This helps integrate with tools that expect those variables.

```ts
export class SmtpSettings extends BaseSettings {
  @setting.string()
  @pushToEnv()
  host = 'localhost'
}
```

Notes
- Use sparingly; it’s a convenience to help local tooling.
- If combined with `@alias`, the alias name is used for the env var.

