# Async loading

Many teams load settings from async sources (secrets managers, HTTP/DB lookups). Envarna keeps runtime code synchronous by resolving those values up front.

## Class-map proxy + `$override`

```ts
// settings/index.ts
import { createSettingsProxy } from 'envarna'
import { MongoSettings } from './mongo'

export const settings = createSettingsProxy({ mongo: MongoSettings })

export async function applyOverrides() {
  await settings.$override({
    mongo: async () => {
      const s = MongoSettings.load()
      s.uri = await fetchSecret('mongo-uri') ?? s.uri
      return s
    },
  })
}
```

Call `await applyOverrides()` once during startup. Afterwards `settings.mongo.*` is available synchronously.

## Lazy vs cached

- Keys passed to `$override`: resolved once and cached; later reads do not consult the environment.
- Keys not passed: lazy; computed on each access via `Class.load()`; reflect `process.env` changes per access.

## Readiness

If you have async overrides, ensure they run before you access the values. Typical patterns:

- In an app entrypoint: `await applyOverrides()` before creating servers/workers.
- In tests: call `applyOverrides()` in `beforeAll`/`beforeEach` when needed.

You can also use `await settings.$ready()` if initialization happens elsewhere.

