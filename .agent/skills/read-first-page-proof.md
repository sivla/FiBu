# Skill: read-first-page-proof

## Skill name
read-first-page-proof

## Purpose
Open a Business Central page in read-only mode and capture enough context to decide whether later setup, data or book work is justified.

## Use when
- A foundation, setup or master-data page must be understood before writing.
- A route is being validated for TARGET-075 or follow-up read-first checks.
- A screenshot must support UAT, training or book planning.

## Do not use when
- A write, import, preview or posting is already explicitly approved and read-first proof is current.
- The page is known to be wrong or legacy.
- The task needs official product explanation rather than local UI proof.

## Inputs
- expected instance and company
- target page, route candidate or Page ID
- expected visible labels or Page Inspection signals
- forbidden actions for the case
- screenshot purpose

## Output JSON schema
```json
{
  "skill": "read-first-page-proof",
  "pageOpened": true,
  "pageContext": "string",
  "visibleBusinessTexts": ["string"],
  "screenshots": ["string"],
  "proved": ["string"],
  "notProved": ["string"],
  "safeForWriteGate": false
}
```

## Rules
- No setup value, master data, draft, preview, posting, payment or API shortcut.
- Screenshots must show the claimed page or be rejected.
- Hidden FastTabs, FactBoxes, filters, personalization and page inspection may be used for diagnosis without changing business data.

## Stop if
- Context proof fails.
- The page opens a wizard, dialog or edit route that would require confirmation.
- The screenshot does not show the expected page or relevant fields.
- A route would require blind search, force click or coordinate click.

## Safety gates
- read-first-before-write
- screenshot-truth
- no-effective-action
- route-evidence-before-claim

## Preferred taskClass
wizard_work

## Default model class
gpt-4-medium

## Max context lines
160

## Max output tokens
800

## Tool preferred
yes: Playwright read-only navigation, screenshot QA and result JSON.

## Executable helper/check
- Helper: `playwright/core/bc/visual-proof-skills.ts`
- Selftest: `npm run core:visual-proof-skills:selftest`
- Preflight binding: `npm run agent:visual-proof-skills:check`

## Updates state
yes: result JSON, dashboard or readiness decision when proof affects next case.
