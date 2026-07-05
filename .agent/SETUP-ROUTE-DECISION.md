# Setup Route Decision

Purpose: choose the most sensible Business Central setup route before a larger setup, migration or master-data action is executed.

This is a consultant decision, not a blocker by default. The agent should not assume that manual UI entry is best only because Playwright can click it. Manual UI entry is important for learning and screenshots, but larger setup work can be better served by assisted setup, configuration packages, Excel import/export, templates, APIs or AL extensions.

## Use When

- Chart of accounts, posting groups, VAT setup, dimensions, number series, templates or master data are created or changed.
- A repeated UI blocker suggests that a standard bulk/setup route may be cleaner than more cell-edit attempts.
- The book needs to explain why a project route was chosen.
- Cleanup, delete or replace is being considered.

## Route Options

| Route | Prefer When | Stop Or Park When |
| --- | --- | --- |
| Manual UI | The reader must learn the page, field and validation behavior; only a few values are changed. | The task is bulk setup, repeated cell editing is fragile, or the route would hide dependencies. |
| Assisted Setup | Microsoft provides a guided setup and its choices are understood. | Wizard effect, finish action or generated defaults are unclear. |
| Configuration Package / RapidStart | Many setup or master-data records must be imported, validated and reapplied in a controlled way. | Table/field selection, validation errors, cleanup or rollback are not understood. |
| Excel Import/Export | A package/template supports Excel and the data can be reviewed before import/apply. | Excel would bypass required validation or create unclear formatting/date/decimal risks. |
| Template | New records should inherit consistent defaults. | The template source or defaulted fields are not visible or understood. |
| API | A repeatable integration route is the actual project requirement. | The book needs UI learning, or API would bypass required UI evidence. |
| AL Extension | Setup logic belongs in repeatable customization and source control. | Build, publish, auth, tenant impact or rollback is not explicitly approved. |
| Park / No Change | The correct route is not yet known or dependencies are unresolved. | Do not use parking to avoid a well-scoped, evidence-ready action. |

## Required Decision Card Add-On

```json
{
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
  }
}
```

## Evidence Needed

Before effective action:

- source or evidence basis for the selected route
- affected tables, pages or records
- fields to change and fields to leave untouched
- dependency and side-effect check
- validation/reopen proof plan
- cleanup, rollback or keep strategy

After effective action:

- actual route used
- values changed
- validation messages
- reopen proof
- entries or setup surfaces affected
- what the book can and cannot claim

## Source Priority

Use Microsoft Learn for Business Central product/setup claims. Use local Universaarl evidence for the actual UI state. Use official legal or tax sources for compliance claims. Community sources can suggest hypotheses, but they do not authorize final book claims.
