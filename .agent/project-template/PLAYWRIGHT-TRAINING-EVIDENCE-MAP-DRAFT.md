# Playwright Training Evidence Map Draft

Status: draft
Purpose: Map training modules to Playwright, sandbox evidence, UAT and handbook readiness.
Last reviewed: 2026-07-06

## Principle

Training material should be useful and believable. If a module teaches concrete Business Central behavior, the project should know what proves it.

Playwright evidence can support training when it shows:

- correct environment and company
- visible page and object context
- relevant field values or documents
- expected result or error
- repeatable route
- screenshot truth
- cleanup/keep status

Technical probes are not training material until translated into customer-facing steps.

## Evidence levels

- `source-only`: official source explains concept; no Universaarl proof yet.
- `sandbox-observed`: seen in `playthru` / `UNIVERSAARL-DE`.
- `playwright-repeatable`: repeatable Playwright route exists.
- `uat-accepted`: key user accepted scenario.
- `training-ready`: source/evidence plus handout/exercise/check exist.
- `technical-only`: useful for agents, not customer training.
- `blocked`: missing data, setup, source or safe route.

## Evidence map

| Training module | BC behavior taught | Required evidence | Current evidence level | Next evidence action |
| --- | --- | --- | --- | --- |
| TR-00-02 Environment, company and evidence boundary | User identifies environment/company/page before work | Read-only context proof | source-only | Create/reuse company-context Playwright scenario |
| TR-01-01 Role Center and navigation | User navigates safely | UI read-only proof and screenshots | source-only | Create UI navigation proof with screenshot truth |
| TR-01-02 Lists, cards, FastTabs and FactBoxes | User recognizes page types | Screenshot set with labels | source-only | Capture/curate Universaarl examples |
| TR-02-01 Chart of accounts | User reviews account list/card | TARGET-075 read-first reopen proof plus `FOUNDATION-READINESS-DECISION.md` boundary | sandbox-observed candidate | Run TARGET-075 after freeze/live-gate lift, then classify result before trainer-ready promotion |
| TR-02-02 Posting groups | User explains account determination | Setup rows plus source explanation | training-draft-with-universaarl-examples | Use `U-CUST-100`, `U-ITEM-HW100` and partial `INLAND/WAREN/4400` only as training examples; keep O2C/P2P blocked until missing setup rows are proven |
| TR-02-03 VAT/USt Boundary | User understands BC VAT setup vs tax finality | Microsoft source, Universaarl setup-row proof, tax boundary review | training-draft-with-universaarl-examples | Use observed `VAT19` on `U-ITEM-HW100` only to teach the setup chain; build read-first VAT setup proof before any process preview/posting |
| TR-02-04 Dimensions | User understands reporting dimensions and setup ownership | Organization model, dimension setup proof, later defaulting and entry/report proof | blocked-by-organization-model-and-read-first-proof | Build read-first Dimensions/Dimension Values proof after freeze/resume gate; keep reporting claims blocked until posted-entry evidence exists |
| TR-02-05 Journals, preview and posting | User understands journal route and posting effect | Preview/posting scenario with G/L entries | blocked | Needs explicit unlock and evidence plan |
| TR-03-01 Customer master data | User reviews customer required fields and setup dependencies | Customer card/list proof plus data-package dependency review | blocked | Build `PWS-MD-001` only after `FOUNDATION-READINESS-DECISION.md`; keep BC creation blocked until numbering, posting, VAT and payment terms decisions |
| TR-03-02 Vendor master data | User reviews vendor required fields, payment boundary and setup dependencies | Vendor card/list proof plus no-real-bank-data boundary | blocked | Build `PWS-MD-002` only after `FOUNDATION-READINESS-DECISION.md`; keep BC creation blocked until numbering, posting, VAT, payment terms and payment method decisions |
| TR-03-03 Items, services and non-inventory items | User classifies item types and setup blockers | Item card/list proof, source support and product-model route decision | blocked | Build `PWS-MD-003` only after `FOUNDATION-READINESS-DECISION.md`; keep BC creation blocked until UOM, product model, posting, VAT, inventory posting and costing decisions |
| TR-03-04 Configuration packages and imports | User understands scalable data route | Package/import artifact plus UI validation | blocked | Needs route decision before sample import |
| TR-04-01 Purchase order to invoice | User follows purchasing process | Playwright process scenario and UAT | planned | Build after finance/master-data prerequisites |
| TR-05-01 Sales quote/order/invoice | User follows sales process | Playwright process scenario and UAT | planned | Build after finance/master-data prerequisites |
| TR-06-01 Inventory quantity and value | User traces item/value entries | Item ledger/value entry proof | planned | Build after item/inventory setup proof |
| TR-06-03 Warehouse daily process | User executes selected warehouse route | Warehouse scope proof and UAT | blocked | Decide warehouse scope first |
| TR-07-01 Management reporting and dimensions | User filters/analyzes reports | Report/filter proof with meaningful data | planned | Needs posted/process data |
| TR-07-02 Permissions and role centers | Admin maps roles and access | Role/permission proof | planned | Needs security workstream |
| TR-08-01 UAT execution | Key user executes UAT script | UAT result and defect/retest trace | draft | Create UAT catalog and scenario scripts |

## Training evidence card

Use this card when promoting training from draft to evidence-ready:

```text
Training module:
Workstream:
Audience:
BC behavior taught:
Official source:
Universaarl evidence:
Playwright scenario:
UAT scenario:
Screenshot(s):
Known limitations:
Training status:
Book/handbook output:
Follow-up:
```

## Screenshot rule for training

A training screenshot must show the element being taught. It should include:

- page title or recognizable page context
- relevant record/field/action
- company/environment where relevant
- caption or surrounding text that makes it understandable
- note if values are fictional/sandbox data

Do not use screenshots that only prove "a script ran" or show a technical diagnostic unless the module is for project/agent team only.

## UAT connection

UAT and Playwright are related but distinct:

- Playwright proves repeatable system behavior.
- UAT proves customer acceptance and process understanding.
- Training uses both: Playwright for reliable demonstration, UAT for user practice and acceptance.

## Next refinement

Create concrete evidence cards for:

- TR-00-02 environment/company context
- TR-01-01 navigation
- TR-02-01 chart of accounts
- TR-02-02 posting groups
- TR-02-03 VAT/USt boundary
- TR-02-04 dimensions
- TR-03-01 customer master data
- TR-03-02 vendor master data
- TR-03-03 items, services and non-inventory items
