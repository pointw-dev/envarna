# Testing

Testing should not force you into DI or brittle `process.env` mutations. Envarna is built to make tests straightforward:

- Lazy loading enables late-bound overrides with `Class.overrideForTest()` — no DI, no module reloads.
- Keys you do not pass to `$override` remain “live” and reflect `process.env` changes on each access.
- Async sources (e.g., secrets) can be applied up front via an app helper that calls `settings.$override({...})`.

Below are two practical patterns, each with a Jest-style alternative where mocking is preferred.

## Set once

Recommended

```typescript
import { sendEmail } from '../src/lib/sender'
import { SmtpSettings} from "../src/settings/smtp";

SmtpSettings.overrideForTest({
  host: '192.168.1.94',
  from: 'noreply@example.org',
  port: 1025
})

describe('Sender', () => {
  describe('sendEmail()', () => {
    it('should send an email', async () => {      
      const info = await sendEmail('to@example.com', 'Subject', '<p>Body</p>')
      expect(info).toBeDefined()
    })
  })
})
```

Alternately (Jest-style mock)

```typescript
import { sendEmail } from '../src/lib/sender'

jest.mock('../src/settings', () => ({
  settings: {
    smtp: {
      host: '192.168.1.94',
      from: 'noreply@example.org',
      port: 1025
    }
  }
}))

describe('Sender', () => {

  describe('sendEmail()', () => {
    it('should send an email', async () => {      
      const info = await sendEmail('to@example.com', 'Subject', '<p>Body</p>')
      expect(info).toBeDefined()
    })
  })
})
```

## Set per test

Recommended
```typescript
import { showWidgets } from "../src/lib/simple";
import { PaginationSettings} from "../src/settings/pagination";

function ifMaxPageSizeIs(size: number) {
  PaginationSettings.overrideForTest({maxPageSize: size})
}

describe('showWidgets', () => {
  it("throws if page size exceeds limit", () => {
    ifMaxPageSizeIs(19);
    expect(() => showWidgets(20)).toThrow("exceeds the max");
  });

  it("returns results for valid page size", () => {
    ifMaxPageSizeIs(22);
    expect(() => showWidgets(20)).not.toThrow();
  });

  it("uses default maxPageSize when no pageSize is provided", () => {
    ifMaxPageSizeIs(7);

    const shownWidgets: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => shownWidgets.push(msg));

    showWidgets();

    expect(shownWidgets).toHaveLength(7);
  });
});
```

```typescript
afterEach(() => {
  PaginationSettings.clearOverride();
  jest.restoreAllMocks();
});
```


Alternately (Jest-style mock)

```typescript
import { showWidgets } from "../src/lib/simple";
import { PaginationSettings} from "../src/settings/pagination";

let mockedMaxPageSize = 100;
jest.mock("../src/settings", () => ({
  get settings() {
    return {
      pagination: {
        maxPageSize: mockedMaxPageSize
      }
    };
  }
}));

function ifMaxPageSizeIs(size: number) {
  mockedMaxPageSize = size;
}

describe('showWidgets', () => {
  it("throws if page size exceeds limit", () => {
    ifMaxPageSizeIs(19);
    expect(() => showWidgets(20)).toThrow("exceeds the max");
  });

  it("returns results for valid page size", () => {
    ifMaxPageSizeIs(22);
    expect(() => showWidgets(20)).not.toThrow();
  });

  it("uses default maxPageSize when no pageSize is provided", () => {
    ifMaxPageSizeIs(7);

    const shownWidgets: string[] = [];
    jest.spyOn(console, "log").mockImplementation((msg) => shownWidgets.push(msg));

    showWidgets();

    expect(shownWidgets).toHaveLength(7);
  });
});

```
