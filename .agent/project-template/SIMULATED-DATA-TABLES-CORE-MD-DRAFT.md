# Simulated Data Tables - Core and Master Data Draft

Status: draft
Purpose: First simulated customer data tables for Universaarl core context and master-data planning.
Last reviewed: 2026-07-05

## Boundary

These tables are fictional planning data for the Universaarl case study. They are not import files and do not authorize Business Central setup.

Use them to:

- test whether data requests are understandable
- identify missing fields before live setup
- plan Jira tickets, UAT scenarios, training exercises and book examples
- decide whether manual UI, templates, configuration packages, Excel import, API or park route is appropriate

Do not use them to:

- claim production-ready customer data
- claim tax or legal approval
- create Business Central records without a later gated setup case
- store real customer, contact, bank or credential data

## Validation status values

- `complete-for-planning`: enough to design a route, not necessarily enough for BC setup.
- `needs-review`: plausible but needs consultant/customer review.
- `blocked`: cannot drive setup until missing dependencies are resolved.
- `parked`: useful later, not phase 1.

## CORE-001 Company Information

Source data request: `DR-CORE-001`
Customer owner: Jonas Weber
Internal owner: Adrian Vogt / Eva Krueger
Validation status: `needs-review`
BC usage: Company Information, accounting-period context, training and book introduction.

| Field | Simulated value | Validation status | Notes |
| --- | --- | --- | --- |
| LegalName | Universaarl GmbH | complete-for-planning | Fictional legal entity for the case study. |
| TargetCompanyCode | UNIVERSAARL-DE | complete-for-planning | First German foundation company in `playthru`. |
| CountryRegion | DE | complete-for-planning | Drives German localization boundary. |
| LocalCurrency | EUR | complete-for-planning | Phase-1 local currency. |
| PrimaryLanguage | de-DE | complete-for-planning | Training/book language context. |
| FiscalYearStart | 2026-01-01 | needs-review | Must be confirmed before accounting-period setup. |
| VATRegistrationContext | German domestic VAT context | needs-review | Review input only; not tax approval. |
| ManagementOwner | Mara Stein | complete-for-planning | Fictional sponsor. |
| FinanceOwner | Jonas Weber | complete-for-planning | Fictional CFO/finance sign-off. |
| ITOwner | Sami Yilmaz | complete-for-planning | Fictional M365/BC access owner. |
| TrainingOwner | Julia Meier | complete-for-planning | Fictional training coordinator. |
| DataQualityNote | Tax wording and fiscal year need review | needs-review | Create follow-up before final book/setup claim. |

Follow-up questions:

- Should the fiscal year start remain January 1 for the first book volume?
- Which company information fields should remain blank until a final customer-like decision exists?
- Which VAT registration wording can be shown safely as fictional/training data?

## CORE-002 Organization Model

Source data request: `DR-CORE-002`
Customer owner: Claudia Schulte / Sami Yilmaz
Internal owner: Adrian Vogt / Sarah Klein
Validation status: `needs-review`
BC usage: dimensions, locations, roles, reporting and training audiences.

| OrganizationValue | DisplayName | Classification | Phase | Owner | BC candidate | Validation status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FIN | Finance | dimension candidate | phase 1 | Lena Hartmann | Department dimension | complete-for-planning | Needed for finance training and reporting examples. |
| PUR | Purchasing | dimension candidate | phase 1 | Tobias Brandt | Department dimension | complete-for-planning | Needed for P2P scenarios. |
| SAL | Sales | dimension candidate | phase 1 | Pia Neumann | Department dimension | complete-for-planning | Needed for O2C scenarios. |
| INV | Inventory | dimension candidate | phase 1 | Elena Fischer | Department dimension | complete-for-planning | Needed for inventory training and stock ownership. |
| ADM | Administration | role group | phase 1 | Sami Yilmaz | permission/training audience | needs-review | May be role group, not dimension. |
| SAAR-HQ | Saarland headquarters | site/location | phase 1 | Mara Stein | location/site context | needs-review | Physical site; BC Location only if inventory/storage use is defined. |
| SAAR-WH | Main warehouse | site/location | phase 1 | Elena Fischer | possible BC Location | needs-review | Needs inventory/warehouse design before setup. |
| SERVICE | Service operations | business unit | later | Mara Stein | parked | parked | Useful when Service Management scope is unlocked. |
| HOLDING | Holding/management view | reporting-only | later | Jonas Weber | parked | parked | Do not create as company without legal/intercompany decision. |

Follow-up questions:

- Which values are true dimensions versus role groups?
- Is `SAAR-WH` only a physical site now or a phase-1 BC Location?
- Which values should remain parked until intercompany, service or advanced reporting is in scope?

## MD-001 Customers

Source data request: `DR-MD-001`
Customer owner: Pia Neumann / Lena Hartmann
Internal owner: Felix Roth / Eva Krueger / Milena Brand
Validation status: `blocked`
BC usage: customer card, sales documents, customer ledger entries, O2C training.

