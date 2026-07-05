# Training Module Cards Draft

Status: draft
Purpose: Erste rollenbasierte Schulungskarten fuer Universaarl, Kundenhandbuch, UAT und Playwright-Evidence.
Last reviewed: 2026-07-05

## How to use

Each module card turns a training topic into project work. It must be usable by a trainer, a Business Central consultant, the book author and the Playwright/evidence owner.

Required fields:

- Workstream
- Epic
- Issue type
- Business purpose
- Target roles
- Customer/example data
- BC concept or process
- Exercise
- Typical mistakes
- Success check
- Escalation path
- Handbook/book output
- Source/evidence status
- UAT status
- Playwright/evidence output
- Realism note

No module is trainer-ready until concrete Business Central behavior is source-backed, observed in Universaarl, repeatable with Playwright or accepted through UAT.

## TR-00-02 Environment, Company and Evidence Boundary

Workstream: `WS02-CASE-STUDY-CORE`
Epic: `CS-03 Environment, Company Context and Evidence Boundary`
Issue type: Training Item
Status: `evidence-needed`

Business purpose:

Users must know where they are working before they create, change, post or validate anything. Business Central can contain multiple environments and companies. A correct process in the wrong company is still wrong project work.

Target roles:

- all key users
- admins
- finance
- purchasing
- sales
- inventory/warehouse
- book/training team

Customer/example data:

- environment: `playthru`
- first target company: `UNIVERSAARL-DE`
- legacy examples: RM/CRONUS only as historical reference, not active truth

BC concept or process:

- environment vs company
- company context before setup or process work
- old evidence vs active Universaarl evidence
- source/evidence/book-claim boundary

Exercise:

1. Look at a screenshot or read-only BC page.
2. Identify environment, company, page title and whether the screenshot belongs to active Universaarl work.
3. Classify the evidence as active Universaarl, legacy reference, technical-only or rejected.
4. Decide whether a user may continue, stop or ask for clarification.

Typical mistakes:

- treating an old RM/CRONUS screenshot as current proof
- missing the company in the URL or page context
- creating data after using search without confirming the company
- using a screenshot as a final book claim without page/company context

Success check:

- The participant can state the environment and company before any effective action.
- The participant can explain why `UNIVERSAARL-DE` is the active first target company.
- The participant can reject legacy evidence as final proof.

Escalation path:

- If company or environment is unclear, stop and request a context proof.
- If the evidence is legacy, mark it as reference only.
- If the page is not in `UNIVERSAARL-DE`, do not continue with setup or process work.

Handbook/book output:

- short handbook page: "Always confirm environment and company first"
- book explanation of environment, company and legal entity
- glossary entry for legacy evidence, active evidence and final claim

Source/evidence status:

- Official source needed for environment/company concept.
- Universaarl context proof exists historically in project evidence, but must be connected to this module before promotion.

UAT status:

- planned as `UAT-CS-001 Company context read-only proof`

Playwright/evidence output:

- read-only context scenario with URL, page title, company, environment and screenshot QA
- evidence card that states what the screenshot proves and does not prove

Realism note:

Real users sometimes work in the wrong company after switching tabs, using bookmarks or following old instructions. The training should include that realistic failure mode.

Acceptance criteria:

- Module has a company-context screenshot or accepted placeholder.
- Exercise includes active and legacy examples.
- Handbook output avoids agent/evidence-meta language for customer-facing prose.

## TR-01-01 Role Center and Navigation

Workstream: `WS02-CASE-STUDY-CORE`
Epic: `CS-04 Business Central Navigation and UI Baseline`
Issue type: Training Item
Status: `evidence-needed`

Business purpose:

Users need to move safely through Business Central before they handle master data, documents or postings. Navigation is not just search; users must recognize Role Center, lists, cards, actions, dropdowns and dialogs.

Target roles:

- all end users
- key users
- admins
- training team

Customer/example data:

- `UNIVERSAARL-DE` read-only pages
- Role Center
- Customers, Vendors, Items, Chart of Accounts or Company Information as example pages

BC concept or process:

