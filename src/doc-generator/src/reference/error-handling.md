# Error handling

Domain errors provide a stable public contract for failures without exposing Zod directly.

## Types

- EnvarnaError: Base class for envarna errors.
- EnvarnaValidationError: Thrown when validation fails.
  - name: `EnvarnaValidationError`
  - message: Combined, human‑readable summary of all issues with `[ClassName.field]` prefixes
  - issues: `{ path: (string|number)[]; message: string; code?: string; meta?: { envVar?: string; alias?: string; expected?: unknown; received?: unknown; minimum?: number; maximum?: number; inclusive?: boolean; validation?: string; type?: string } }[]`
  - cause: Underlying validator error (non‑enumerable, implementation detail)
  - toJSON(): serializes `{ name, message, issues }` (omits `cause`)

## Helpers

- isValidationError(err): Type guard for `EnvarnaValidationError`.

## Example

```ts
import { isValidationError } from 'envarna'
import { ApiSettings } from './settings'

try {
  const s = ApiSettings.load()
} catch (err) {
  if (isValidationError(err)) {
    // Basic formatting using portable details
    err.issues.forEach(i => {
      const envVar = i.meta?.envVar
      const alias = i.meta?.alias
      const envHint = alias ? `${alias} (alias for ${envVar})` : envVar
      console.error(`${i.path.join('.')} → ${i.message}${envHint ? ` [env: ${envHint}]` : ''}`)
    })
  } else {
    throw err
  }
}
```

## Sample Error Object

Below is an example of the serialized validation error (via `JSON.stringify(err)` or `err.toJSON()`). Note that `cause` is intentionally omitted from serialization and is non-enumerable.

```json
{
  "name": "EnvarnaValidationError",
  "message": "[ApiSettings.host] Required\n[ApiSettings.port] Number must be greater than or equal to 1024",
  "issues": [
    {
      "path": ["host"],
      "message": "Required",
      "code": "invalid_type",
      "meta": {
        "envVar": "API_HOST"
      }
    },
    {
      "path": ["port"],
      "message": "Number must be greater than or equal to 1024",
      "code": "too_small",
      "meta": {
        "envVar": "API_PORT",
        "minimum": 1024,
        "inclusive": true
      }
    },
    {
      "path": ["apiKey"],
      "message": "Required",
      "code": "invalid_type",
      "meta": {
        "envVar": "API_API_KEY",
        "alias": "API_KEY"  
      }
    }
  ]
}
```

## Notes

- Prefer checking `isValidationError(err)` rather than importing Zod types.
- The `cause` property contains the original ZodError and is non‑enumerable. Treat it as internal; use `issues` for portable details.
- `issues.meta` includes portable, optional fields:
  - `envVar`: the derived environment variable name for the top-level field
  - `alias`: the alias env var if specified via `@alias()`
  - Common validation context, when available: `expected`, `received`, `minimum`, `maximum`, `inclusive`, `validation`, `type`.
