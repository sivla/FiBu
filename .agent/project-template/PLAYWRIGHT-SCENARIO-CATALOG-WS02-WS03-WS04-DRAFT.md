# Playwright Scenario Catalog - WS02/WS03/WS04 Draft

Status: draft
Purpose: Read-first Playwright scenario catalog for Universaarl case-study core, finance foundation and master-data/product prerequisites.
Last reviewed: 2026-07-05

## Boundary

This catalog plans Playwright evidence. It does not run Playwright and does not authorize Business Central writes.

All future execution must stay in:

- environment: `playthru`
- first target company: `UNIVERSAARL-DE`

Every scenario starts with company/environment proof. If the active environment or company is unclear, the scenario stops before setup, master data or navigation side effects.

## Scenario status values

- `planned`: useful scenario, not yet implemented.
- `needs-source-first`: needs official source or route decision before automation.
- `needs-ui-discovery-first`: page behavior is not stable enough yet.
- `ready-for-readonly-probe`: can be implemented as read-only Playwright proof.
- `blocked`: dependency or permission prevents safe proof.
- `superseded`: no longer needed.

## Evidence levels

- `context-proof`: environment, company, page and URL are visible.
- `read-only-observed`: page/field/action was observed without write.
- `write-proof-needed`: later gated write/reopen proof required.
- `training-candidate`: enough for training draft, not UAT accepted.
- `uat-candidate`: scenario can become a UAT script after customer review.

## Common safety rules

- No `New`, `Edit`, `Delete`, `Post`, `Preview Posting`, `Ship`, `Invoice`, `Payment`, import/apply package or wizard finish in read-first scenarios.
- No `force: true` or coordinate clicks as normal route.
- If a dialog appears and effect is unclear, stop and write blocked evidence.
- Hover/tooltips and dropdown inspection are allowed when read-only.
- Screenshots must show the page/field/action being taught.
- Raw Playwright diagnostics are internal evidence, not handbook prose.

## PWS-CORE-001 Company context proof

Workstream: `WS02-CASE-STUDY-CORE`
Training module: `TR-00-02 Environment, Company and Evidence Boundary`
Related route decision: none
Status: `ready-for-readonly-probe`

Purpose:

Prove that the browser is in `playthru` and `UNIVERSAARL-DE` before any later setup or master-data scenario.

Start state:

- Existing authenticated browser/storage state is available.
- No write action is attempted.

Steps:

1. Open the configured Business Central URL for `playthru`.
2. Verify URL/environment marker.
3. Verify visible company context or company selector context.
4. Capture page title, URL, visible company and safe page text.
5. Save screenshot QA metadata.

Evidence output:

- URL
- page title
- detected environment
- detected company
- screenshot path
- what screenshot proves
- what screenshot does not prove

Stop if:

- environment is not `playthru`
- company is not `UNIVERSAARL-DE`
- login/auth page blocks context proof
- company selector would require switching company

Book/training use:

Supports the opening training module that teaches environment/company awareness.

## PWS-CORE-002 Navigation and page-type read-only proof

Workstream: `WS02-CASE-STUDY-CORE`
Training module: `TR-01-01 Role Center and Navigation`; `TR-01-02 Lists, cards, FastTabs and FactBoxes`
Related route decision: none
Status: `ready-for-readonly-probe`

Purpose:

Capture safe examples of Role Center, list page, card page, FastTab/FactBox/action area and dropdown/tooltip behavior.

Start state:

- `PWS-CORE-001` has passed.

Steps:

1. Start from Role Center or a known safe landing page.
2. Navigate to a safe list page such as Chart of Accounts, Customers, Vendors or Items without creating data.
3. Identify page type.
4. Hover key read-only actions where useful.
5. Inspect dropdown actions without executing data-changing commands.
6. Capture screenshots that teach list/card/action context.

Evidence output:

- page type
- visible safe actions
- visible data-changing actions not clicked
- tooltip/dropdown observations
- screenshot truth notes

Stop if:

- navigation opens a create wizard
- page route is ambiguous
- action dropdown cannot be inspected safely
- company context disappears

Book/training use:

Supports navigation handbook and avoids the old mistake of blindly clicking `Neu/New`.

## PWS-FF-001 Number series read-first context

Workstream: `WS03-FINANCE-FOUNDATION`, `WS04-MASTER-DATA-PRODUCT`
Training module: future number-series module
Related route decision: `RD-FOUND-001`
Status: `planned`

Purpose:

Read visible number-series/setup context before deciding live customer/vendor/item numbering.

Start state:

- `PWS-CORE-001` has passed.
- No number-series setup change is allowed.

Steps:

1. Navigate to Number Series or relevant setup pages read-only.
2. Capture existing relevant rows if visible.
3. Identify whether customer/vendor/item numbering is controlled by setup pages or related sales/purchase/inventory setup pages.
4. Record gaps as route-decision follow-up.

Evidence output:

- page title and URL
- relevant number-series rows or absence
- screenshot QA
- route impact for `DR-MD-001`, `DR-MD-002`, `DR-MD-003`

Stop if:

- page requires edit mode
- setup context is unclear
- there is risk of overwriting existing numbering

Book/training use:

Explains number series as a control before customer/vendor/item creation.

## PWS-FF-002 Posting group pages read-first proof

Workstream: `WS03-FINANCE-FOUNDATION`
Training module: `TR-02-02 Posting Groups`
Related route decision: `RD-FOUND-002`
Status: `planned`

