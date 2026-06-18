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
npm run agent:preflight
npm run agent:context
npm run agent:usage:summary
npm run agent:state:validate
npm run agent:budgets:check
npm run agent:safety:check
npm run agent:capabilities:check
npm run agent:skills:validate
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

## Dependency safety

The project keeps Playwright on Node/TypeScript, but agent tooling should use only the Node standard library unless a dependency is explicitly reviewed and approved.

Default rule:

```text
No new npm dependencies for agent tools.
```

If a new dependency is ever proposed, document why the standard library is insufficient, update `.agent/budgets.json`, keep `package-lock.json` committed, and review install scripts/transitive risk before merging.