- Role Center
- Tell Me/search
- direct page navigation
- lists and cards
- action bars and dropdown actions
- safe read-only exploration vs data-changing actions

Exercise:

1. Start from Role Center or a known safe page.
2. Navigate to a list page without creating a record.
3. Open a card or read-only record if available.
4. Identify at least one safe action and one data-changing action.
5. Return to the previous page or Role Center.

Typical mistakes:

- using global search unnecessarily when a known page route is available
- clicking `New/Neu` without knowing whether it opens a dropdown, a wizard or a record
- missing action dropdowns
- assuming a field or button is absent before checking layout, FastTabs, FactBox or overflow
- using screenshots that do not show the relevant UI element

Success check:

- The participant can name the page type.
- The participant can identify safe navigation vs record-changing action.
- The participant can explain why hover/tooltips and dropdowns matter.

Escalation path:

- If a dialog appears and the effect is unclear, stop.
- If a button is ambiguous, hover or inspect the dropdown before clicking.
- If the layout hides information, expand the page area, FastTab or FactBox before calling it unavailable.

Handbook/book output:

- navigation quick guide
- safe-action checklist
- explanation of list, card, FastTab, FactBox, action and dialog
- note that screenshots must teach the visible UI element

Source/evidence status:

- Microsoft Learn UI training path is the source anchor.
- Universaarl UI screenshots and Playwright repeatability still needed for trainer-ready status.

UAT status:

- planned as navigation exercise for all key users

Playwright/evidence output:

- read-only navigation proof
- screenshot truth QA for Role Center, list, card, action dropdown and tooltip where available
- rejected-path note for unsafe unscoped `New/Neu`

Realism note:

Beginners often believe "search is the system." The book should teach search, but also teach page context, menus, lists and cards so users understand where they are.

Acceptance criteria:

- Module includes at least one Universaarl UI screenshot set before trainer-ready.
- Exercise contains no required write action.
- Safe vs data-changing actions are explicitly separated.

## TR-02-01 Chart of Accounts

Workstream: `WS03-FINANCE-FOUNDATION`
Epic: `FF-02 Chart of Accounts and Account Categories`
Issue type: Training Item
Status: `draft`

Business purpose:

The chart of accounts is the foundation for finance, posting groups, reports and later process traces. Users must understand that Universaarl uses a SKR04-oriented starter scope, not a complete legally final chart of accounts.

Target roles:

- finance/accounting
- management
- key users
- book/training team

Customer/example data:

- SKR04-oriented Universaarl starter accounts
- candidate accounts for receivables, payables, VAT, revenue, expense, bank, inventory and fixed assets

BC concept or process:

- G/L account
- account number and name
- income statement vs balance sheet classification
- direct posting / posting allowed boundary
- account categories and reporting
- relationship to posting groups

Exercise:

1. Review a small account list.
2. Classify accounts as balance sheet, P&L, VAT, receivable/payable, inventory or bank/fixed-asset related.
3. Identify which accounts are needed before posting groups.
4. Mark unknown or tax-sensitive accounts for review.

Typical mistakes:

- calling the starter scope "full SKR04"
- treating sandbox account setup as tax-advisor approval
- creating posting groups before required accounts are visible
- changing or deleting accounts after they are used without understanding consequences

Success check:

- The participant can explain why posting groups need G/L accounts.
- The participant can distinguish starter scope from final compliance.
- The participant can identify which accounts need review before posting or VAT claims.

Escalation path:

- If an account's purpose is unclear, ask finance owner or tax advisor role.
- If VAT/legal finality is involved, mark as review boundary.
- If an account was already used, do not delete or repurpose it casually.

Handbook/book output:

- beginner section: "What is a G/L account?"
- checklist for finance account review
- book boundary text for SKR04-oriented starter accounts

Source/evidence status:

- Microsoft Learn finance setup sources needed for product concept.
- Universaarl chart/reopen evidence exists as candidate and must be linked before trainer-ready.

UAT status:

- draft exercise; not accepted by key user yet

Playwright/evidence output:

