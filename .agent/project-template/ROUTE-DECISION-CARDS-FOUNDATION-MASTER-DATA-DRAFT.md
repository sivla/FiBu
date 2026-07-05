# Route Decision Cards - Foundation and Master Data Draft

Status: draft
Purpose: Decide the implementation route for the first Universaarl foundation dependencies before live Business Central setup or master-data creation.
Last reviewed: 2026-07-05

## Boundary

These are project decision cards, not execution instructions.

They do not authorize:

- Business Central writes
- Playwright live execution
- imports
- API shortcuts
- posting
- production claims

They define which route should be used later, what must be proven first and what a customer or consultant must understand.

## Source anchors

Official Microsoft Learn anchors used for these route decisions:

- Business Central setup overview: https://learn.microsoft.com/en-us/dynamics365/business-central/setup
- MB-800 study guide, core functionality and number series: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800
- Posting group setup: https://learn.microsoft.com/en-au/dynamics365/business-central/finance-posting-groups
- Purchasing setup, payables and number series context: https://learn.microsoft.com/en-au/dynamics365/business-central/purchasing-setup-purchasing
- Units of measure for items: https://learn.microsoft.com/en-us/dynamics365/business-central/inventory-how-setup-units-of-measure
- Import data with configuration packages: https://learn.microsoft.com/en-us/dynamics365/business-central/across-import-data-configuration-packages
- Company configuration packages and templates: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/set-up-standard-company-configuration-packages

Interpretation for this project:

- Posting groups are account-determination setup, not decorative codes.
- Number series are core setup and should be decided before repeated master-data or document creation.
- Units of measure are prerequisites for item setup.
- Configuration packages are realistic for scalable data entry, but they require validation before apply.
- Manual UI is still needed for learning, screenshots and first-card understanding.

## Decision status values

- `recommended`: route is the current recommended path for Universaarl.
- `needs-source`: product/source basis is not strong enough.
- `needs-sandbox-evidence`: needs read-first proof in `playthru`.
- `needs-customer-approval`: customer-like owner decision is missing.
- `parked`: not phase 1.

## RD-FOUND-001 Numbering policy for customers, vendors and items

Workstream: `WS03-FINANCE-FOUNDATION`, `WS04-MASTER-DATA-PRODUCT`
Decision owner: Adrian Vogt
Customer owner: Lena Hartmann / Pia Neumann / Tobias Brandt / Elena Fischer
Status: `recommended`

### Business problem

Universaarl needs repeatable identifiers for customers, vendors and items before master data can be created or imported. The numbering route must support training, screenshots, data requests, future imports and user understanding.

### Options considered

| Option | Fit | Pros | Cons | Verdict |
| --- | --- | --- | --- | --- |
| Use standard BC number series | high | Standard, scalable, avoids collisions, teaches real BC behavior | Requires setup proof and may hide visible training prefixes | recommended for real setup |
| Explicit fictional codes such as `U-CUST-*` | medium | Easy to read in book/training and simulated tables | May bypass normal number series learning if used blindly | use in planning tables; decide before live setup |
| Manual ad-hoc numbers | low | Fast for one-off test | Fragile, inconsistent, poor training pattern | reject |
| API/import-generated numbers | parked | Useful in migration/integration | Too early; hides user-facing setup | parked |

### Recommended Universaarl route

Use explicit fictional codes in planning tables, then decide in Business Central whether phase-1 setup uses BC number series with Universaarl prefixes or controlled manual numbering for the first learning records.

Preferred later live route:

1. Read-first proof of relevant setup pages in `playthru` / `UNIVERSAARL-DE`.
2. Decide customer/vendor/item numbering format.
3. Set or verify number series only through a gated setup case.
4. Use one manual learning record per object type only after number route is clear.
5. Use templates/configuration package for repeated records after validation.

### Customer/training explanation

Number series prevent users from inventing inconsistent IDs. A customer should understand when Business Central assigns the next number automatically and when a consultant uses a controlled visible prefix for training or migration.

### Evidence needed

- Read-first screenshot or result for relevant number series/setup context.
- Reopen proof after any later number-series change.
- One customer/vendor/item card showing assigned or entered number behavior.

### Stop conditions

