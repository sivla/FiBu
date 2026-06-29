# Book Writing Meta-Language Audit

Status: `prep-progress`
Active book world: Universaarl GmbH / `UNIVERSAARL-DE`
Scope: book-facing master and book drafts

## Rule

Book-facing prose must read like a training book. It should explain what the user sees, which page is opened, which field or action matters, why the step matters, what happens after saving or posting, which entries arise and how success is checked.

Internal words such as case, evidence, agent, result JSON, proof pack or repository workflow belong in evidence, atlas, coverage and state files.

## PREP-007 Changes

PREP-007 replaced high-visibility bookmaster openings that used the pattern "Dieses Kapitel zeigt..." with direct reader-facing explanations.

Changed areas:

| Area | Old pattern | New direction |
| --- | --- | --- |
| Chapter 2 | "Dieses Kapitel zeigt dir..." | Direct learner-path orientation. |
| Chapter 13 Inventory/Warehouse | Meta chapter sentence | Direct explanation of simple inventory vs warehouse flow and entries. |
| Chapter 14 Planning/Manufacturing | RM-specific chapter meta | Direct explanation of demand, BOM, routing, consumption, output and cost. |
| Chapter 15 Service | RM-specific chapter meta | Direct explanation of service case, parts, time, decision and posting trail. |
| Chapter 16 Projects | RM-specific chapter meta | Direct explanation of tasks, resources, material, costs and billing. |
| Chapter 17 Dropshipping | Meta chapter sentence | Direct Business Central standard flow; Shopify remains excluded. |
| Chapter 18 Intercompany | Meta chapter sentence | Direct IC/outland process explanation. |
| Chapter 19 Open items | Meta chapter sentence | Direct open-item/application explanation. |
| Chapter 20 Bank/Payments | Meta chapter sentence | Direct bank statement, payment, open item and reconciliation explanation. |
| Chapter 21 Fixed Assets | Meta/lab phrasing | Direct asset lifecycle and Universaarl rebuild wording. |
| Chapter 22 VAT/E-Documents | Meta chapter sentence | Direct VAT matrix, invoice, VAT entries and correction wording. |
| Chapter 25 Reporting | Meta chapter sentence | Direct reporting and traceability wording. |
| Chapter 29 Integrations | Meta chapter sentence | Direct decision logic for standard, AppSource, Power Platform, API and customization. |

## Remaining Known Patterns

These are not all wrong, but they need later targeted review:

| Pattern | Current risk | Next handling |
| --- | --- | --- |
| "beweist" in old lab sections | Often internal evidence language in reader-facing text. | Replace gradually with "zeigt", "ist sichtbar", "laesst sich pruefen" or move boundary notes to evidence files. |
| "Evidence Pack" | Internal artifact wording in some process chapters. | Use "Nachweispaket" or explain the concrete controls: Beleg, Posten, Bericht, Screenshot. |
| RM/Rhein-Main examples | Still active in later chapters. | PREP-009 and evidence-driven Universaarl rebuild. |
| Laborstatus paragraphs | Useful boundary, but sometimes too repo-like. | Keep only reader-relevant boundary; move case IDs and file paths to evidence. |
| Screenshot references | Some describe filenames instead of what the reader sees. | PREP-011 screenshot explanation quality gate. |

## Writing Checklist

Before a book-facing patch is accepted, the section must answer at least one of these questions in reader language:

- What page does the user open?
- Which field or button matters?
- Which action changes data?
- Which action is read-only?
- What happens after saving?
- What happens after posting?
- Which entries or reports confirm the result?
- What common error can happen?
- How is the error corrected?

## Next Step Decision Card

```json
{
  "currentCase": "PREP-007-BOOK-WRITING-RULES-META-LANGUAGE-AUDIT",
  "plannedNextCaseBeforeReview": "PREP-007-BOOK-WRITING-RULES-META-LANGUAGE-AUDIT",
  "lastEvidenceSummary": "PREP-006 moved the chapter 3 opening to Universaarl and added a rewrite plan.",
  "isPlannedNextCaseStillSensible": true,
  "reason": "Book-facing style needed immediate cleanup after the chapter 3 rewrite and before more Universaarl prose is added.",
  "lookaheadReviewed": [
    {
      "caseId": "PREP-008-SOURCE-REGISTRY-AND-CLAIM-RULES-GAP-AUDIT",
      "status": "ready-next",
      "reason": "After style cleanup, source and claim rules should be checked before adding stronger product or best-practice claims."
    },
    {
      "caseId": "PREP-009-RM-DECOMMISSION-INVENTORY-REFINEMENT",
      "status": "ready-after-current",
      "reason": "Remaining RM/Rhein-Main references are now easier to classify after the style audit."
    },
    {
      "caseId": "PREP-010-PLAYWRIGHT-READONLY-HELPERS-AND-UI-ERGONOMICS",
      "status": "ready-after-current",
      "reason": "Tooltip, split-button and screenshot-QA rules should become reusable helpers."
    },
    {
      "caseId": "PREP-011-SCREENSHOT-EXPLANATION-QUALITY-GATE",
      "status": "ready-after-current",
      "reason": "Remaining screenshot prose needs page/company/step/visible-proof/not-proof clarity."
    },
    {
      "caseId": "TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE",
      "status": "blocked",
      "reason": "Company creation remains parked until SUPER/company-create permissions are confirmed."
    }
  ],
  "queueChangesMade": [],
  "selectedNextCase": "PREP-008-SOURCE-REGISTRY-AND-CLAIM-RULES-GAP-AUDIT",
  "whySelectedNextCaseIsBest": "Cleaner prose reduces book noise; the next risk is unsupported product or best-practice claims.",
  "risksBeforeNextCase": [
    "Do not treat Microsoft Learn as proof of the current UI state.",
    "Do not add final German claims before Universaarl evidence exists.",
    "Do not pull community sources into final claim rules."
  ],
  "requiredPreparation": [
    "Read BC-SOURCE-REGISTRY.md, BC-SOURCE-CLAIM-RULES.md and BC-MICROSOFT-LEARN-MAPPING.md.",
    "Keep source claims separate from UI evidence claims."
  ]
}
```
