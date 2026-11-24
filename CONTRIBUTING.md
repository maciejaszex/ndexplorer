# Contributing to NDExplorer

Thanks for your interest! This is a small personal project, but contributions are welcome.

## How to contribute

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run lint`, `npm test` and `npm run secrets` all pass
4. Open a pull request

## Development setup

Requires **Node.js 26+** (see `.nvmrc`).

```bash
nvm use                 # matches .nvmrc
cp .env.example .env    # fill in your credentials
npm install
npm run dev
```

## Guidelines

- Keep it simple — vanilla JS, no frameworks on the client
- Follow existing code style (ESLint will enforce it)
- Shared logic belongs in `src/lib/` — tests import that code, do not re-implement it
- Write tests for new features when practical (`npm test` enforces ≥ 80% coverage on `src/lib/**`)
- UI text must support both PL and EN (see `src/i18n/translations.js`)

## Reporting bugs

Open an [issue](https://github.com/maciejaszex/ndexplorer/issues) with steps to reproduce.