- chart of accounts list/card reopen proof
- screenshot showing account number, name and visible classification fields
- result card stating starter-scope limitations

Realism note:

A real finance team rarely approves every account in one pass. The module should include a realistic open question for accounts that need tax/accounting review.

Acceptance criteria:

- Module avoids final compliance claims.
- Exercise includes at least one open/review account.
- Evidence card connects visible accounts to the training outcome.

## TR-02-02 Posting Groups

Workstream: `WS03-FINANCE-FOUNDATION`
Epic: `FF-03 Posting Groups and Posting Setup`
Issue type: Training Item
Status: `evidence-needed`

Business purpose:

Posting groups explain how Business Central finds G/L accounts from customers, vendors, items and documents. This is one of the most important concepts for finance users and a common beginner confusion.

Target roles:

- finance key users
- sales key users
- purchasing key users
- inventory key users
- consultants
- book/training team

Customer/example data:

- customer group examples
- vendor group examples
- general business/product posting groups
- VAT business/product posting groups
- inventory posting group candidates
- related G/L accounts from the starter scope

BC concept or process:

- customer posting group
- vendor posting group
- general business posting group
- general product posting group
- VAT business posting group
- VAT product posting group
- inventory posting group
- posting setup as account determination

Exercise:

1. Start with a simple sales or purchase example.
2. Identify which master data carries business-side posting groups.
3. Identify which item/product data carries product-side posting groups.
4. Trace which setup row would determine a receivable/payable, revenue, expense, VAT or inventory account.
5. Mark missing rows as blocked, not guessed.

Typical mistakes:

- expecting the customer card to contain every G/L account directly
- confusing customer/vendor posting groups with general posting groups
- changing VAT groups to "make a document post" without source or review
- treating one visible setup row as proof for all scenarios

Success check:

- The participant can explain account determination in plain language.
- The participant can tell which setup is needed before first preview/posting.
- The participant can identify why missing posting setup blocks realistic O2C/P2P evidence.

Escalation path:

- If a posting setup row is missing, stop and create a setup decision/task.
- If VAT setup is involved, require source and tax boundary review.
- If inventory accounts are involved, align with inventory foundation before posting.

Handbook/book output:

- concept page: "How Business Central finds G/L accounts"
- simple diagram or table for customer/vendor/item/posting setup relationship
- warning box for missing posting setup before document posting

Source/evidence status:

- Official source needed for product explanation.
- Universaarl setup-row evidence still needed before trainer-ready.

UAT status:

- planned; requires setup-row evidence and at least one later process scenario

Playwright/evidence output:

- read-only setup-row proof for relevant posting setup pages
- later preview/posting trace that confirms account determination
- evidence card that separates product concept from a specific Universaarl setup row

Realism note:

Posting groups are hard because they are invisible until a document posts or previews. Training should include this confusion explicitly instead of pretending the concept is obvious.

Acceptance criteria:

- Module includes at least one plain-language account-determination example.
- Missing setup rows are documented as blockers or decisions.
- No VAT/final posting claim is made from source-only evidence.

## TR-02-03 VAT/USt Boundary

Workstream: `WS03-FINANCE-FOUNDATION`
Epic: `FF-04 VAT and Tax Boundary`
Issue type: Training Item
Status: `blocked-by-source-and-setup`

Business purpose:

Finance, sales and purchasing users must understand the difference between Business Central VAT setup and a final tax or compliance decision. Business Central can calculate VAT from VAT business posting groups, VAT product posting groups and VAT Posting Setup rows, but the correct German tax treatment still needs source-backed project decisions and tax review.

Target roles:

- finance key users
- sales key users
- purchasing key users
- consultants
- UAT testers
- training/book team

Customer/example data:

- Universaarl domestic German scenarios, simulated only until source and setup evidence exist
- customer and vendor VAT group candidates from later master-data packages
- product/service VAT group candidates from item/service packages
- no final VAT registration, tax advisor approval or compliance claim in this draft

BC concept or process:

