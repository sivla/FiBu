# Skill: legacy-reference-finder

## Skill name
legacy-reference-finder

## Purpose
Find and classify legacy RM-DEMO, MCP_1_20260210, CRONUS, Rhein-Main and RM-* references without damaging historical evidence.

## Use when
- A file or package script might steer active work back to the old lab world.
- A Playwright test should be ported, blocked or archived.
- Book, dashboard, state or training text is being made Universaarl-first.

## Do not use when
- The target is historical evidence that must remain immutable.
- A mass replacement would obscure traceability.
- The reference is explicitly marked as historical or legacy archive and is not an active next step.

## Inputs
- search scope
- active truth files
- legacy terms
- current decommission plan
- package script or target file inventory if relevant

## Output JSON schema
```json
{
  "skill": "legacy-reference-finder",
  "scope": "string",
  "activeLegacyRoutes": [],
  "warningInventory": [],
  "archiveOnly": [],
  "recommendedAction": "port|block|archive|keep-historical|no-change"
}
```

## Rules
- Active scripts and steering files are stricter than evidence archives.
- Do not delete, rename or rewrite screenshots, result JSONs or old evidence without supersession approval.
- Direct active package routes to old worlds are errors; legacy terms in old target specs are migration warnings until ported.

## Stop if
- A replacement would change evidence meaning.
- A file is both active steering truth and historical archive without clear owner.
- The scan finds secrets or auth material.

## Safety gates
- no-active-legacy-target
- no-blind-evidence-rewrite
- legacy-warning-versus-error
- no-secrets

## Preferred taskClass
monkey_work

## Default model class
gpt-4-mini-low

## Max context lines
120

## Max output tokens
700

## Tool preferred
yes: `rg`, `agent:legacy:active-check`, JSON validation.

## Updates state
yes: decommission plan, dashboard or current state when active route risk changes.
