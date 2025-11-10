# Error handling

Domain errors provide a stable public contract for failures without exposing Zod directly.

## Types

- EnvarnaError: Base class for envarna errors.
- EnvarnaValidationError: Thrown when validation fails.
  - name: `EnvarnaValidationError`
  - message: Combined, human‑readable summary of all issues with `[ClassName.field]` prefixes
  - issues: `{ path: (string|number)[]; message: string; code?: string; meta?: Record<string, unknown> }[]`
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
    err.issues.forEach(i => console.error(`${i.path.join('.')} → ${i.message}`))
  } else {
    throw err
  }
}
```

## Notes

- Prefer checking `isValidationError(err)` rather than importing Zod types.
- The `cause` property contains the original ZodError and is non‑enumerable. Treat it as internal; use `issues` for portable details.
- `issues.meta` may include common fields like `expected`, `received`, `minimum`, `maximum`, `inclusive`, `validation`, `type` when available.