- VAT business posting group
- VAT product posting group
- VAT Posting Setup
- relationship between customer/vendor/product setup and document VAT calculation
- source/evidence boundary for German VAT claims

Exercise:

1. Start with a simple domestic sales or purchase example.
2. Identify which side of the scenario represents the business party and which side represents the product or service.
3. Map the scenario to candidate VAT business and VAT product posting groups.
4. Check whether a VAT Posting Setup row would be needed before preview or posting.
5. Mark missing source, tax review or Universaarl setup proof as blocked instead of inventing a VAT setup.

Typical mistakes:

- treating a visible VAT group as final German tax correctness
- changing VAT groups only to make a posting work
- mixing general posting groups and VAT posting groups
- using CRONUS or legacy laboratory VAT setup as Universaarl final proof
- writing legal, GoBD or tax-advisor claims from Playwright screenshots

Success check:

- The participant can explain in plain language why BC VAT setup is not the same as tax advice.
- The participant can identify the two VAT group dimensions and the setup row that connects them.
- The participant can tell when to stop for source review, tax review or a setup decision.

Escalation path:

- If the VAT treatment is unclear, create a decision or tax-review task.
- If a required VAT Posting Setup row is missing, stop before preview/posting and create a setup task.
- If a training example needs legal certainty, require official source and tax advisor review before trainer-ready status.

Handbook/book output:

- customer-facing page: "VAT setup in Business Central and what it does not decide"
- simple table for VAT business group, VAT product group and VAT Posting Setup
- warning box that German tax correctness is not proven by a sandbox calculation alone

Source/evidence status:

- Official Microsoft source needed for the BC product explanation.
- German tax/compliance claims need official/tax review and cannot be inferred from sandbox evidence.
- Universaarl setup-row evidence still needed before trainer-ready.

UAT status:

- planned; should be tested with a non-posting preview/read-first scenario before process training

Playwright/evidence output:

- read-first proof of VAT setup pages in `playthru` / `UNIVERSAARL-DE`
- screenshot truth for relevant VAT group and VAT Posting Setup fields
- later preview trace only after source, setup and Smart Decision gates

Realism note:

A serious customer training does not teach "19 percent" as a magic value. It teaches who owns the tax decision, where BC stores the setup, which scenarios the setup covers and what must be reviewed before real posting.

Acceptance criteria:

- Module separates BC setup behavior from tax finality.
- Module includes at least one stop condition for missing source or missing tax review.
- No final German VAT, GoBD, AO or compliance claim is made from source-only or screenshot-only evidence.

## TR-02-04 Dimensions

Workstream: `WS03-FINANCE-FOUNDATION`
Epic: `FF-05 Dimensions and Reporting Model`
Issue type: Training Item
Status: `blocked-by-organization-model-and-read-first-proof`

Business purpose:

Dimensions help Universaarl analyze posted entries by meaningful business perspectives such as cost center, product line or sales channel. They are reporting and control attributes, not a substitute for customers, vendors, items, projects or warehouse locations.

Target roles:

- finance key users
- department leads
- sales and purchasing key users
- inventory/product owners
- consultants
- management/reporting users
- training/book team

Customer/example data:

- organization model package: `UNIVERSAARL_CORE_OrganizationModel`
- dimension candidates from existing Universaarl draft work, subject to confirmation
- examples for cost center, product line and channel remain draft until setup route and value evidence are recovered

BC concept or process:

- dimensions as analytical attributes on entries
- dimension values
- global dimensions
- shortcut dimensions
- default dimensions and later document/journal impact
- reporting, filtering and correction boundary

Exercise:

1. Start from Universaarl's organization model, not from random codes.
2. Classify each reporting need as dimension, master data, role/security, workflow or location/site.
3. Choose only dimensions that will be used consistently in daily work and reporting.
4. Check which values must exist before master data or transaction training.
5. Mark missing organization decision, setup route or read-first proof as blocked.

Typical mistakes:

- creating too many dimensions because they look harmless
- using dimensions as a replacement for clean master data
- mixing organizational hierarchy, legal entity, location and reporting purpose without a decision
- assuming a dimension value is valid for posting before defaulting and entry behavior are tested
- teaching report filters before posted example data exists

