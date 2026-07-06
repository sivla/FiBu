# Playwright Scenario Catalog - WS02/WS03/WS04 Draft

Status: draft
Purpose: Read-first Playwright scenario catalog for Universaarl case-study core, finance foundation and master-data/product prerequisites.
Last reviewed: 2026-07-06

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
- `ready-after-foundation-decision`: implement as read-first proof only after `FOUNDATION-READINESS-DECISION.md` accepts the dependency boundary.
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

## PWS-FF-004 VAT/USt setup boundary read-first proof

Workstream: `WS03-FINANCE-FOUNDATION`
Training module: `TR-02-03 VAT/USt Boundary`
Related route decision: `RD-FOUND-002`
Status: `ready-after-foundation-decision`

Purpose:

Read VAT/USt setup context after TARGET-075 without treating visible rows as German tax finality or setup approval.

Start state:

- `PWS-CORE-001` has passed.
- `FOUNDATION-READINESS-DECISION.md` exists from TARGET-075 and does not block VAT/USt read-first follow-up.
- No VAT group, VAT Posting Setup, tax account, Preview Posting or Posting change is allowed.

Pages in scope:

- VAT Business Posting Groups / MwSt.-Geschäftsbuchungsgruppen
- VAT Product Posting Groups / MwSt.-Produktbuchungsgruppen
- VAT Posting Setup / MwSt.-Buchungsmatrix Einrichtung

Evidence output:

- page title and URL for each safely reached page
- visible row list or filtered result
- whether candidate rows such as domestic business/product groups are visible, missing, unclear or unsafe to verify
- screenshot truth notes for row context, field names and page identity
- `notProved` list for tax correctness, VAT entries, G/L entries and compliance

Stop if:

- page route falls back to Role Center, search overlay or ambiguous navigation text
- a page opens in edit/new mode
- a dialog asks for confirmation
- route would repeat the parked Page 472 active-editor write probe
- screenshot cannot prove page, row or company context

Book/training use:

Supports the VAT/USt boundary module. The handbook may explain what BC VAT setup pages do, but must not claim final German tax correctness from read-first evidence.

## PWS-FF-005 Dimensions and dimension values read-first proof

Workstream: `WS03-FINANCE-FOUNDATION`, `WS04-MASTER-DATA-PRODUCT`
Training module: `TR-02-04 Dimensions`
Related route decision: `RD-FOUND-002`
Status: `ready-after-foundation-decision`

Purpose:

Read Dimensions and Dimension Values context before using dimensions in master data, reporting, UAT or process evidence.

Start state:

- `PWS-CORE-001` has passed.
- `FOUNDATION-READINESS-DECISION.md` exists from TARGET-075 and does not block dimensions read-first follow-up.
- Organization-model decisions are still planning inputs, not setup approval.
- No dimension, dimension value, default dimension or General Ledger Setup change is allowed.

Pages in scope:

- Dimensions
- Dimension Values for safely visible candidate dimensions
- General Ledger Setup only as read-only context if reached safely

Evidence output:

- page title and URL
- visible dimension codes, names and blocked/limited-use markers if shown
- dimension value list context when safely reachable
- whether global/shortcut dimension context is visible, hidden, parked or unsafe to verify
- screenshot truth notes and `notProved` boundaries for reporting, posted entries and defaulting behavior

Stop if:

- route requires New/Edit/Delete or value creation
- FastTabs, FactBox, layout or overflow were not checked before calling a field absent
- page context is ambiguous
- user would need to switch company
- result would be used to claim posted-entry or reporting proof

Book/training use:

Supports the Dimensions training module and keeps reporting claims parked until later posted-entry evidence exists.

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
Status: `ready-after-foundation-decision`

Purpose:

Read Customer list/card structure and identify required fields, actions, templates and setup dependencies before creating any customer.

Start state:

- `PWS-CORE-001` has passed.
- `FOUNDATION-READINESS-DECISION.md` exists from TARGET-075 and does not block customer read-first work.
- `DR-MD-CUST-001` remains simulated/Jira-ready, not BC-setup-ready.
- No customer creation allowed.

Inputs:

- simulated package `UNIVERSAARL_MD_Customers`
- data request `DR-MD-CUST-001`
- route cards `RD-FOUND-001`, `RD-FOUND-002`, `RD-FOUND-003`
- training card `TR-03-01 Customer Master Data`