- Active company is not `UNIVERSAARL-DE`.
- Number-series page or setup context is unclear.
- Existing number series would be overwritten without understanding impact.
- A code would collide with existing records.

### Book/handbook output

Explain number series as a control mechanism, not just a field. Show the difference between planning codes and live BC numbering.

## RD-FOUND-002 Posting group model before master data

Workstream: `WS03-FINANCE-FOUNDATION`, `WS04-MASTER-DATA-PRODUCT`
Decision owner: Eva Krueger
Customer owner: Jonas Weber / Lena Hartmann / Claudia Schulte
Status: `recommended`

### Business problem

Customers, vendors and items cannot support realistic posting scenarios unless posting groups and posting setup are understood. Posting groups map business objects and document lines to G/L accounts, so wrong or missing groups make later process evidence misleading.

### Options considered

| Option | Fit | Pros | Cons | Verdict |
| --- | --- | --- | --- | --- |
| Minimal phase-1 posting group set | high | Teachable, controlled, enough for first O2C/P2P/item scenarios | Needs careful boundary so it is not mistaken for complete design | recommended |
| Copy broad demo/legacy setup | low | Fast if available | Not Universaarl-specific, weak book value, may carry irrelevant assumptions | reject |
| Full production-grade matrix immediately | medium | More complete | Too much before process scope and tax review are stable | later |
| Park posting groups and create master data anyway | low | Allows card screenshots | Produces unusable or misleading master data | reject |

### Recommended Universaarl route

Create a minimal, source-backed and screenshot-proven posting group model before live master data:

- customer posting group for domestic receivables
- vendor posting group for domestic payables
- general business posting group for domestic business partners
- general product posting groups for goods, services and non-inventory use
- VAT business/product groups only after VAT boundary decision
- inventory posting group only when inventory setup is in scope

Do not call this a complete German posting model. It is a phase-1 Universaarl foundation for training and controlled sandbox processes.

### Customer/training explanation

Posting groups answer the question: "Which G/L account does Business Central use when this customer, vendor, item or document line is posted?" Users do not need to memorize every matrix row, but key users must know that wrong posting groups can send values to the wrong accounts.

### Evidence needed

- Read-first proof of posting group pages.
- Route decision linking each group to a simulated data need.
- Later before/after/reopen proof for any setup row.
- Later transaction proof before book claims about ledger results.

### Stop conditions

- Required G/L accounts do not exist or are incorrectly classified.
- VAT boundary is unclear for tax-sensitive rows.
- Matrix row purpose is not connected to a simulated customer/vendor/item scenario.
- Setup page or row context is ambiguous.

### Book/handbook output

Explain posting groups with one simple trace: master data -> document line -> posting setup -> G/L entries. Keep legal/tax finality out of this chapter until later proof exists.

## RD-FOUND-003 Payment terms and payment method route

Workstream: `WS03-FINANCE-FOUNDATION`, `WS04-MASTER-DATA-PRODUCT`, `WS05-PURCHASING-SOURCE-TO-PAY`, `WS06-SALES-ORDER-TO-CASH`
Decision owner: Eva Krueger
Customer owner: Lena Hartmann / Tobias Brandt / Pia Neumann
Status: `recommended`

### Business problem

Customers and vendors need payment terms before sales, purchase, receivables and payables scenarios become realistic. Vendors may also need a payment method, but real bank/payment data should stay gated.

### Options considered

| Option | Fit | Pros | Cons | Verdict |
| --- | --- | --- | --- | --- |
| Minimal payment terms such as 14D and 30D | high | Easy to teach, enough for due-date behavior | Requires setup proof | recommended |
| Use arbitrary text in master data without setup | low | Fast in table drafts | Blocks BC setup and training truth | reject |
| Add payment methods without bank/payment route | medium | Needed later for payables | Can imply payment readiness too early | split: payment terms now, payment methods gated |
| Full payment process setup now | low | Complete | Too early before bank/payment scope and UAT | later |

### Recommended Universaarl route

Decide and prove two payment terms first:

- `14D` for short-term domestic examples
- `30D` for standard domestic examples

Payment methods should be planned but not treated as payment-ready until bank/payment workstream decisions exist. Vendor simulated data may show `TBD-BANK`, but no real bank data belongs in the planning table.

### Customer/training explanation

