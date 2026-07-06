# Skill: bc-active-editor

## Skill name
bc-active-editor

## Purpose
Diagnose whether a visible Business Central card/list/grid cell is truly editable before typing target values.

This skill now starts one level earlier: first prove the correct Business Central surface, then prove the target row/field, then prove the active editor. A visible word in the DOM, Role Center text, a Tell-Me/Search overlay or stale iframe text is not enough.

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
- Screenshot QA of the visible user surface.
- Active frame/surface proof, including whether the page is still Role Center, a search overlay, a modal, Page Inspection or the actual target page.
- Any previous blocked probes that must not be repeated as-is.

## Output JSON schema
```json
{
  "pageContextConfirmed": false,
  "surfaceProof": {
    "visibleTargetPage": false,
    "rejectedSurface": "",
    "screenshotShowsTarget": false,
    "searchOverlayOpen": false,
    "roleCenterStillVisible": false,
    "pageInspectionUsed": false
  },
  "layoutActionsTried": [],
  "targetFields": [],
  "targetRowAnchorConfirmed": false,
  "editorCandidates": [],
  "activeElementProof": {
    "activeElementTag": "",
    "activeElementRole": "",
    "activeElementText": "",
    "activeElementOverlapsTargetCell": false
  },
  "trueEditorProven": false,
  "safeToType": false,
  "blockedBy": [],
  "nextMaterialHypothesis": "",
  "nextRoute": ""
}
```

## Rules
- Never type target values until page, company, row and field context are confirmed.
- The proof order is fixed: `company/context -> target page/surface -> target row -> target field/column -> active editor -> value typing`.
- Reject Role Center, Tell-Me/Search overlay, help overlay, broad shell text and stale iframe text as target-page proof, even if the expected words appear in text extraction.
- A screenshot must show the same target surface that the result claims. If the screenshot does not show the page/row/field, mark the route `rejected-path` or `blocked`.
- Treat `force: true`, coordinate clicks and unscoped `nth()` as diagnostic only unless separately justified.
- Capture before-state evidence before any edit-mode action.
- Before declaring a list/grid blocked, try the relevant Business Central layout moves: close irrelevant teaching tips, expand/maximize the card or list, hide or use FactBox deliberately, use focus mode where available, and scroll the correct horizontal/vertical region.
- Hover/tooltip evidence can explain a button or field, but it is not persistence or editor proof.
- An active editor is proven only when the focused control is enabled, not readonly, belongs to the foreground target surface, and its bounding box or accessibility context overlaps the intended row and field/column.
- Header cells, row headers, command menus, page titles, read-only buttons and background card/list controls are not editors.
- If a popup, dialog or wrong card opens, classify the route and stop.
- Do not upgrade editor proof into setup correctness; it proves only UI editability.
- If AL metadata, Page Inspection or MCP/tooling would help explain a field, use it only as diagnostic context. It does not replace UI proof that a real user-facing editor is active.
- Do not use Business Central MCP, AL publish/auth/debug tooling or API shortcuts to bypass the UI editor gate unless a separate active case explicitly unlocks that route.
- Do not repeat a blocked probe such as single click, double click, Enter or F2 unless the route first adds a material change such as Page Inspection field mapping, focus/maximize, row-menu/detail route, column-bound geometry, or a different standard Business Central surface.

## Stop if
- The page is a Role Center, search overlay or generic navigation surface.
- The row anchor is missing.
- The candidate control is disabled, readonly, background, hidden or belongs to another FastTab/card.
- The screenshot contradicts the textual claim.
- The route only repeats a previously blocked click/key pattern without a new material hypothesis.
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
