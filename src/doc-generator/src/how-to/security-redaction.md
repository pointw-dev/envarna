# Security & redaction

## Mark secrets

Use `@secret()` on fields that contain sensitive values (passwords, tokens).

```ts
export class DbSettings extends BaseSettings {
  @setting.string()
  @secret()
  connectionString = 'mongodb://...'
}
```

## Safe JSON dumps

`BaseSettings.toJSON()` redacts secret fields as `'****'`. Therefore dumping the `settings` object is safe for logging:

```ts
console.log(JSON.stringify(settings, null, 2))
```

## Caveats

- Redaction is for JSON dumps; code can still read and print the raw secret. Treat secrets with care in application logs.
- Consider environment separation and minimal privileges for secret stores.

