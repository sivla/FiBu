# Skill: bc-active-editor

## Skill name
bc-active-editor

## Purpose
Diagnose whether a visible Business Central card/list/grid cell is truly editable before typing target values.

## Use when
- A BC field looks visible but Playwright cannot prove a focused editor.
- A grid row, list row or FastTab field might be display-only.
- The next action would type setup, master data, document or journal values.
- A previous run blocked on active editor detection.

## Do not use when
- The active case is read-only and no edit route is being evaluated.
- Page or company context is not confirmed yet.
- The intended value entry is forbidden by the active case.

## Inputs
- Expected page/table/card/list context.
- Target field captions and target row anchors.
- Current visible text or control snapshot.
- Allowed and forbidden actions from active case.

## Output JSON schema
```json
{
  "pageContextConfirmed": false,
  "targetFields": [],
  "editorCandidates": [],
  "trueEditorProven": false,
  "safeToType": false,
  "blockedBy": [],
  "nextRoute": ""
}
```

## Rules
- Never type target values until page, company, row and field context are confirmed.
- Treat `force: true`, coordinate clicks and unscoped `nth()` as diagnostic only unless separately justified.
- Capture before-state evidence before any edit-mode action.
- If a popup, dialog or wrong card opens, classify the route and stop.
- Do not upgrade editor proof into setup correctness; it proves only UI editability.
- If AL metadata, Page Inspection or MCP/tooling would help explain a field, use it only as diagnostic context. It does not replace UI proof that a real user-facing editor is active.
- Do not use Business Central MCP, AL publish/auth/debug tooling or API shortcuts to bypass the UI editor gate unless a separate active case explicitly unlocks that route.

## Stop if
- The page is a Role Center, search overlay or generic navigation surface.
- The row anchor is missing.
- The candidate control is disabled, readonly, background, hidden or belongs to another FastTab/card.
- Any forbidden action would be needed.

## Safety gates
- Business Central Operating Model
- UI Look and Feel Gate
- Smart Decision Gate
- Screenshot Truth Gate

## Preferred taskClass
wizard_work

## Default model class
gpt-4-medium

## Max context lines
180

## Max output tokens
1000

## Tool preferred
yes, Playwright locator/control snapshot helpers

## Updates state
yes, update result JSON, capability backlog or blocker classification when active editor proof changes the queue
