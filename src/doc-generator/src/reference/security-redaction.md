# Security & redaction

## @secret
Mark sensitive fields to avoid accidental leaks in JSON dumps and highlight in CLI.

```ts
@setting.string()
@secret()
connectionString!: string
```

## Safe JSON dumps
`toJSON` redacts secret values as `'****'`. Dumping the top-level `settings` object is safe:

```ts
console.log(JSON.stringify(settings, null, 2))
```

## Caveats
- Redaction applies to JSON dumps; code can still read/print raw secrets.
- Combine with least-privilege secrets storage and careful logging.
