# Settings object

<centered-image src="/img/work-in-progress.png" />

> The following assumes that you create all settings classes in `src/settings`. Adjust as required if you put yours somewhere else.

This is optional but highly recommended.

In the `index.ts` file, you aggregate all settings classes under a single `settings` object, then lazy-load them.

Use `createSettingsProxy()` to define a centralized `settings` object. This pattern defers loading until first access and enables test overrides.

```ts
// settings/index.ts
import { createSettingsProxy } from 'envarna';
import { AppSettings } from './app';
import { PageSettings } from './page';

export const settings = createSettingsProxy({
  app: () => AppSettings.load(),
  other: () => OtherSettings.load(),
});
```

