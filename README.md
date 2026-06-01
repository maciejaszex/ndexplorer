<p align="center">
  <h1 align="center">NDEXPLORER</h1>
  <p align="center">
    Fast, read-only NextDNS log explorer.<br>
    Runs locally on <code>localhost:4321</code>. Bilingual interface (PL / EN).
  </p>
  <p align="center">
    <a href="https://github.com/maciejaszex/ndexplorer"><img src="https://img.shields.io/github/license/maciejaszex/ndexplorer?color=blue" alt="MIT License"></a>
    <a href="https://deepwiki.com/maciejaszex/ndexplorer"><img src="https://img.shields.io/badge/DeepWiki-docs-0ea5e9" alt="DeepWiki docs"></a>
    <img src="https://img.shields.io/badge/node-24%2B-brightgreen" alt="Node.js 24+">
    <img src="https://img.shields.io/badge/astro-6.x-ff5d01" alt="Astro 6">
    <img src="https://img.shields.io/badge/tailwind-4.x-38bdf8" alt="Tailwind CSS 4">
    <img src="https://img.shields.io/badge/docker-ready-2496ED" alt="Docker">
  </p>
</p>

---

## Screenshots

![Log browser — full view](assets/demo1.png)

![Filtered view with auto-refresh](assets/demo2.png)

## Why?

The NextDNS dashboard doesn't offer flexible log filtering. NDExplorer gives you a compact, fast interface with:

- Client-side filtering by domain and tracker name
- Infinite scroll pagination
- Auto-refresh (30s / 1m / 5m)
- Device-based log browsing
- API text search (`search` param in NextDNS logs API)
- Date range presets (15m, 1h, 1d, 3d, 7d)
- CSV export modal (single device, max 7 days, paged fetch)
- Resizable log table columns + overflow hover popovers
- Modern cohesive visual refresh (cards, focus rings, subtle motion)
- Theme switcher (Dark / Light, default: Dark)

All read-only — nothing is modified in your NextDNS settings.

## Requirements

- **Node.js** 24+ (see `.nvmrc`)
- **NextDNS API key** — [get it here](https://my.nextdns.io/account)
- **NextDNS profile ID** — visible in your dashboard URL (e.g. `abc123` from `https://my.nextdns.io/abc123/...`)

## Quick start

```bash
git clone https://github.com/maciejaszex/ndexplorer.git
cd ndexplorer
cp .env.example .env    # fill in your API key and profile ID
npm install
npm run dev             # open http://localhost:4321
```

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `NEXTDNS_API_KEY` | Your NextDNS API key | *(required)* |
| `NEXTDNS_PROFILE_ID` | Your NextDNS profile ID | *(required)* |
| `NEXTDNS_LOGS_LIMIT` | Logs per API request (10–1000) | `200` |

## Docker

```bash
cp .env.example .env   # fill in your API key and profile ID
npm run docker:build    # build image
npm run docker:run      # run container on localhost:4321
```

Or manually:

```bash
docker build -t ndexplorer .
docker run --rm --env-file .env -p 4321:4321 ndexplorer
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (`localhost:4321`) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm test` | Run tests with coverage (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests and print a coverage report |
| `npm run secrets` | Scan for leaked secrets ([Secretlint](https://github.com/secretlint/secretlint)) |
| `npm run kill` | Kill process on port 4321 |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |
| `npm run docker:clean` | Remove Docker image |

## Tech stack

| | |
|---|---|
| Framework | [Astro](https://astro.build/) 6.x (SSR) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4.x (dark/light themes) |
| Client logic | Vanilla JS |
| Linting | [ESLint](https://eslint.org/) 10 + typescript-eslint |
| Testing | [Vitest](https://vitest.dev/) 4.x + happy-dom |
| Secret scanning | [Secretlint](https://github.com/secretlint/secretlint) 13.x |
| Git hooks | [Husky](https://typicode.github.io/husky/) 9.x |
| Container | [Docker](https://www.docker.com/) (multi-stage build) |

## Tests

77 tests across 8 files using Vitest + happy-dom. Shared presentation/filtering/validation logic lives in `src/lib/` and is unit-tested directly (the suite exercises the shipped code, not a copy); the `/api/*` route handlers are tested end-to-end with a mocked upstream. Coverage of `src/lib/**` is enforced at **≥ 80%** (currently 100%). A **pre-commit hook** runs `lint`, `test` (with coverage) and `secrets` in parallel before every commit.

See [`tests/README.md`](tests/README.md) for strategy, structure and mock data approach.

## Cursor rules

The project includes AI coding rules in `.cursor/rules/` for use with Cursor IDE:

| Rule | Scope | What it does |
|---|---|---|
| `git-workflow` | always | Never run git add/commit/push automatically |
| `tech-stack` | always | Astro + vanilla JS + Tailwind architecture |
| `security` | always | Read-only, only GET, token server-side |
| `testing` | `tests/**` | Vitest + happy-dom conventions |
| `i18n` | `src/pages, scripts, i18n` | PL/EN bilingual UI rules |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — use freely, but please keep the copyright notice and link back to [this repository](https://github.com/maciejaszex/ndexplorer).
