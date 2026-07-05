# Skill: bc-navigation

## Skill name
bc-navigation

## Purpose
Open and verify Business Central pages through the UI without ambiguous navigation or wrong-company actions.

## Use when
- A test must navigate to a BC page.
- Tell Me, bookmarks, page links or company context are involved.
- A screenshot or setup action depends on being on the correct page.

## Do not use when
- The task is pure local file validation.
- The active case forbids BC execution.
- The target instance or company is unclear.

## Inputs
- instance
- company
- target page or known URL
- expected page text or Page Inspection proof
- allowed and forbidden actions

## Output JSON schema
```json
{
  "skill": "bc-navigation",
  "instanceConfirmed": true,
  "companyConfirmed": true,
  "pageContext": "string",
  "navigationMethod": "string",
  "safeForNextAction": true,
  "stopReason": null
}
```

## Rules
- Stay inside `playthru` for active Universaarl work.
- Treat `MCP_1_20260210`, RM-DEMO, CRONUS and Rhein-Main routes as legacy pattern sources only.
- Confirm company before changing data.
- Prefer proven page links or scoped Tell Me results over first-hit Enter.
- Use wide layout when line tables, columns or screenshot proof matter.
- Hide FactBox if it blocks the business proof.
- Use Personalize and Page Inspection as documented diagnostics.

## Stop if
- The instance is not `playthru`.
- The visible company is not the intended company.
- Tell Me results are ambiguous.
- The page does not show the expected business context.

## Safety gates
- stay-in-instance
- confirm-company-before-data-change
- avoid-blind-tell-me-enter
- page-context-before-action

## Preferred taskClass
wizard_work

## Default model class
gpt-4-medium

## Max context lines
120

## Max output tokens
800

## Tool preferred
yes: Playwright UI locators and local helper diagnostics.

## Updates state
no, unless a new navigation pattern or rejected path must be recorded.