| CustomerNo | Name | CountryRegion | CustomerPostingGroup | GenBusPostingGroup | VATBusPostingGroup | PaymentTerms | Currency | ScenarioPurpose | Validation status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U-CUST-10000 | Saarland Maschinenbau GmbH | DE | TBD-CUSTOMER | TBD-INLAND | TBD-INLAND | TBD-14D | EUR | simple B2B sales order and payment training | blocked | Needs posting groups, VAT group and payment terms. |
| U-CUST-10010 | Mosel Retail Partner KG | DE | TBD-CUSTOMER | TBD-INLAND | TBD-INLAND | TBD-30D | EUR | customer with delivery/address variation | blocked | Useful after customer template decision. |
| U-CUST-ERR90 | Incomplete Training Customer | DE | missing | missing | missing | missing | EUR | training error: incomplete master data | parked | Use later to teach validation, not for setup now. |

Follow-up questions:

- Which numbering route is used: number series or explicit `U-CUST-*` values?
- Which customer posting group is valid for phase 1?
- Which payment terms should exist before customer setup?
- Which VAT business groups are needed for domestic phase-1 sales?

Route note:

Create one customer manually for book/training only after finance dependencies exist. Use templates or configuration package for repeated customers after validation.

## MD-002 Vendors

Source data request: `DR-MD-002`
Customer owner: Tobias Brandt / Lena Hartmann
Internal owner: Felix Roth / Eva Krueger / Milena Brand
Validation status: `blocked`
BC usage: vendor card, purchase documents, vendor ledger entries, payment and P2P training.

| VendorNo | Name | CountryRegion | VendorPostingGroup | GenBusPostingGroup | VATBusPostingGroup | PaymentTerms | PaymentMethod | ScenarioPurpose | Validation status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U-VEND-20000 | Saarstahl Komponenten GmbH | DE | TBD-VENDOR | TBD-INLAND | TBD-INLAND | TBD-14D | TBD-BANK | material purchase training | blocked | No real bank data; payment method dependency open. |
| U-VEND-20010 | IT Services Saar GmbH | DE | TBD-VENDOR | TBD-INLAND | TBD-INLAND | TBD-30D | TBD-BANK | service purchase training | blocked | Useful for non-inventory/service expense scenario. |
| U-VEND-FA10 | Anlagenbau Homburg GmbH | DE | TBD-VENDOR | TBD-INLAND | TBD-INLAND | TBD-30D | TBD-BANK | later fixed-asset purchase candidate | parked | Do not use until fixed-asset route is unlocked. |

Follow-up questions:

- Which vendor posting group is valid for phase 1?
- Which payment method should be trained without real bank data?
- Which vendor is the first manual training example?
- Which vendors should be loaded by template/configuration package later?

Route note:

Create one vendor manually for book/training only after posting groups, VAT groups, payment terms and payment method are clear. Keep bank data out of the first simulated table.

## MD-003 Items, Services and Non-Inventory Items

Source data request: `DR-MD-003`
Customer owner: Elena Fischer / Tobias Brandt / Pia Neumann / Claudia Schulte
Internal owner: Felix Roth / Eva Krueger / Milena Brand
Validation status: `blocked`
BC usage: item card, sales/purchase lines, inventory/value entries, product training.

| ItemNo | Description | Type | BaseUOM | ItemCategory | InventoryPostingGroup | GenProdPostingGroup | VATProdPostingGroup | CostingMethod | ScenarioPurpose | Validation status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U-ITEM-1000 | Steel component set | Inventory | PCS | COMPONENTS | TBD-INVENTORY | TBD-GOODS | TBD-VAT19 | FIFO | purchase, receipt, sale and inventory training | blocked | Needs UOM, posting groups, costing and inventory setup. |
| U-SERV-1000 | Installation service | Service | HOUR | SERVICES | n/a | TBD-SERVICE | TBD-VAT19 | n/a | service sales/purchase example | blocked | No inventory valuation claim. |
| U-NONINV-1000 | Printed manual package | Non-Inventory | PCS | SUPPLIES | n/a | TBD-NONINV | TBD-VAT19 | n/a | non-inventory document-line example | blocked | Useful to contrast with inventory item. |
| U-ITEM-ERR900 | Incomplete item training record | Inventory | missing | missing | missing | missing | missing | missing | training error: blocked item setup | parked | Do not create casually; later error-handling scenario only. |

Follow-up questions:

- Which base units of measure should be created first?
- Which product posting groups are needed for goods, services and non-inventory items?
- Which inventory posting group and inventory setup are required before stock scenarios?
- Which item should be the first manual training example?

Route note:

Use manual item creation for one learning record only after dependencies are clear. Use configuration package or Excel-assisted package for larger item lists after template and validation rules are approved.

## Cross-table readiness

| Dependency | Status | Impact |
| --- | --- | --- |
| Company context | planned | Must be proven in `playthru` / `UNIVERSAARL-DE` before live setup. |
| Numbering policy | open | Blocks customer, vendor and item setup route. |
| Posting groups | open | Blocks realistic customers, vendors and items. |
| VAT groups | open | Blocks tax-sensitive master data and document scenarios. |
| Payment terms/methods | open | Blocks customer/vendor usability. |
| Units of measure | open | Blocks item setup. |
| Inventory posting setup | open | Blocks inventory item evidence. |
| Tax advisor review boundary | open | Blocks final tax/compliance claims. |

## Next project use

1. Convert these tables into Jira-linked data request pages or simulated spreadsheet files.
2. Add route decision cards for numbering, posting groups, payment terms and product posting setup.
3. Create Playwright scenario catalog entries for read-first validation of Company Information, customer cards, vendor cards and item cards.
4. Use the tables for book/training examples only with clear labels: fictional, simulated and not production-ready.