Purpose:

Read relevant posting group pages and identify which setup rows exist, are missing or need a later gated setup case.

Start state:

- `PWS-CORE-001` has passed.
- Required G/L account scope is known or limitations are recorded.

Pages in scope:

- Customer Posting Groups
- Vendor Posting Groups
- General Business Posting Groups
- General Product Posting Groups
- General Posting Setup
- Inventory Posting Groups only as read-first boundary if needed

Evidence output:

- visible row list or filtered result
- missing rows needed for simulated data
- linked G/L account fields if visible
- screenshot truth notes
- `notProved` list for rows not visible

Stop if:

- setup page requires edit mode
- rows cannot be read safely
- required G/L account dependency is unresolved
- VAT-sensitive row would be interpreted as tax approval

Book/training use:

Supports posting-group explanation before master-data creation.

## PWS-FF-003 Payment terms read-first proof

Workstream: `WS03-FINANCE-FOUNDATION`, `WS04-MASTER-DATA-PRODUCT`
Training module: customer/vendor master data modules
Related route decision: `RD-FOUND-003`
Status: `planned`

Purpose:

Check whether payment terms such as `14D` or `30D` exist or need a later gated setup case.

Start state:

- `PWS-CORE-001` has passed.

Evidence output:

- visible payment terms rows
- due-date formula if visible
- whether simulated customers/vendors can use the terms
- screenshot truth notes

Stop if:

- page opens in edit/create mode unexpectedly
- date formula meaning is unclear
- payment method/bank setup appears and would imply payment readiness

Book/training use:

Supports explanation of payment terms as everyday due-date logic, separate from payment execution.

## PWS-MD-001 Customer card/list read-first proof

Workstream: `WS04-MASTER-DATA-PRODUCT`
Training module: `TR-03-01 Customer master data`
Related route decision: `RD-FOUND-001`, `RD-FOUND-002`, `RD-FOUND-003`
Status: `planned`

Purpose:

Read Customer list/card structure and identify required fields, actions, templates and setup dependencies before creating any customer.

Start state:

- `PWS-CORE-001` has passed.
- No customer creation allowed.

Evidence output:

- Customers page title and URL
- visible fields on list/card if a safe existing record can be opened
- available action dropdowns/templates without executing
- data-changing actions explicitly not clicked
- dependencies for `DR-MD-001`

Stop if:

- opening a card would create or edit a record
- no safe existing record is available
- template/action inspection risks creating data

Book/training use:

Supports customer master-data training without pretending setup is complete.

## PWS-MD-002 Vendor card/list read-first proof

Workstream: `WS04-MASTER-DATA-PRODUCT`
Training module: `TR-03-02 Vendor master data`
Related route decision: `RD-FOUND-001`, `RD-FOUND-002`, `RD-FOUND-003`
Status: `planned`

Purpose:

Read Vendor list/card structure and identify required fields, payment boundaries and setup dependencies before creating any vendor.

Evidence output:

- Vendors page title and URL
- visible fields or safe existing-record context
- payment terms/method fields if visible
- warning that real bank data is out of scope
- dependencies for `DR-MD-002`

Stop if:

- page would create/edit vendor
- bank/payment fields require real data
- company context unclear

Book/training use:

Supports vendor master-data chapter and payment-boundary explanation.

## PWS-MD-003 Item/service/non-inventory read-first proof

Workstream: `WS04-MASTER-DATA-PRODUCT`, `WS07-INVENTORY-COSTING-STOCK`
Training module: `TR-03-03 Items, services and non-inventory items`
Related route decision: `RD-FOUND-004`
Status: `planned`

Purpose:

Read item card/list context, item type, UOM and posting-group fields before creating inventory/service/non-inventory examples.

Evidence output:

- Items page title and URL
- visible fields for Type, Base Unit of Measure and posting groups if safely available
- action/template observations
- dependencies for `DR-MD-003`
- clear boundary that inventory valuation is not proven

Stop if:

- item creation wizard opens
- item type/UOM fields are hidden and layout options were not checked
- inventory setup dependency is unresolved
- route would imply valuation proof

Book/training use:

Supports product model chapter and prevents treating item cards as generic line labels.

## PWS-MD-004 Configuration package/import route read-first proof

Workstream: `WS04-MASTER-DATA-PRODUCT`, `WS11-DATA-MIGRATION-INTEGRATION`
Training module: `TR-03-04 Configuration packages and imports`
Related route decision: `RD-FOUND-001`, `RD-FOUND-004`
Status: `needs-ui-discovery-first`

Purpose:

Understand where configuration packages/import validation appear in Business Central without applying or importing data.

Evidence output:

- Configuration Packages page/context if accessible
- export/import/apply actions visible but not executed
- validation/apply boundary
- route impact for future customer/vendor/item bulk setup

Stop if:

- page requires permissions not available
- import/apply dialog appears
- action could apply data

Book/training use:

Supports route-comparison chapter: manual learning record vs scalable data load.

## Catalog next steps

1. Turn `PWS-CORE-001` and `PWS-CORE-002` into read-only Playwright specs first.
2. Use those specs to harden company-context, page-type, dropdown and screenshot-QA helpers.
3. Only then implement read-first setup dependency scenarios.
4. Do not run write/setup scenarios until the active case explicitly unlocks them.
