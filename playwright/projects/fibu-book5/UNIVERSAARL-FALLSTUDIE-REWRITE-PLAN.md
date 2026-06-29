# Universaarl Fallstudie Rewrite Plan

Status: `prep-progress`
Target world: `playthru` / `UNIVERSAARL-DE` / Universaarl GmbH
Legacy status: Rhein-Main, RM-DEMO, RM-* and CRONUS remain `legacy-labor-reference`.

## Purpose

This file controls the gradual rewrite of the book-facing case study from the old Rhein-Main/RM-DEMO laboratory world to the Universaarl target world. It is an internal planning artifact. Book-facing prose must stay reader-friendly and must not contain agent, evidence or repository meta-language.

## Current Bookmaster Delta

PREP-006 updated the beginning of chapter 3 in `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md`:

- Chapter 3 heading now uses Universaarl as the case study.
- The opening paragraphs explain Company, Environment and why `UNIVERSAARL-DE` is created as its own company.
- The old multi-company Rhein-Main structure was replaced in the chapter-3 opening with a Universaarl-first structure.
- Warehouse and process examples were rewritten as target-neutral Universaarl examples.
- The section now avoids claiming that `UNIVERSAARL-DE` already exists.

## Replacement Rules

| Rule | Meaning |
| --- | --- |
| Active target world | Use Universaarl GmbH, `playthru`, `UNIVERSAARL-DE`. |
| Legacy references | Keep old RM/Rhein-Main/CRONUS evidence intact, but do not present it as active book truth. |
| Book prose | Write direct beginner text: what the user sees, clicks, fills, checks and learns. |
| Internal prose | Evidence IDs, case IDs, blocker terms and status logic belong here, in evidence, atlas, state and coverage files. |
| No false final claims | Do not say that German VAT, German chart of accounts, setup, postings or final screenshots are proven until Universaarl evidence proves them. |

## Chapter 3 Target Structure

| Section | Book-facing goal | Required evidence or source | Status |
| --- | --- | --- | --- |
| Universaarl as case study | Explain why a single coherent company is needed before setup and postings. | Current target policy plus TARGET-001/Company Creation evidence context. | started |
| Environment vs Company | Explain the difference in plain language. | Microsoft Learn mapping plus Companies page evidence. | draft-ready |
| Page `Mandanten` | Explain list, `Neu`, dropdown arrow, `Neues Unternehmen erstellen`, `Kopieren`, `Testunternehmen`. | TARGET-001, TARGET-002, TARGET-007, TARGET-008, TARGET-009. | draft-ready, permission-blocked for final creation |
| No CRONUS copy | Explain why demo data is not the final Universaarl base. | Source claim rules and current Company Creation draft. | draft-ready |
| Company creation result | Show `UNIVERSAARL-DE` in the list after creation. | Pending SUPER/company-create permission. | blocked |
| Company Information | Explain legal name, address, country/region, VAT registration and why these fields matter. | Requires `UNIVERSAARL-DE`. | planned |
| Next foundation steps | Explain setup, number series, posting groups, VAT, dimensions and first master data. | Full Playthrough Catalog. | planned |

## Legacy Rewrite Backlog

| Area in bookmaster | Current issue | Rewrite direction | Priority |
| --- | --- | --- | --- |
| TOC and learner paths | Some lines still mention Rhein-Main as active case. | Replace with Universaarl when touching the surrounding section. | P1 |
| Chapter 4 examples | ERP intro still uses Rhein-Main/RM examples. | Convert first examples to Universaarl after chapter 3 stabilizes. | P1 |
| Foundation chapter | Old CRONUS-to-RM-DEMO copy route remains as active tutorial text. | Move to historical lab note or replace with Universaarl Company Creation path after permissions. | P0 after company creation |
| Dimensions, O2C, P2P, Inventory, FA | Many process examples still use RM/Rhein-Main data. | Replace only after matching Universaarl evidence exists. | evidence-driven |
| Screenshot references | Some screenshots are legacy lab screenshots. | Mark as legacy until Universaarl screenshots replace them. | ongoing |

## Acceptance Criteria For Later Book Patches

- A beginner can read the section and identify the page, action, field and expected result.
- The text does not say "Evidence shows", "the case proves", "the agent", or similar internal wording.
- If something is not yet proven, it is phrased as a normal next step or kept in internal files.
- Old RM/Rhein-Main names do not appear as the active target world.
- No old screenshot is presented as a final Universaarl screenshot.

## Next Step Decision Card

```json
{
  "currentCase": "PREP-006-BOOKMASTER-UNIVERSAARL-FALLSTUDIE-REWRITE-PLAN",
  "plannedNextCaseBeforeReview": "PREP-007-BOOK-WRITING-RULES-META-LANGUAGE-AUDIT",
  "lastEvidenceSummary": "PREP-005 completed object coverage catalog gap fill; company creation remains parked until SUPER/company-create permissions are available.",
  "isPlannedNextCaseStillSensible": true,
  "reason": "Chapter 3 now has a Universaarl opening, so the next highest-value book task is to audit remaining book-facing meta-language and keep beginner prose clean.",
  "lookaheadReviewed": [
    {
      "caseId": "PREP-007-BOOK-WRITING-RULES-META-LANGUAGE-AUDIT",
      "status": "ready-next",
      "reason": "Book-facing text must stay reader prose after the chapter-3 rewrite."
    },
    {
      "caseId": "PREP-008-SOURCE-REGISTRY-AND-CLAIM-RULES-GAP-AUDIT",
      "status": "ready-after-current",
      "reason": "Source discipline is needed before more product or best-practice claims enter the book."
    },
    {
      "caseId": "PREP-009-RM-DECOMMISSION-INVENTORY-REFINEMENT",
      "status": "ready-after-current",
      "reason": "The chapter-3 rewrite makes the next RM-decommission refinement easier and more targeted."
    },
    {
      "caseId": "PREP-010-PLAYWRIGHT-READONLY-HELPERS-AND-UI-ERGONOMICS",
      "status": "ready-after-current",
      "reason": "Tooltip, split-button and screenshot-QA learnings should become helper rules after the book audit."
    },
    {
      "caseId": "TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE",
      "status": "blocked",
      "reason": "Company creation remains parked until SUPER/company-create permissions are confirmed."
    }
  ],
  "queueChangesMade": [],
  "selectedNextCase": "PREP-007-BOOK-WRITING-RULES-META-LANGUAGE-AUDIT",
  "whySelectedNextCaseIsBest": "It directly improves book quality while effective BC actions are permission-blocked.",
  "risksBeforeNextCase": [
    "Do not mass-replace legacy evidence.",
    "Do not remove historical RM/Rhein-Main references from evidence files.",
    "Do not write final Universaarl claims before matching evidence exists."
  ],
  "requiredPreparation": [
    "Scan only book-facing files and drafts first.",
    "Separate internal evidence language from reader-facing prose."
  ]
}
```
