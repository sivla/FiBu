# Local Setup

This repository is intended to work on Windows and macOS.

## First checkout

```bash
npm install
npx playwright install
```

Create a local `.env` from `.env.example` and keep real tenant/auth values local.

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

## Business Central auth

Authentication is local and must not be committed.

```bash
npm run auth:bc
```

This creates local Playwright auth state under `playwright/.auth/`.

## Normal checks

```bash
npm run check:encoding
git diff --check
```

If TypeScript files changed, also run:

```bash
npx tsc --noEmit
```

## Local-only artifacts

Do not commit:

- `.env`
- `playwright/.auth/`
- `playwright-report/`
- `test-results/`
- traces, videos, console logs or raw page YAML dumps