Foundation decision handoff:

| Foundation result after TARGET-075 | PWS-MD-001 decision |
| --- | --- |
| Company context, Chart of Accounts and customer/posting/payment dependency pages are visible enough for read-first explanation | Run PWS-MD-001 as read-first/no-write probe. |
| Company context is proven, but posting groups or payment terms are missing/unclear | Run only list/card/template visibility; mark setup dependencies as blocking any customer creation. |
| Company context is unclear or `FOUNDATION-READINESS-DECISION.md` is missing | Block PWS-MD-001. Do not open customer pages as the next live case. |
| Foundation decision says setup is not ready for master-data read-first probes | Block PWS-MD-001 and create a narrow Foundation follow-up instead. |

Evidence output:

- Customers page title and URL
- visible fields on list/card if a safe existing record can be opened
- available action dropdowns/templates without executing
- data-changing actions explicitly not clicked
- dependencies for `DR-MD-001`
- whether Number Series, Customer Posting Group, General Business Posting Group, VAT Business Posting Group and Payment Terms are visible, hidden, absent or blocked
- next-step classification: `ready-for-customer-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `blocked`

Stop if:

- `FOUNDATION-READINESS-DECISION.md` is missing or says Foundation is not ready for master-data read-first probes
- opening a card would create or edit a record
- no safe existing record is available
- template/action inspection risks creating data
- the page suggests a default template/write flow before field context is understood

Book/training use:

Supports customer master-data training without pretending setup is complete. The handbook output should explain which customer-card fields control later documents and postings, but it must not claim that any simulated customer has been created in Business Central.

## PWS-MD-002 Vendor card/list read-first proof

Workstream: `WS04-MASTER-DATA-PRODUCT`
Training module: `TR-03-02 Vendor master data`
Related route decision: `RD-FOUND-001`, `RD-FOUND-002`, `RD-FOUND-003`
Status: `ready-after-foundation-decision`

Purpose:

Read Vendor list/card structure and identify required fields, payment boundaries and setup dependencies before creating any vendor.

Start state:

- `PWS-CORE-001` has passed.
- `FOUNDATION-READINESS-DECISION.md` exists from TARGET-075 and does not block vendor read-first work.
- `DR-MD-VEND-001` remains simulated/Jira-ready, not BC-setup-ready.
- No vendor creation allowed.

Inputs:

- simulated package `UNIVERSAARL_MD_Vendors`
- data request `DR-MD-VEND-001`
- route cards `RD-FOUND-001`, `RD-FOUND-002`, `RD-FOUND-003`
- payment boundary decision placeholder `DEC-PAYMENT-001`
- training card `TR-03-02 Vendor Master Data`

Foundation decision handoff:

| Foundation result after TARGET-075 | PWS-MD-002 decision |
| --- | --- |
| Company context, Chart of Accounts and vendor/posting/payment dependency pages are visible enough for read-first explanation | Run PWS-MD-002 as read-first/no-write probe. |
| Company context is proven, but vendor posting groups, payment terms or payment methods are missing/unclear | Run only list/card/template visibility; mark setup dependencies as blocking any vendor creation. |
| Bank/payment context appears but payment boundary is not decided | Continue read-only field observation only; do not inspect, enter or invent real bank data. |
| Company context is unclear or `FOUNDATION-READINESS-DECISION.md` is missing | Block PWS-MD-002. Do not open vendor pages as the next live case. |
| Foundation decision says setup is not ready for master-data read-first probes | Block PWS-MD-002 and create a narrow Foundation follow-up instead. |

Evidence output:

- Vendors page title and URL
- visible fields or safe existing-record context
- payment terms/method fields if visible
- warning that real bank data is out of scope
- dependencies for `DR-MD-002`
- whether Vendor Posting Group, General Business Posting Group, VAT Business Posting Group, Payment Terms and Payment Method fields are visible, hidden, absent or blocked
- next-step classification: `ready-for-vendor-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `needs-payment-boundary-decision`, `blocked`

Stop if:

- `FOUNDATION-READINESS-DECISION.md` is missing or says Foundation is not ready for master-data read-first probes
- page would create/edit vendor
- bank/payment fields require real data
- company context unclear
- template/action inspection would create a vendor or imply payment readiness

