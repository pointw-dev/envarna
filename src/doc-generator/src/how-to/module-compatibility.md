# Module Format Compatibility

**Envarna is packaged with full support for both modern ESM and legacy CommonJS environments.** This means you can use it in any modern JavaScript or TypeScript project with no additional configuration.

## Supported Environments

| Environment       | Example                                        | Supported |
|-------------------|------------------------------------------------|-----------|
| TypeScript (ESM)  | `import { setting } from 'envarna'`            | ✅ Yes     |
| TypeScript (CJS)  | `const { setting } = require('envarna')`       | ✅ Yes     |
| Node.js ESM       | `import { setting } from 'envarna'`            | ✅ Yes     |
| Node.js CommonJS  | `const { setting } = require('envarna')`       | ✅ Yes     |
| `npx envarna` CLI | `npx envarna list`                             | ✅ Yes     |

> **Minimum Node.js version:** `>= 18`

## Packaging Details

Envarna uses a [dual-module strategy](https://nodejs.org/api/packages.html#dual-commonjses-module-packages) to support both ecosystems cleanly:

- The code is built to two targets:
  - `dist/esm/` → ESM (`import/export`)
  - `dist/cjs/` → CommonJS (`require/module.exports`)
- The `package.json` uses the [`exports` field](https://nodejs.org/api/packages.html#exports) to route tools automatically:
  ```json
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/esm/index.d.ts"
    }
  }
  ```

This means you can import Envarna naturally, and your toolchain (Node, TypeScript, Webpack, etc.) will resolve the correct version.

## TypeScript Support

TypeScript will automatically pick up the appropriate `.d.ts` types from the ESM build:

```ts
import { BaseSettings, setting } from 'envarna';
```

No additional type configuration is required.
