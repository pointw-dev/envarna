# Error handling

Domain errors provide a stable public contract for failures without exposing Zod directly.

## Types

- EnvarnaError: Base class for envarna errors.
- EnvarnaValidationError: Thrown when validation fails.
  - name: `EnvarnaValidationError`
  - message: Combined, human‑readable summary of all issues with `[ClassName.field]` prefixes
  - issues: `{ path: (string|number)[]; message: string; code?: string }[]`
  - cause: Underlying validator error (implementation detail)

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
- The `cause` property currently contains a ZodError, but consumers should treat it as internal; rely on `issues` for portable details.

