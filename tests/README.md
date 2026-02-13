# Tests

## Stack

- **Vitest** — test runner (shares Vite config with Astro)
- **happy-dom** — lightweight DOM for log rendering/filtering tests

## Structure

```
tests/
├── utils/
│   ├── helpers.ts   — loads .astro/.js source files, splits into sections
│   ├── mocks.ts     — 17 fake log entries (DEVICE_1/DEVICE_2, ±7 days)
│   └── dom.ts       — DOM render/filter functions mirroring app.js logic
├── connect.test.ts  — connect screen (5 tests)
├── panel.test.ts    — main panel + layout + i18n (11 tests)
└── logs.test.ts     — log rendering + filtering (7 tests)
```

## Approach

- **Pragmatic, not exhaustive** — tests cover the top business-relevant scenarios, not edge cases. Each test case validates multiple related things in one `it()` block (e.g. tracker toggle ON and OFF is a single test, not two).
- **Template tests** (`connect`, `panel`): read `.astro` source as a string, assert expected HTML structure (IDs, data attributes, i18n keys, default visibility states). No DOM parsing needed.
- **DOM tests** (`logs`): use happy-dom to render mock logs into a real DOM, then test rendering output, filtering logic and combined filter behavior.
- **i18n parity test**: verifies PL and EN translations have the exact same set of keys — prevents missing translations.
- **All data is fake** — no real API calls, no real domains or device names. Mock data lives in `utils/mocks.ts`.
- **Utils, not inline logic** — render/filter functions and helpers are extracted to `utils/`, test files contain only assertions.

## Commands

```bash
npm test            # single run
npm run test:watch  # watch mode
```