Payment terms affect due dates and cash-flow expectations. They are everyday fields for finance, sales and purchasing users. Payment method is different: it affects how payment is prepared or proposed and needs stronger controls.

### Evidence needed

- Read-first proof of payment terms page or setup context.
- Reopen proof after any later payment-term creation/change.
- Customer/vendor card showing selected payment terms.
- Later document proof showing due date behavior.

### Stop conditions

- Payment term date formula behavior is unclear.
- Payment method would imply a real payment/bank setup that is not approved.
- User tries to store real bank details in simulated project files.

### Book/handbook output

Explain payment terms early in master data chapters. Park bank/payment execution for a later bank/payments chapter.

## RD-FOUND-004 Product setup route: UOM, product posting groups and item loading

Workstream: `WS04-MASTER-DATA-PRODUCT`, `WS07-INVENTORY-COSTING-STOCK`
Decision owner: Felix Roth
Customer owner: Elena Fischer / Tobias Brandt / Pia Neumann / Claudia Schulte
Status: `recommended`

### Business problem

Items, services and non-inventory items must be distinguishable before purchase, sales and inventory processes are meaningful. Item setup depends on units of measure, product posting groups, VAT product groups and, for inventory items, costing and inventory posting setup.

### Options considered

| Option | Fit | Pros | Cons | Verdict |
| --- | --- | --- | --- | --- |
| Manual setup for one learning item/service/non-inventory example | high | Best for book, screenshots and user understanding | Does not scale | recommended for first examples |
| Configuration package or Excel-assisted package for repeated items | high | Realistic for scale, validates data before apply | Needs template and dependency readiness | recommended after first examples |
| API route | medium | Useful for integration projects | Too early for customer handbook and setup learning | parked |
| Create inventory items before posting/costing decisions | low | Fast card screenshots | Misleading and blocks later process proof | reject |

### Recommended Universaarl route

Phase the product setup:

1. Define units of measure such as `PCS` and `HOUR`.
2. Define product posting group needs for goods, services and non-inventory.
3. Define VAT product group boundary separately.
4. For inventory item `U-ITEM-1000`, wait for inventory posting setup and costing assumptions.
5. Create one manual item/service/non-inventory example only after dependencies are visible and approved.
6. Use configuration package or Excel-assisted package for a larger list after route validation.

### Customer/training explanation

An item card is not just a name and number. Type, unit of measure, posting groups and costing choices decide whether BC treats the record as stock, service or non-inventory usage. Users must understand this before document lines and inventory results make sense.

### Evidence needed

- Read-first proof of Units of Measure and Item Card relevant fields.
- Reopen proof for any later UOM/item setup.
- Item card screenshot showing type, base UOM and posting-group fields.
- Later ledger/value-entry proof before inventory valuation claims.

### Stop conditions

- Base UOM does not exist.
- Product posting groups or VAT product groups are unclear.
- Inventory posting setup is missing for inventory item scenarios.
- Costing method is assumed without source, customer decision or evidence.

### Book/handbook output

Explain the three product concepts separately: inventory item, service and non-inventory item. Show why a customer should not treat every sales or purchase line as the same kind of master data.

## Route dependency map

| Dependency | Unlocks | Must happen before | Recommended route |
| --- | --- | --- | --- |
| Numbering policy | customer/vendor/item creation | repeated master-data setup | read-first proof, then gated setup |
| Posting groups | usable customers/vendors/items | O2C/P2P/item scenarios | minimal phase-1 model |
| VAT group boundary | tax-sensitive master data and documents | VAT setup and transaction claims | source/customer review first |
| Payment terms | customer/vendor due-date behavior | sales/purchase document examples | minimal terms first |
| Payment method | vendor payment readiness | payment scenario | gated later |
| Units of measure | item setup | item creation | create/verify UOM before items |
| Product posting groups | item/service/non-inventory postings | item setup | minimal phase-1 model |
| Inventory posting setup | inventory value evidence | inventory item process | later inventory workstream gate |

## Next recommended project work

1. Add these route decisions to the decision log as summarized accepted/proposed entries.
2. Create Playwright scenario catalog entries for read-first validation of number series, posting groups, payment terms, UOM and item-card context.
3. Create training module cards for customer/vendor/item master data using these route boundaries.
4. Keep BC live setup paused until a specific gated setup case is selected.
