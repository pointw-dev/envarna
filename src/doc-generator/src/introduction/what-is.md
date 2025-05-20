# What is envarna?

Envarna is a TypeScript library that helps you manage application configuration. These are the settings that control how an application behaves and how it connects to other services.  It is a lightweight wrapper over the [Zod validation library](https://zod.dev/api?id=strings), the [dotenv environment variable loader](https://www.npmjs.com/package/dotenv), with some syntactic sugar to make it all easy to use.

Most applications use environment variables to configure things like database connection strings, feature flags, limits, API keys,  ports, etc. And most of the time, that means reaching for `process.env`, either directly or through a helper like `dotenv`.

That works well until it doesn't.

Configuration logic starts to creep into your application. You scatter default values, forget to parse strings into numbers, accidentally pass invalid values, and write brittle tests that manipulate `process.env` directly. Suddenly, managing settings becomes a source of bugs, not stability.

Envarna helps you tame this complexity. It gives you a declarative way to define, validate, and override configuration settings, while keeping your application code clean and your tests isolated.

## A Simple Example

Let’s start with a common problem: enforcing a maximum page size for paginated requests.

### Without envarna:

```ts
// usage
import dotenv from 'dotenv';
dotenv.config();

export function getPage(size: number): string[] {
  const maxSize = parseInt(process.env.MAX_PAGE_SIZE || '100', 10);
  if (size > maxPageSize) {
    throw new Error(`Page size ${size} exceeds max of ${maxPageSize}`);
  }
  return Array.from({ length: size }, (_, i) => `Item ${i + 1}`);
}
```

**Problems:**

* You must remember to parse the value
* You don’t validate that it’s a positive integer
* You repeat the default (`100`) if used in multiple places
* There’s no visibility into what settings exist
* Tests must mutate `process.env` and reset it after

All of these problems can be address with more sophisticated use of `process.env`.  That's what envarna does.

### With envarna:

```ts
// pagination.ts
import { BaseSettings, setting, v } from 'envarna';

export class PaginationSettings extends BaseSettings {
  @setting(v.number().int().positive().default(100))
  maxPageSize: number;
}
```

```ts
// settings/index.ts
import { createSettingsProxy } from 'envarna';
import { PaginationSettings } from './pagination';

export const settings = createSettingsProxy({
  pagination: () => PaginationSettings.load(),
});
```

```ts
// usage
import { settings } from './settings';

export function getPage(size: number): string[] {
  const max = settings.pagination.maxPageSize;
  if (size > max) {
    throw new Error(`Page size ${size} exceeds max of ${max}`);
  }
  return Array.from({ length: size }, (_, i) => `Item ${i + 1}`);
}
```

**Benefits:**

* Separate environment parsing and validating out of the business logic
* Setting values are more intentional, with hidden assumptions made explicit
* Central modularized approach to all settings
* Type-checked and validated config
* Declarative default (`100`) lives with the setting
* Fail-fast on malformed envars (e.g., `"abc"` instead of a number)
* Easily testable via `.overrideForTest()`
* Discoverable via CLI: `npx envarna list`, `npx envarna env`, etc.
* Common patterns in your enterprise can bubble out of individual apps into shared packages - standardizing how apps are configured.


## In Tests

```ts
import { PaginationSettings } from '../src/settings/pagination';
import { getPage } from '../src/lib/data';

PaginationSettings.overrideForTest({ maxPageSize: 5 });

it('throws if page size exceeds max', () => {
  expect(() => getPage(10)).toThrow('exceeds max');
});
```


## Why This Matters

You don’t need envarna to read a string from the environment.
You need it when:

* You want to apply defaults
* You want to validate inputs
* You want to decouple parsing/validation behavior
* You want to write clean, reliable tests
* You want visibility into all config variables

Try it in a single settings group. You may not realize how much hidden complexity you’ve been managing, until envarna removes it.
