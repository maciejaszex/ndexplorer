# Tests

## Stack

- **Vitest** — test runner (shares Vite config with Astro)
- **happy-dom** — lightweight DOM for log rendering/filtering tests
- **@vitest/coverage-v8** — coverage, with an enforced **≥ 80%** threshold on `src/lib/**`

## Structure

```
tests/
├── utils/
│   ├── helpers.ts      — loads .astro/.js source files, splits into sections
│   ├── mocks.ts        — 17 fake log entries (DEVICE_1/DEVICE_2, ±7 days)
│   └── dom.ts          — thin DOM adapter over src/lib/logs.ts (no duplicated logic)
├── format.test.ts      — src/lib/logs.ts: formatting, CSV, filtering (21 tests)
├── validation.test.ts  — src/lib/validation.ts: query validation (12 tests)
├── nextdns.test.ts     — src/lib/nextdns.ts: config, URL building, errors (7 tests)
├── api.test.ts         — /api/* route handlers, end-to-end with mocked fetch (6 tests)
├── connect.test.ts     — connect screen + real connect flow via app.js (6 tests)
├── panel.test.ts       — main panel + layout + i18n (15 tests)
├── logs.test.ts        — log rendering + filtering (7 tests)
└── view.test.ts        — desktop + mobile view, scroll, real clear-button wiring (3 tests)
```

## Approach

- **Test the shipped code** — shared presentation/filtering logic lives in `src/lib/logs.ts` and the NextDNS client in `src/lib/nextdns.ts`. Tests import these modules directly, so `tests/utils/dom.ts` is a thin adapter rather than a re-implementation. `connect.test.ts` imports the real `src/scripts/app.js` controller.
- **Pragmatic, not exhaustive** — tests cover the top business-relevant scenarios. Each `it()` may validate several related things (e.g. tracker toggle ON and OFF in one test).
- **Template tests** (`connect`, `panel`): read `.astro` source as a string, assert expected HTML structure (IDs, data attributes, i18n keys, default visibility states).
- **DOM tests** (`logs`, `format`): use happy-dom to render mock logs into a real DOM and assert rendering/filtering behavior.
- **Unit tests** (`format`, `validation`, `nextdns`): cover pure logic, query validation and the API client (with `fetch`/env mocked) — including the CSV formula-injection guard, ISO/device validation and limit clamping.
- **Route tests** (`api`): import the real `GET` handlers from `src/pages/api/*` and assert status codes, validation errors and that upstream error bodies are never leaked to the client.
- **i18n parity test**: verifies PL and EN translations have the exact same set of keys.
- **All data is fake** — no real API calls, no real domains or device names. Mock data lives in `utils/mocks.ts`.

## Commands

```bash
npm test            # single run, with coverage report
npm run test:watch  # watch mode
npm run test:coverage  # explicit coverage run
```