Success check:

- The participant can explain what a dimension adds to an entry.
- The participant can decide whether a business attribute belongs in a dimension or elsewhere.
- The participant can name which setup/evidence is still needed before using dimensions in process training.

Escalation path:

- If the organization model is unclear, create a data request or decision.
- If the field route is unclear, run a read-first page and FastTab diagnosis before writing setup.
- If later posting uses dimensions unexpectedly, create a UAT defect or setup review task.

Handbook/book output:

- customer-facing page: "Dimensions: how Business Central adds reporting context"
- table that separates dimension candidates from master data, roles, workflows and locations
- training checklist for keeping dimensions small, stable and understandable

Source/evidence status:

- Official Microsoft source needed for product explanation.
- Universaarl organization model and dimension setup proof are still needed.
- Posted-entry/reporting proof is not available yet and must not be implied.

UAT status:

- planned; requires setup proof, defaulting proof and later posted-entry/reporting proof

Playwright/evidence output:

- read-first proof of Dimensions and Dimension Values pages
- screenshot truth for relevant fields, FastTabs and action routes
- later default-dimension and entry/report proof only after setup gates

Realism note:

Dimensions are powerful precisely because they affect reporting across processes. A realistic implementation keeps them limited, owned and testable instead of using them as a catch-all for every customer question.

Acceptance criteria:

- Module distinguishes dimensions from master data, roles, workflows and locations.
- Module requires organization-owner confirmation before trainer-ready status.
- Module does not claim reporting or posted-entry proof until Universaarl evidence exists.

## TR-03-01 Customer Master Data

Workstream: `WS04-MASTER-DATA-PRODUCT`
Epic: `MD-01 Customer Master Data`
Issue type: Training Item
Status: `blocked-by-foundation`

Business purpose:

Sales and finance users need to understand that a customer card is not just an address record. It carries the data Business Central needs for sales documents, receivables, VAT treatment, payment terms, posting groups and later reporting.

Target roles:

- sales operations
- finance/accounts receivable
- customer service
- key users
- UAT testers
- training/book team

Customer/example data:

- simulated package: `UNIVERSAARL_MD_Customers`
- clean example: `SIM-CUST-10000` / `U-CUST-10000` / `Saarland Maschinenbau GmbH`
- delivery-address example: `SIM-CUST-10010` / `U-CUST-10010` / `Mosel Retail Partner KG`
- negative training idea: `SIM-CUST-ERR90`, parked and not used for normal setup

BC concept or process:

- customer list and customer card
- customer number and naming policy
- customer posting group
- general business posting group
- VAT business posting group
- payment terms
- blocked or incomplete customer data
- customer templates or configuration packages as scalable setup route

Exercise:

1. Review the simulated customer records and identify which fields are business identity, posting/VAT setup, payment behavior and training-only context.
2. Mark every `TBD` posting, VAT, payment and numbering field as blocked rather than guessing a value.
3. Decide whether the first customer should be created manually for learning or by template/configuration package after dependencies are resolved.
4. Explain why an incomplete customer should be used only in a controlled negative-training case.

Typical mistakes:

- treating the customer as an address-only record
- creating customers before posting groups, VAT groups and payment terms are clear
- using real customer/contact/bank data in a training sandbox
- making the first import too broad before one card route has been read-first validated
- using an intentionally incomplete customer in a normal UAT process

Success check:

- The participant can name the minimum customer fields that are still blocked.
- The participant can explain why customer posting setup affects later ledger entries.
- The participant can distinguish a clean training customer from a negative-test customer.
- The participant can choose a safe setup route: manual first proof, then template/configuration package.

Escalation path:

- If posting/VAT/payment values are missing, escalate to finance foundation decisions.
- If real customer data appears, stop and replace it with fictional/simulated data.
- If a sales process needs this customer before dependencies are resolved, park the process and create a dependency ticket.

Handbook/book output:

- handbook section: "Customer master data: more than an address"
- checklist for customer data owners
- beginner explanation of posting groups and payment terms on the customer card
- warning that simulated data is not customer production data

