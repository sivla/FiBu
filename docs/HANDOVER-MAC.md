# Mac Handover

This branch is prepared so another Codex agent can continue on macOS without Windows-specific assumptions.

## Clone and install

```bash
git checkout codex/token-efficient-autopilot-state
npm install
npx playwright install
cp .env.example .env
npm run auth:bc
npm run auth:bc:check
```

Complete Login/MFA in the opened browser and keep it open until the Business Central shell is visible. Safe shell signals are the Role Center, Search/Tell Me, or My Settings. If `npm run auth:bc:check` remains red and the browser is stuck on Microsoft sign-in, run:

```bash
npm run auth:bc:diagnose
```

The diagnose command prints only redacted shell signals. Do not commit `.env`, `playwright/.auth/`, screenshots from login pages, traces, tokens, tenant IDs, or account details.

Before running any Business Central workflow, validate the compact agent layer:

```bash
npm run agent:preflight
npm run agent:state:validate
npm run agent:budgets:check
npm run agent:safety:check
```

## Path rules

- Treat repo-relative paths as the source of truth.
- Do not write absolute Windows paths into committed state or evidence.
- Use Node path helpers in scripts when adding cross-platform code.
- Agent tools must not add npm dependencies by default; use Node standard library first.
- Screenshots and evidence stay under `playwright/projects/fibu-book5/`.

## Agent startup

Start with:

```text
.agent/autopilot.md
.agent/state/current.json
.agent/state/project_state.json
.agent/state/last_run_summary.json
```

Then load only the active case file and relevant skill.

## Current handover point

Active case:

```text
TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY
```

Important limit:

```text
Target world is playthru / UNIVERSAARL-DE. Do not rerun D2F until npm run auth:bc:check is green. No vendor/customer/item/document creation, no Preview Posting, no Posting, no payment and no API shortcut before the active case gate allows it.
```
