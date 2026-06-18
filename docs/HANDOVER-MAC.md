# Mac Handover

This branch is prepared so another Codex agent can continue on macOS without Windows-specific assumptions.

## Clone and install

```bash
git checkout codex/token-efficient-autopilot-state
npm install
npx playwright install
cp .env.example .env
npm run auth:bc
```

## Path rules

- Treat repo-relative paths as the source of truth.
- Do not write absolute Windows paths into committed state or evidence.
- Use Node path helpers in scripts when adding cross-platform code.
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
FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS
```

Important limit:

```text
No FA-CNC-01 entry, no K30000 entry in Purchase Invoice, no Preview Posting, no Post.
```
