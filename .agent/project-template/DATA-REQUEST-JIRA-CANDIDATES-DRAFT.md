# Data Request Jira Candidates Draft

Status: draft
Purpose: Jira-ready candidate tickets for the first Universaarl customer data requests.
Last reviewed: 2026-07-05

## Scope

These candidates turn the first core and master-data requests into project work items that a BC consultant could assign, validate and use for setup, UAT, training and book curation.

They do not contain real customer data. They do not authorize Business Central writes. They define what customer-like input must exist before setup, master data, training scenarios or final book claims become credible.

## Working rules

- Issue type is `Data Request`.
- Target world is `playthru` / `UNIVERSAARL-DE` / Universaarl GmbH.
- All named people are fictional case-study roles from `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md`.
- No credentials, auth material, real bank data or real personal data belong in these requests.
- A request is not ready for BC setup until validation rules and dependencies are satisfied.
- If data is incomplete, create a follow-up `Data Request`, `Decision` or `Risk`; do not hide the gap in setup.

## Package-derived Jira ticket map

Source: `SIMULATED-DATA-TABLES-CORE-MD-DRAFT.md`
Import rows: `JIRA-IMPORT-ROWS-DATA-PACKAGES-DRAFT.md`

These tickets are the first operational bridge from simulated Universaarl data packages to Jira-style project work. They are not import jobs and do not authorize Business Central writes.

