# Skill: bc-setup-route-decision

## Skill name
bc-setup-route-decision

## Purpose
Select the most robust Business Central implementation route for larger setup, migration or master-data work, so the agent acts like a consultant instead of repeating manual UI clicks by default.

## Use when
- Chart of accounts, posting groups, VAT setup, dimensions, number series, templates or master data will be created, changed, replaced or cleaned up.
- A repeated Playwright/UI blocker suggests that manual cell editing may be the wrong route.
- The book needs to explain why a route was chosen for Universaarl.
- A setup decision affects downstream posting, reporting, cleanup or auditability.

## Do not use when
- The task is a narrow read-only observation, screenshot QA or file formatting change.
- The active case explicitly requires a small manual UI proof and no broader setup route is being selected.
- Business Central product knowledge is missing; use `bc-source-research` first.
- The step is frozen, forbidden or not connected to a real Universaarl business need.

## Inputs
- Business setup question.
- Universaarl company context and business need.
- Affected pages, tables, records and fields if known.
- Local Universaarl evidence or blocker summary.
- Microsoft Learn or other official source summary.
- Dependency, validation, cleanup and rollback risks.
- Book section or process that will use the result.

## Output JSON schema
```json
{
  "businessSetupQuestion": "",
  "caseStudyArchitecture": {
    "businessNeed": "",
    "bcConcept": "",
    "dependencyBefore": [],
    "downstreamProcesses": [],
    "recommendedImplementationRoute": "",
    "sourceOrEvidenceBasis": [],
    "bookExplanation": "",
    "playwrightProofNeeded": ""
  },
  "setupRouteAssessment": {
    "manualUi": "prefer|reject|investigate|not-applicable",
    "assistedSetup": "prefer|reject|investigate|not-applicable",
    "configurationPackageOrRapidStart": "prefer|reject|investigate|not-applicable",
    "excelImport": "prefer|reject|investigate|not-applicable",
    "template": "prefer|reject|investigate|not-applicable",
    "api": "prefer|reject|investigate|not-applicable",
    "alExtension": "prefer|reject|investigate|not-applicable",
    "parkOrNoChange": "prefer|reject|investigate|not-applicable",
    "reason": ""
  },
  "selectedRoute": "",
  "rejectedRoutes": [],
  "evidencePlan": [],
  "bookBoundary": "",
  "stopConditions": [],
  "nextSafeAction": ""
}
```

## Rules
- Start from the Universaarl business need, not from the next queue item.
- Compare manual UI entry, assisted setup, configuration packages/RapidStart, Excel import/export, templates, APIs, AL extension and parking/no-change.
- Prefer manual UI when the book must teach the page, fields and validation behavior and only a few values are changed.
- Prefer configuration packages, Excel import/export or templates when the task is bulk setup, repeatable migration or mass master-data preparation.
- Prefer Assisted Setup only when the wizard effect, generated defaults and finish action are understood.
- Prefer APIs or AL extension only when the case explicitly requires that project route and auth/publish/write boundaries are approved.
- Keep at least one UI validation or screenshot route for book learning even if the implementation route is package, import, template, API or AL based.
- Use Microsoft Learn or official documentation for product/setup best-practice claims.
- Use local Universaarl evidence for actual UI state, available actions and validation behavior.
- Document fields changed, fields intentionally untouched, dependency checks and reopen proof before any effective action.

## Stop if
- The route would create setup, master data, documents, postings, cleanup or company changes while the Improvement Freeze is active.
- The action is not connected to a realistic Universaarl business need.
- The required source or local evidence is missing for the claim level.
- Deleting, replacing or bulk importing data could affect referenced records and no dependency/rollback plan exists.
- The only reason for the action is that the queue says so.

## Safety gates
- Case Study Architecture Gate
- Setup Route Decision
- Smart Decision Gate
- Source Claim Rules
- Screenshot Truth Gate
- Reopen Proof Gate

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
260

## Max output tokens
1200

## Tool preferred
yes, local evidence readers plus Microsoft Learn/source lookup when product behavior or best practice is not already proven

## Updates state
yes, update the case decision card, evidence README, source registry, open questions or state plan when the route decision changes the next action
