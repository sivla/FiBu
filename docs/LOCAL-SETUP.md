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
npm run agent:skills:quality
npm run agent:dry-run
npm run agent:run-plan
npm run agent:result-normalize
npm run check:encoding
git diff --check
```

`npm run agent:dry-run` erzeugt nur einen lokalen JSON-Laufplan. Es startet weder Business Central noch Playwright und liest keine Screenshot-/Binary-Artefakte.
`npm run agent:run-plan` wandelt diesen Dry-Run in eine konkrete Schrittfolge um. Auch dieser Befehl ist plan-only und startet weder Business Central noch Playwright.
`npm run agent:result-normalize` normalisiert ein Ergebnisformat fuer spaetere State-Finalisierung. Ohne Input erzeugt es einen sicheren `pending`-Befund aus dem aktuellen Run-Plan.

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