Source/evidence status:

- Business Central customer master-data concept needs official source support before trainer-ready.
- Universaarl customer list/card read-first proof is still needed.
- Current simulated data is Jira-ready but not BC-setup-ready.

UAT status:

- planned; blocked until numbering, posting groups, VAT groups, payment terms and read-first customer-card proof are available

Playwright/evidence output:

- `PWS-MD-001` customer list/card read-first proof
- later controlled create/reopen proof for one clean customer after dependencies
- evidence card separating customer concept, simulated data and actual BC setup

Realism note:

Customer setup is often delayed because sales knows the customer names while finance owns posting, VAT and payment rules. The training should make this split visible instead of pretending one role can safely complete the card alone.

Acceptance criteria:

- Module uses only simulated customer values.
- Every setup-sensitive field has a dependency or decision.
- No customer creation is implied before the finance foundation gates are resolved.

## TR-03-02 Vendor Master Data

Workstream: `WS04-MASTER-DATA-PRODUCT`
Epic: `MD-02 Vendor Master Data`
Issue type: Training Item
Status: `blocked-by-foundation`

Business purpose:

Purchasing and finance users need to understand that vendor master data controls purchase documents, payables, payment behavior and later auditability. A vendor card must be complete enough for the intended process, but safe training data must not include real bank or confidential supplier data.

Target roles:

- purchasing
- finance/accounts payable
- procurement key users
- payment process owner
- UAT testers
- training/book team

Customer/example data:

- simulated package: `UNIVERSAARL_MD_Vendors`
- material vendor: `SIM-VEND-20000` / `U-VEND-20000` / `Saarstahl Komponenten GmbH`
- service vendor: `SIM-VEND-20010` / `U-VEND-20010` / `IT Services Saar GmbH`
- fixed-asset supplier candidate: `SIM-VEND-FA10`, parked until the Fixed Assets workstream

BC concept or process:

- vendor list and vendor card
- vendor number and naming policy
- vendor posting group
- general business posting group
- VAT business posting group
- payment terms and payment method
- no-real-bank-data boundary
- material, service and fixed-asset vendor use cases

Exercise:

1. Review the vendor examples and classify them as material, service or later fixed-asset supplier.
2. Identify which fields affect P2P posting, VAT and payment behavior.
3. Mark bank/payment-sensitive values as simulated, blocked or intentionally excluded.
4. Decide which vendor is suitable for first P2P UAT only after posting/VAT/payment dependencies are resolved.

Typical mistakes:

- entering real bank or supplier contact details in a sandbox training package
- assuming a vendor can be used for purchase orders before posting groups are ready
- confusing payment terms with payment method
- using a fixed-asset vendor before the asset workstream has setup and evidence
- importing many vendors before one clean route has been validated

Success check:

- The participant can identify why vendor posting groups matter.
- The participant can explain the no-real-bank-data boundary.
- The participant can choose between material, service and parked fixed-asset vendor examples.
- The participant can describe which dependencies block first vendor creation.

Escalation path:

- If payment method/bank data is unclear, escalate to `DEC-PAYMENT-001`.
- If VAT or posting setup is missing, escalate to finance foundation.
- If a vendor is needed for Fixed Assets, park it until the FA route is approved.

Handbook/book output:

- handbook section: "Vendor master data and payment boundaries"
- checklist for vendor data owners
- beginner explanation of vendor posting group, VAT group, payment terms and payment method
- warning that sandbox vendor data must not contain real bank details

Source/evidence status:

- Official source support needed for vendor setup explanation.
- Universaarl vendor list/card read-first proof is still needed.
- Current simulated data is Jira-ready but not BC-setup-ready.

UAT status:

- planned; blocked until numbering, vendor posting, VAT, payment terms/methods and read-first vendor-card proof are available

Playwright/evidence output:

- `PWS-MD-002` vendor list/card read-first proof
- later controlled create/reopen proof for one clean material vendor after dependencies
- evidence card separating vendor concept, payment boundary and actual setup