Book/training use:

Supports vendor master-data chapter and payment-boundary explanation. The handbook output should separate vendor setup from bank/payment execution and must not store or invent real bank details.

## PWS-MD-003 Item/service/non-inventory read-first proof

Workstream: `WS04-MASTER-DATA-PRODUCT`, `WS07-INVENTORY-COSTING-STOCK`
Training module: `TR-03-03 Items, services and non-inventory items`
Related route decision: `RD-FOUND-004`
Status: `ready-after-foundation-decision`

Purpose:

Read item card/list context, item type, UOM and posting-group fields before creating inventory/service/non-inventory examples.

Start state:

- `PWS-CORE-001` has passed.
- `FOUNDATION-READINESS-DECISION.md` exists from TARGET-075 and does not block item/product read-first work.
- `DR-MD-ITEM-001`, `DEC-MD-UOM-001` and `DEC-MD-PRODUCT-001` are still planning artifacts, not BC setup approval.
- No item, service item or non-inventory item creation allowed.

Inputs:

- simulated package `UNIVERSAARL_MD_ItemsServices`
- data request `DR-MD-ITEM-001`
- route card `RD-FOUND-004`
- decisions `DEC-MD-UOM-001`, `DEC-MD-PRODUCT-001`
- training card `TR-03-03 Items, Services and Non-Inventory Items`

Foundation decision handoff:

| Foundation result after TARGET-075 | PWS-MD-003 decision |
| --- | --- |
| Company context, Chart of Accounts, product posting, VAT product, UOM and inventory dependency pages are visible enough for read-first explanation | Run PWS-MD-003 as read-first/no-write probe. |
| Company context is proven, but UOM or product posting groups are missing/unclear | Run only item-list/card field visibility; mark item creation and process use as blocked. |
| Inventory Posting Setup, costing method or item valuation dependency is unclear | Observe fields read-only only; do not claim inventory valuation, stock readiness, value entries or item-ledger readiness. |
| Service/non-inventory route is unclear | Keep service and non-inventory as conceptual training candidates; do not merge them with inventory-item proof. |
| Company context is unclear or `FOUNDATION-READINESS-DECISION.md` is missing | Block PWS-MD-003. Do not open item pages as the next live case. |
| Foundation decision says setup is not ready for product/master-data read-first probes | Block PWS-MD-003 and create a narrow Foundation or product-setup follow-up instead. |

Evidence output:

- Items page title and URL
- visible fields for Type, Base Unit of Measure and posting groups if safely available
- action/template observations
- dependencies for `DR-MD-003`
- clear boundary that inventory valuation is not proven
- whether Base Unit of Measure, Item Type, Gen. Product Posting Group, VAT Product Posting Group, Inventory Posting Group, Costing Method and Item Category are visible, hidden, absent or blocked
- next-step classification: `ready-for-item-write-gate`, `needs-uom-follow-up`, `needs-product-posting-follow-up`, `needs-inventory-setup-follow-up`, `needs-service-route-decision`, `blocked`

Stop if:

- `FOUNDATION-READINESS-DECISION.md` is missing or says Foundation is not ready for master-data/product read-first probes
- item creation wizard opens
- item type/UOM fields are hidden and layout options were not checked
- inventory setup dependency is unresolved
- route would imply valuation proof
- product setup route would treat inventory, service and non-inventory items as the same concept

Book/training use:

Supports product model chapter and prevents treating item cards as generic line labels. The handbook output should teach the difference between inventory, service and non-inventory records before any sales, purchase or inventory process is claimed.

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

1. Keep `TARGET-075` as the first live resume pilot and generate `FOUNDATION-READINESS-DECISION.md` from its result before master-data probes.
2. If TARGET-075 shows Foundation gaps, run the narrow read-first follow-up that matches the gap: posting groups, VAT/USt, dimensions, payment terms or number series.
3. If the Foundation decision allows read-first master-data context, implement `PWS-MD-001`, `PWS-MD-002` and `PWS-MD-003` as no-write probes.
4. Use those probes to harden company-context, page-type, dropdown, tooltip and screenshot-QA helpers.
5. Do not run write/setup scenarios until the active case explicitly unlocks them and a Smart Decision names the fields, route, proof and cleanup/keep strategy.
