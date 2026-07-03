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

Complete Login/MFA in the browser opened by this command and wait until the Business Central shell is visible. A normal Chrome/Codex app login is not enough: Playwright uses its own browser context and only saves auth state after it sees Business Central itself.

Safe shell signals are the Role Center, Search/Tell Me, or My Settings. Only then does the script create local Playwright auth state under `playwright/.auth/`.

Check whether the stored state is usable:

```bash
npm run auth:bc:check
```

The check must return `canUseStoredAuth=true` before any Business Central workflow or read-only evidence run starts.

For a compact go/no-go decision that also points to the last recorded auth blocker, run:

```bash
npm run auth:bc:doctor
```

The doctor does not open Business Central. It only summarizes whether target workflows may run or whether the Playwright auth window must be refreshed first.

If the check stays red and the browser appears to be stuck on Microsoft sign-in, use the short diagnostic run:

```bash
npm run auth:bc:diagnose
```

The diagnostic command uses a shorter timeout and prints non-secret shell signals such as host, path shape, page title, and whether a Business Central shell signal was visible. It must not print cookies, tokens, tenant IDs, account names, or page body text.

If diagnosis still shows Microsoft sign-in, finish login/MFA in the Playwright window and wait for the Business Central shell. Do not treat the login page as Business Central evidence and do not run target workflows until `auth:bc:check` is green.

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
npm run agent:state-finalize
npm run agent:state-finalize:test
npm run check:encoding
git diff --check
```

`npm run agent:dry-run` erzeugt nur einen lokalen JSON-Laufplan. Es startet weder Business Central noch Playwright und liest keine Screenshot-/Binary-Artefakte.
`npm run agent:run-plan` wandelt diesen Dry-Run in eine konkrete Schrittfolge um. Auch dieser Befehl ist plan-only und startet weder Business Central noch Playwright.
`npm run agent:result-normalize` normalisiert ein Ergebnisformat fuer spaetere State-Finalisierung. Ohne Input erzeugt es einen sicheren `pending`-Befund aus dem aktuellen Run-Plan.
`npm run agent:state-finalize` erzeugt standardmaessig nur einen State-Patch-Plan. Schreiben ist nur mit `--write` moeglich und nur, wenn das normalisierte Result `safeToFinalizeState=true` enthaelt.
`npm run agent:state-finalize:test` nutzt ein kuenstliches sicheres Result und prueft nur den Planmodus. Es schreibt nichts.

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