Realism note:

Vendor setup is cross-functional: purchasing knows supplier purpose, finance owns posting and payment controls. The module should train that split explicitly because it is a common project bottleneck.

Acceptance criteria:

- Module excludes real bank, contact and supplier data.
- Payment-sensitive fields are blocked or decision-linked.
- No purchase document scenario is implied before vendor setup dependencies are resolved.

## TR-03-03 Items, Services and Non-Inventory Items

Workstream: `WS04-MASTER-DATA-PRODUCT`
Epic: `MD-03 Product Model, Items, Services and Non-Inventory Items`
Issue type: Training Item
Status: `blocked-by-product-model`

Business purpose:

Users need to understand the difference between inventory items, service items and non-inventory items before they create sales or purchase documents. The item type determines whether Business Central tracks stock, value, document behavior and later inventory entries.

Target roles:

- inventory/warehouse
- purchasing
- sales operations
- finance
- product data owner
- UAT testers
- training/book team

Customer/example data:

- simulated package: `UNIVERSAARL_MD_ItemsServices`
- inventory item: `SIM-ITEM-1000` / `U-ITEM-1000` / `Steel component set`
- service item: `SIM-SERV-1000` / `U-SERV-1000` / `Installation service`
- non-inventory item: `SIM-NONINV-1000` / `U-NONINV-1000` / `Printed manual package`
- negative training idea: `SIM-ITEM-ERR900`, parked and not used for normal setup

BC concept or process:

- item list and item card
- item type: inventory, service, non-inventory
- base unit of measure
- item category
- inventory posting group
- general product posting group
- VAT product posting group
- costing method
- product templates or configuration packages as scalable setup route

Exercise:

1. Classify each simulated product record as inventory, service, non-inventory or parked negative example.
2. Identify which fields affect stock, valuation, posting and VAT.
3. Mark all `TBD` setup values as blockers.
4. Decide whether the first product should be created manually for learning or by template/configuration package after UOM, posting and costing decisions.
5. Explain why a service line can be a valid product model but must not be taught as stock behavior.

Typical mistakes:

- treating all sellable things as inventory
- using a service or non-inventory item in an inventory valuation lesson
- creating item records before UOM, posting groups and costing method are understood
- using item setup to bypass missing finance foundation decisions
- importing a broad item list before one card route has been validated

Success check:

- The participant can explain inventory vs service vs non-inventory in plain language.
- The participant can identify which fields block first item creation.
- The participant can explain why item setup affects purchase, sales, inventory and ledger evidence.
- The participant can park a negative-training item instead of using it in normal UAT.

Escalation path:

- If UOM is unclear, escalate to `DEC-MD-UOM-001`.
- If item type or inventory boundary is unclear, escalate to `DEC-MD-PRODUCT-001`.
- If posting/VAT setup is missing, escalate to finance foundation.
- If costing or location/warehouse scope is unclear, park inventory process training.

Handbook/book output:

- handbook section: "Inventory item, service item or non-inventory item?"
- product data owner checklist
- beginner explanation of item type, UOM, posting groups and costing boundary
- warning that product records are not BC-setup-ready until foundation decisions are resolved

Source/evidence status:

- Official source support needed for item type and inventory behavior.
- Universaarl item/service/non-inventory list/card read-first proof is still needed.
- Current simulated data is Jira-ready but not BC-setup-ready.

UAT status:

- planned; blocked until UOM, product model, posting groups, VAT product groups, inventory posting and costing route are available

Playwright/evidence output:

- `PWS-MD-003` item/service/non-inventory list/card read-first proof
- later controlled create/reopen proof for one product type after dependencies
- evidence card separating product model concept, simulated records and actual setup

Realism note:

Product master data often exposes disagreements between sales, purchasing, warehouse and finance. A realistic training module should show that classification is a business decision, not a field-filling exercise.

Acceptance criteria:

- Module separates inventory, service and non-inventory behavior.
- All setup-sensitive fields are blocked or decision-linked.
- No inventory valuation, warehouse or posting claim is made before evidence exists.
