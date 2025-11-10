# Error handling

When settings are missing or invalid, envarna throws domain errors you can catch without depending on Zod.

- EnvarnaValidationError: Thrown when validation fails (missing required values, invalid formats, constraint violations). Includes a normalized `issues` array and `cause` (the underlying validator error).
- EnvarnaError: Base class for envarna domain errors.
- isValidationError(err): Type guard to check for validation failures.

## Quick start

```ts
import { isValidationError } from 'envarna'
import { ApiSettings } from './settings'

try {
  const settings = ApiSettings.load()
  // use settings
} catch (err) {
  if (isValidationError(err)) {
    // Render a friendly message or structured response
    console.error('Invalid configuration:')
    for (const issue of err.issues) {
      console.error(`- ${issue.path.join('.')} → ${issue.message}`)
    }
    // Optionally inspect err.cause (a ZodError) for advanced details
  } else {
    throw err // unrelated error — rethrow or handle separately
  }
}
```

## Error shape

- name: `EnvarnaValidationError`
- message: Combined, human‑readable summary of all issues, prefixed with `[ClassName.field]`.
- issues: Array of `{ path: (string|number)[], message: string, code?: string }`.
- cause: The underlying validator error (currently a ZodError). Treat this as internal detail; prefer `issues`.

## Migration note (from ZodError)

Earlier versions threw `ZodError`. You can migrate checks like:

```ts
// before
import { ZodError } from 'zod'
try { /* ... */ } catch (e) {
  if (e instanceof ZodError) { /* ... */ }
}

// after
import { isValidationError } from 'envarna'
try { /* ... */ } catch (e) {
  if (isValidationError(e)) { /* ... */ }
}
```

This keeps envarna’s public API stable and avoids coupling your code to Zod.