| Jira key candidate | Issue type | Source package | Workstream | Epic | Business purpose | Customer owner | Internal owner | Status | Blocks BC setup? | Dependency / child tickets | Acceptance criteria | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DR-CORE-COMPANY-001` | Data Request | `UNIVERSAARL_CORE_CompanyInformation` | WS02 | CS-01; CS-05 | Collect safe simulated Company Information fields for Universaarl GmbH in `playthru` / `UNIVERSAARL-DE`. | Jonas Weber | Adrian Vogt; Eva Krueger | jira-ready | yes | `DEC-CORE-TAX-001`; `TASK-PWS-CORE-001` | Required fields are provided or explicitly open; no real tax/contact/bank/auth data; BC write remains blocked until read-first proof and Smart Decision. | Create Jira Data Request and read-first proof task; keep setup blocked. |
| `DEC-CORE-TAX-001` | Decision | `UNIVERSAARL_CORE_CompanyInformation` | WS03 | FF-04 | Decide which VAT/tax identity fields may be fictionalized and which must remain blank or source-reviewed. | Jonas Weber; Robert Klein | Eva Krueger | blocked | yes | official-source/tax-review task | Decision says what can be shown in book/training, what stays blank, and what requires external review. | Open Decision before any VAT/tax Company Information field is written. |
| `DR-CORE-ORG-001` | Data Request | `UNIVERSAARL_CORE_OrganizationModel` | WS02 | CS-02 | Classify departments, sites, role groups and reporting values before dimensions, locations or workflows are created. | Claudia Schulte; Sami Yilmaz | Adrian Vogt; Sarah Klein | jira-ready | yes | `DEC-ORG-DIM-001`; `DEC-ORG-LOC-001` | Every value is classified as dimension candidate, role group, site/location, legal entity or reporting-only; parked values are explicit. | Create Jira Data Request and two route decisions. |
| `DEC-ORG-DIM-001` | Decision | `UNIVERSAARL_CORE_OrganizationModel` | WS03 | FF Dimensions | Decide which organization values become dimensions and which stay training/reporting context. | Claudia Schulte; Jonas Weber | Eva Krueger | blocked | yes | dimension strategy task | No dimension value is created until business purpose, owner, phase and defaulting rule are known. | Add before any dimension setup case. |
| `DEC-ORG-LOC-001` | Decision | `UNIVERSAARL_CORE_OrganizationModel` | WS07 | Inventory/location model | Decide whether `SAAR-HQ` and `SAAR-WH` are story sites, BC Locations or later warehouse scope. | Elena Fischer | Sarah Klein | blocked | yes | inventory/location design task | Location setup route is clear; warehouse is either phase 1, later or parked. | Park BC Location creation until inventory route exists. |
| `DR-MD-CUST-001` | Data Request | `UNIVERSAARL_MD_Customers` | WS04 | MD-01 | Collect simulated customers for O2C, receivables, training and book examples without hiding posting dependencies. | Pia Neumann; Lena Hartmann | Felix Roth; Eva Krueger; Milena Brand | jira-ready | yes | `DEC-MD-NUM-001`; `DEC-FF-POSTING-001`; `DEC-FF-VAT-001`; `TASK-PWS-MD-001` | Customer names are simulated; posting/VAT/payment/numbering fields are known or explicitly blocked; no customer BC write is triggered. | Create Jira Data Request; keep master-data creation blocked. |
| `DR-MD-VEND-001` | Data Request | `UNIVERSAARL_MD_Vendors` | WS04 | MD-02 | Collect simulated vendors for P2P, payables, payment training and later fixed-asset scenarios. | Tobias Brandt; Lena Hartmann | Felix Roth; Eva Krueger; Milena Brand | jira-ready | yes | `DEC-MD-NUM-001`; `DEC-FF-POSTING-001`; `DEC-FF-VAT-001`; `DEC-PAYMENT-001`; `TASK-PWS-MD-002` | Vendor names are simulated; no real bank data; payment method/terms are known or blocked; no vendor BC write is triggered. | Create Jira Data Request; separate payment/bank decision. |
| `DEC-PAYMENT-001` | Decision | `UNIVERSAARL_MD_Vendors` | WS03; WS13 | Finance payment controls | Decide how payment methods are simulated without storing real bank details or implying live payment readiness. | Lena Hartmann | Eva Krueger | blocked | yes | payment training boundary task | Payment method examples are safe, fictional and separated from real banking setup. | Open before vendor payment fields or payment training scenarios. |
| `DR-MD-ITEM-001` | Data Request | `UNIVERSAARL_MD_ItemsServices` | WS04 | MD-03; MD-06 | Collect simulated inventory, service and non-inventory records for product-model, P2P, O2C, inventory and training scenarios. | Elena Fischer; Tobias Brandt; Pia Neumann | Felix Roth; Sarah Klein; Eva Krueger | jira-ready | yes | `DEC-MD-UOM-001`; `DEC-MD-PRODUCT-001`; `DEC-FF-POSTING-001`; `TASK-PWS-MD-003` | Item type, UOM, posting, VAT, inventory and costing dependencies are known or blocked; no item BC write is triggered. | Create Jira Data Request and product/UOM route decisions. |
| `DEC-MD-UOM-001` | Decision | `UNIVERSAARL_MD_ItemsServices` | WS04 | MD-03 | Decide first phase units of measure such as `PCS` and `HOUR` before item creation. | Elena Fischer; Pia Neumann | Sarah Klein | blocked | yes | UOM setup route task | UOM list is small, realistic and aligned with item/service examples. | Add before item setup. |
| `DEC-MD-PRODUCT-001` | Decision | `UNIVERSAARL_MD_ItemsServices` | WS04; WS07 | Product model and inventory boundary | Decide type split, costing route, inventory posting boundary and whether non-inventory items are in phase 1. | Elena Fischer; Tobias Brandt; Pia Neumann | Sarah Klein; Eva Krueger | blocked | yes | inventory/posting route task | Inventory, service and non-inventory behavior are not conflated; BC setup route is selected. | Add before product setup or item-card creation. |

## Dependency queue from the five packages

| Dependency ticket | Issue type | Why it exists | Unlocks | Current status |
| --- | --- | --- | --- | --- |
| `TASK-PWS-CORE-001` | Task | Read-first proof of Company Information and company context before any setup write. | Company Information setup and book screenshots | ready-after-freeze |
| `TASK-PWS-MD-001` | Task | Read-first customer list/card context before customer creation route. | Customer training and O2C master-data setup | ready-after-foundation |
| `TASK-PWS-MD-002` | Task | Read-first vendor list/card context before vendor creation route. | Vendor training and P2P master-data setup | ready-after-foundation |
| `TASK-PWS-MD-003` | Task | Read-first item/service/non-inventory page context before product setup route. | Item training, product model and inventory route | ready-after-foundation |
| `DEC-MD-NUM-001` | Decision | Numbering policy must be explicit before customer/vendor/item numbers are created. | Customer, vendor and item setup | blocked-by-foundation |
| `DEC-FF-POSTING-001` | Decision | Posting groups are required before realistic customer/vendor/item setup. | Customers, vendors, items, P2P and O2C | blocked-by-finance-foundation |
| `DEC-FF-VAT-001` | Decision | VAT groups must be defined before tax-sensitive master data and documents. | Customers, vendors, items, sales and purchase documents | blocked-by-vat-source-and-setup |

## Candidate status values

- `draft`: candidate is structured but not customer-confirmed.
- `needs-customer-owner`: customer-side owner must be confirmed.
- `needs-validation`: received data needs consultant review.
- `ready-for-design`: data can drive route and setup design.
- `blocked`: required data or dependency is missing.

## DR-CORE-001 Company information

Jira issue type: `Data Request`
Workstream: `WS02-CASE-STUDY-CORE`
Epic: `CS-01 Company Story and Legal Entity Model`; `CS-05 Company Information and Localization Inputs`
Business purpose: Define the visible identity and setup frame of Universaarl GmbH so company information, book context, training context and evidence labels are not generic.
Customer owner: Jonas Weber, with review by Mara Stein and Robert Klein for tax-sensitive boundaries.
Internal owner: Adrian Vogt for solution fit; Eva Krueger for finance fields; Jana Weiss for book language.
Due timing: before Company Information setup, accounting-period confirmation, VAT-sensitive book claims or final company-context screenshots.
Required format: one reviewed table or spreadsheet row for the first company, plus short notes for open assumptions.

Required fields:

- legal company name
- target Business Central company code
- address and country/region
- local currency
- language and localization expectation
- fiscal-year assumption
- VAT/tax registration context as review input, not final tax advice
- primary contact roles for management, finance, IT and training

Optional fields:

- phone, email and website for book screenshots
- company registration note if fictionalized
- logo status for later book assets
- preferred company display wording for customer-facing text

Validation rules:

- Company code must match `UNIVERSAARL-DE` until a later multi-company decision changes the roadmap.
- Country/region and currency must be coherent for the German foundation company.
- VAT/tax fields must be marked as `tax-review-needed` until Robert Klein or an official source boundary confirms wording.
- No real personal contact details or credentials may be included.
- Open assumptions must be logged as `Decision`, `Risk` or follow-up `Data Request`, not silently filled.

Dependencies:

- Active company exists in `playthru`.
- Company context proof exists before any later live write.
- VAT/compliance finality is not claimed from this data request alone.

BC usage:

- Company Information page.
- accounting period and localization explanation.
- evidence result labels.
- role-based training examples.

Implementation route candidate:

- Collect locally first.
- Later validate in Business Central read-only.
- Write Company Information only through a gated setup case with before/after screenshot and reopen proof.

Evidence, UAT, training and book impact:

- Evidence: company-context proof and Company Information screenshot when setup is allowed.
- UAT: finance and management confirm displayed company identity.
- Training: TR-00-02 Environment, Company and Evidence Boundary.
- Book: opening chapter can explain environment, company and why Universaarl uses a separate company.

Risk if missing:

- The book becomes a generic BC manual, and later setup decisions lack a credible company frame.

Acceptance criteria:

- Owner and internal reviewer are named.
- Required fields are provided or explicitly open.
- Tax-sensitive fields are bounded as review inputs.
- BC write route is not triggered by the request itself.

Status: `draft`

## DR-CORE-002 Organization model

Jira issue type: `Data Request`
Workstream: `WS02-CASE-STUDY-CORE`
Epic: `CS-02 Organization, Locations and Responsibility Model`
Business purpose: Define departments, sites, reporting ownership and role responsibilities before dimensions, permissions, training and UAT are invented.
Customer owner: Claudia Schulte for reporting model, Sami Yilmaz for IT/user context, Mara Stein for phase-1 scope.
Internal owner: Adrian Vogt for architecture; Eva Krueger for dimensions/reporting; Sarah Klein for training.
Due timing: before dimension setup, role training matrix finalization, location model, management reporting or intercompany roadmap expansion.
Required format: organization table with one row per value and a classification column.

Required fields:

- department or cost-center name
- physical site or location if applicable
- business unit or responsibility area
- process owner
- reporting relevance
- phase: phase 1, later, parked
- classification: legal entity, site/location, dimension candidate, role group or reporting-only

Optional fields:

- manager role
- common user roles
- training audience
- example process using the value
- known ambiguity or naming conflict

Validation rules:

- Do not turn every organization word into a dimension automatically.
- Separate legal entities, BC companies, locations and dimensions.
- Mark values that are training-only or reporting-only.
- Foreign-country entities must not inherit SKR04 or German setup by default.
- Unclear values require a follow-up decision before BC setup.

Dependencies:

- Company roadmap and first company boundary from `DR-CORE-001`.
- Dimension strategy in `WS03-FINANCE-FOUNDATION`.
- Role and training model.

BC usage:

- dimensions and dimension values.
- responsibility-center or location discussion.
- role-based training groups.
- reporting and UAT ownership.

Implementation route candidate:

- Local classification first.
- Review with finance, management and IT owners.
- Create dimensions/locations/roles only through later gated setup cases.

Evidence, UAT, training and book impact:

- Evidence: later dimension and role-context screenshots.
- UAT: users can explain which values they use and why.
- Training: role-based curriculum and exercises.
- Book: explains why organization structure should not be confused with the chart of accounts.

Risk if missing:

- Dimensions, permissions, locations and training become arbitrary or demo-perfect.

Acceptance criteria:

- Every organization value has a classification.
- Phase-1 values are separated from later roadmap values.
- Dimension candidates have a business purpose and owner.
- No BC setup is implied without a later Smart Decision.

Status: `draft`

## DR-MD-001 Customers

Jira issue type: `Data Request`
Workstream: `WS04-MASTER-DATA-PRODUCT`
Epic: `MD-01 Customer Master Data`
Business purpose: Provide customer records that can carry realistic order-to-cash, receivables, payment, reporting and training scenarios.
Customer owner: Pia Neumann for sales process; Lena Hartmann for finance review.
Internal owner: Felix Roth for process fit; Eva Krueger for posting setup dependency; Milena Brand for data quality.
Due timing: after finance dependencies are designed; before customer creation, sales document scenarios or O2C training.
Required format: spreadsheet or table with one row per fictional customer and validation columns.

Required fields:

- customer number or numbering rule
- customer name
- address and country/region
- VAT/tax context where relevant
- customer posting group
- general business posting group
- VAT business posting group
- payment terms
- currency if not local currency
- primary contact role or generic contact label
- intended scenario: sales order, invoice, payment, reporting, correction or training

Optional fields:

- delivery address
- credit-limit assumption
- preferred language
- customer price/discount note
- dimension defaults if later approved

Validation rules:

- Use fictional customer names only.
- Customer posting group, general business posting group, VAT business posting group and payment terms must exist or be explicitly parked.
- Tax-sensitive assumptions are review inputs, not final compliance claims.
- At least one customer should be simple enough for a manual book/training example.
- Bulk creation must wait for template or configuration-package route decision.

Dependencies:

- Number series or explicit numbering policy.
- Posting groups and VAT setup preflight.
- Payment terms.
- Source-backed customer-card explanation.

BC usage:

- Customer Card.
- sales documents and customer ledger entries.
- receivables reporting.
- role-based sales and finance training.

Implementation route candidate:

- One manual Customer Card for learning and screenshots.
- Templates or configuration package for repeated records once finance dependencies are ready.
- API route parked unless a later integration case unlocks it.

Evidence, UAT, training and book impact:

- Evidence: customer-card create/read/reopen scenario, later sales document trace.
- UAT: sales and finance verify mandatory fields and expected posting behavior.
- Training: customer master data module and O2C exercise.
- Book: explains which fields decide address, terms, tax grouping and posting behavior.

Risk if missing:

- O2C examples become artificial, blocked or financially misleading.

Acceptance criteria:

- Minimum one training customer and one realistic business customer are defined or explicitly deferred.
- Required posting and payment fields are known or blocked.
- Data quality gaps create tickets, not hidden assumptions.
- No real customer data is used.

Status: `draft`

## DR-MD-002 Vendors

Jira issue type: `Data Request`
Workstream: `WS04-MASTER-DATA-PRODUCT`
Epic: `MD-02 Vendor Master Data`
Business purpose: Provide vendor records that can carry realistic purchase, payables, payment, fixed-asset, service and training scenarios.
Customer owner: Tobias Brandt for purchasing process; Lena Hartmann for finance/payment review.
Internal owner: Felix Roth for P2P process fit; Eva Krueger for payable setup dependency; Milena Brand for data quality.
Due timing: after finance dependencies are designed; before vendor creation, purchase scenarios, payment scenarios or P2P training.
Required format: spreadsheet or table with one row per fictional vendor and validation columns.

Required fields:

- vendor number or numbering rule
- vendor name
- address and country/region
- vendor posting group
- general business posting group
- VAT business posting group
- payment terms
- payment method if in scope
- primary contact role or generic contact label
- intended scenario: material purchase, service purchase, fixed asset, payment, correction or training

Optional fields:

- purchase address
- preferred currency
- delivery terms
- tax registration note
- bank/payment placeholder if a later payment case permits it

Validation rules:

- Use fictional vendor names only.
- No real bank details may be stored in the project template.
- Vendor posting group, general business posting group, VAT business posting group, payment terms and payment method must exist or be explicitly parked.
- At least one vendor should support a simple manual book/training example.
- Payment-sensitive data requires a later gated payment/bank case.

Dependencies:

- Number series or explicit numbering policy.
- Posting groups and VAT setup preflight.
- Payment terms and payment methods.
- Source-backed vendor-card explanation.

BC usage:

- Vendor Card.
- purchase documents.
- vendor ledger entries and payment processes.
- fixed asset and service purchasing examples.

Implementation route candidate:

- One manual Vendor Card for learning and screenshots.
- Templates or configuration package for repeated records once dependencies are ready.
- Bank/payment fields parked unless explicitly unlocked.

Evidence, UAT, training and book impact:

- Evidence: vendor-card create/read/reopen scenario, later purchase and payment trace.
- UAT: purchasing and finance verify mandatory fields and expected controls.
- Training: vendor master data module and P2P exercise.
- Book: explains which fields influence purchasing, payables and payment readiness.

Risk if missing:

- P2P and payment examples become blocked or unrealistic.

Acceptance criteria:

- Minimum one training vendor and one realistic business vendor are defined or explicitly deferred.
- Required posting and payment fields are known or blocked.
- Bank/payment details are handled with a separate gate.
- No real vendor data is used.

Status: `draft`

## DR-MD-003 Items, services and non-inventory items

Jira issue type: `Data Request`
Workstream: `WS04-MASTER-DATA-PRODUCT`
Epic: `MD-03 Product Model, Items, Services and Non-Inventory Items`; `MD-06 Templates, Configuration Packages and Data Quality`
Business purpose: Define product and service records so purchasing, sales, inventory, costing and training scenarios use meaningful item behavior instead of arbitrary test lines.
Customer owner: Elena Fischer for inventory reality, Tobias Brandt for purchasing, Pia Neumann for sales, Claudia Schulte for reporting/cost view.
Internal owner: Felix Roth for product model; Eva Krueger for posting group dependency; Milena Brand for data quality and import route.
Due timing: after item number policy, posting group preflight and unit-of-measure decision; before item creation, inventory scenarios, O2C/P2P item lines or item training.
Required format: spreadsheet or table with one row per fictional product/service/non-inventory item and validation columns.

Required fields:

- item/service number or numbering rule
- description
- type: inventory, service or non-inventory
- base unit of measure
- item category if used
- inventory posting group for inventory items
- general product posting group
- VAT product posting group
- costing method where relevant
- purchase cost or sales price assumption where relevant
- intended scenario: purchase, sale, inventory, service, error diagnosis, training or reporting

Optional fields:

- product family
- dimensions if later approved
- replenishment assumption
- vendor item relation if later in scope
- variant/attribute note if business-relevant

Validation rules:

- Inventory, service and non-inventory items must not be treated as the same concept.
- Inventory items need inventory posting group, costing method and stock/value boundary.
- Service and non-inventory items must not imply quantity-on-hand or inventory valuation.
- Posting groups and units of measure must exist or be explicitly parked.
- At least one item should be simple enough for manual learning; bulk route waits for template/package decision.

Dependencies:

- Number series or explicit item numbering policy.
- Units of measure.
- Item categories if used.
- General/VAT/product posting setup.
- Inventory posting setup for inventory items.
- Product route decision: manual, template, configuration package, Excel import, API or park.

BC usage:

- Item Card and item list.
- sales and purchase lines.
- inventory entries, value entries and costing scenarios.
- product training and book screenshots.

Implementation route candidate:

- Manual card for one visible learning item.
- Configuration package or Excel-assisted package for larger catalogs after dependencies are stable.
- API route parked unless integration scope requires it.
- Error item remains gated and is not created casually.

Evidence, UAT, training and book impact:

- Evidence: item-card create/read/reopen scenario and later item-line process traces.
- UAT: purchasing, sales and inventory verify that item behavior matches the process.
- Training: item master data module, inventory boundary and product-type exercises.
- Book: explains why item type, unit, posting groups and costing method affect later postings.

Risk if missing:

- Purchasing, sales and inventory tests become disconnected from real BC item behavior.

Acceptance criteria:

- Each planned record has a type and intended scenario.
- Required posting, unit and costing fields are known or blocked.
- Inventory valuation is not claimed without later evidence.
- No real product/customer data is used.

Status: `draft`

## Readiness summary

| Request | Jira issue type | Workstream | Current status | Main blocker before BC setup |
| --- | --- | --- | --- | --- |
| `DR-CORE-001` | Data Request | WS02 | draft | customer-like company fields and tax-review boundary |
| `DR-CORE-002` | Data Request | WS02 | draft | classification of organization values |
| `DR-MD-001` | Data Request | WS04 | draft | posting groups, VAT groups, payment terms and numbering policy |
| `DR-MD-002` | Data Request | WS04 | draft | posting groups, VAT groups, payment method/terms and no real bank data |
| `DR-MD-003` | Data Request | WS04 | draft | item type, units, posting groups, costing and route decision |

## Next use

1. Review these five candidates against the realism standard.
2. Convert accepted candidates into Jira import rows or project tickets.
3. Create simulated data tables only after the owner, validation and dependency rules are accepted.
4. Resume live BC work with a read-first foundation/master-data preflight, not blind record creation.
