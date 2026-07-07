# Customer Data Simulation Draft

Status: draft
Purpose: Simulated customer data flow for making the Universaarl book/project realistic.
Last reviewed: 2026-07-05

## Principle

The project should show how consultants request, receive, review and use customer data. The data is fictional but must behave like real project input.

Always label it:

```text
Simulated customer data for the Universaarl case study.
```

## Data flow

```text
Data Request
  -> Customer sends file/table
  -> Consultant validates completeness and quality
  -> Questions go back to customer
  -> Accepted data is mapped to BC
  -> Implementation route is chosen
  -> BC result is validated
  -> UAT/training/book outputs are updated
```

## Request package structure

Each customer request should include:

- purpose
- owner
- due date
- file/template name
- required columns
- optional columns
- example row
- validation rules
- what happens in BC
- training/book usage

## Simulated package set

### Package CORE-001: Company information

Requested from:

- CFO
- project sponsor

Suggested file:

```text
UNIVERSAARL_CORE_CompanyInformation.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| LegalName | Universaarl GmbH | yes | Used for company information and book case study. |
| CountryRegion | DE | yes | Drives localization assumptions. |
| LocalCurrency | EUR | yes | Phase-1 currency. |
| FiscalYearStart | 2026-01-01 | yes | Used for accounting periods. |
| PrimaryLanguage | de-DE | yes | User/book context. |
| VATRegistrationContext | German domestic VAT | yes | Not a final tax validation. |

Consultant review:

- Is the legal entity clear?
- Is phase-1 country scope clear?
- Is fiscal year known?
- Is any tax/legal detail missing?

BC usage:

- company information
- accounting periods
- book introduction
- evidence labels

### Package CORE-002: Organization model

Suggested file:

```text
UNIVERSAARL_CORE_OrganizationModel.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| DepartmentCode | FIN | yes | Candidate dimension value. |
| DepartmentName | Finance | yes | Training and role mapping. |
| CostCenterCode | CC-FIN-01 | no | Candidate dimension value. |
| LocationCode | SAAR-HL | yes | Location/site context. |
| ResponsibleRole | Finance Key User | yes | UAT/training owner. |

Consultant review:

- Are departments stable enough for dimensions?
- Are locations physical, reporting-only or both?
- Which values are phase 1?

BC usage:

- dimensions
- users/roles
- reporting
- training matrix

### Package FIN-001: Chart of accounts

Suggested file:

```text
UNIVERSAARL_FIN_ChartOfAccounts.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| AccountNo | 1140 | yes | SKR04-oriented starter account. |
| AccountName | Waren (Bestand) | yes | Book and BC UI. |
| AccountType | Posting | yes | Prevents wrong use of headings/totals. |
| IncomeBalance | Balance Sheet | yes | Must match account purpose. |
| AccountCategory | Assets | no | Reporting support. |
| DirectPosting | true | yes | Depends on use. |
| Blocked | false | yes | Migration/setup readiness. |

Consultant review:

- Is this a full customer COA or starter scope?
- Which accounts are needed before posting groups?
- Which accounts require tax advisor/accounting review?

BC usage:

- chart of accounts
- posting group setup
- reporting
- finance training

### Package FIN-002: Posting group inputs

Suggested file:

```text
UNIVERSAARL_FIN_PostingGroups.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| PostingArea | Customer | yes | Customer, Vendor, General, Inventory, VAT. |
| GroupCode | INLAND | yes | Code in BC. |
| Description | Domestic customers | yes | Training/book clarity. |
| MainAccount | 1400 | conditional | Depends on posting area. |
| RevenueAccount | 4400 | conditional | General Posting Setup. |
| ExpenseAccount | 5400 | conditional | Purchase flow. |
| InventoryAccount | 1140 | conditional | Inventory Posting Setup. |

Consultant review:

- Are accounts present in chart of accounts?
- Are groups too broad or too detailed?
- Which matrix rows are phase 1?

BC usage:

- customer/vendor posting groups
- general posting setup
- inventory posting setup
- VAT setup dependency

### Package FIN-003: VAT assumptions

Suggested file:

```text
UNIVERSAARL_FIN_VATSetupAssumptions.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| VATBusinessGroup | INLAND | yes | Business side. |
| VATProductGroup | VAT19 | yes | Product/service side. |
| VATPercent | 19 | yes | Product claim requires source/boundary. |
| VATAccountSales | 1776 | conditional | Example only until reviewed. |
| VATAccountPurchase | 1576 | conditional | Example only until reviewed. |
| Scenario | Domestic standard goods | yes | UAT and book context. |
| NeedsTaxReview | true | yes | Boundary flag. |

Consultant review:

- Is this product setup or legal/tax claim?
- Which scenarios are in phase 1?
- Is tax advisor validation needed?

BC usage:

- VAT posting setup
- transaction tests
- book boundary notes

### Package FIN-004: Dimensions

Suggested file:

```text
UNIVERSAARL_FIN_Dimensions.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| DimensionCode | DEPARTMENT | yes | Candidate global dimension. |
| DimensionValueCode | FIN | yes | Dimension value. |
| DimensionValueName | Finance | yes | Reader/user clarity. |
| MandatoryFor | G/L journals | no | Default dimension rule candidate. |
| Blocked | false | yes | Data quality. |

Consultant review:

- Which dimensions are global?
- Which are shortcut dimensions?
- Which are default dimensions later?
- Are any dimensions actually locations, projects or cost centers?

BC usage:

- dimensions
- reporting
- master data defaults
- UAT filters

### Package MD-001: Customers

Suggested file:

```text
UNIVERSAARL_MD_Customers.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| CustomerNo | U-CUST-100 | yes | Or blank if number series assigns. |
| Name | Saarland Klinikum GmbH | yes | Fictional example. |
| CountryRegion | DE | yes | VAT/shipping context. |
| CustomerPostingGroup | INLAND | yes | Finance dependency. |
| GenBusPostingGroup | INLAND | yes | Posting setup dependency. |
| VATBusPostingGroup | INLAND | yes | VAT setup dependency. |
| PaymentTermsCode | 14D | yes | Receivables process. |
| CurrencyCode |  | no | Blank for local currency. |

Consultant review:

- Are posting groups valid?
- Are payment terms agreed?
- Is the customer active or test-only?

BC usage:

- sales process
- customer ledger
- UAT and training

### Package MD-002: Vendors

Suggested file:

```text
UNIVERSAARL_MD_Vendors.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| VendorNo | U-VEND-100 | yes | Or blank if number series assigns. |
| Name | SaarTech Supplies GmbH | yes | Fictional example. |
| CountryRegion | DE | yes | VAT/payment context. |
| VendorPostingGroup | INLAND | yes | Finance dependency. |
| GenBusPostingGroup | INLAND | yes | Posting setup dependency. |
| VATBusPostingGroup | INLAND | yes | VAT setup dependency. |
| PaymentTermsCode | 14D | yes | Payables process. |
| PaymentMethodCode | BANK | no | Payment process. |

Consultant review:

- Are vendor bank/payment details in scope?
- Are posting groups valid?
- Is this vendor needed for first purchasing UAT?

BC usage:

- purchasing process
- vendor ledger
- UAT and training

### Package MD-003: Items, services and non-inventory items

Suggested file:

```text
UNIVERSAARL_MD_Items.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| ItemNo | U-ITEM-HW100 | yes | Or blank if number series assigns. |
| Description | Steuerbox Standard U100 | yes | Simulated Universaarl product; German handbook/training name. |
| Type | Inventory | yes | Inventory, Service, Non-Inventory. |
| BaseUnitOfMeasure | STK | yes | Unit dependency; aligns with the visible German playthru item signal. |
| InventoryPostingGroup | WARE | conditional | Inventory items only. |
| GenProdPostingGroup | WARE | yes | General posting setup. |
| VATProdPostingGroup | VAT19 | yes | VAT setup. |
| CostingMethod | FIFO | conditional | Inventory items. |
| UnitCost | 100.00 | conditional | Inventory/value examples. |
| UnitPrice | 149.00 | no | Sales examples. |

Consultant review:

- Is this an inventory item, service or non-inventory item?
- Are units and posting groups ready?
- Is costing method a phase-1 decision?

BC usage:

- item master
- purchasing
- sales
- inventory valuation
- warehouse if in scope

### Package INV-001: Opening inventory

Suggested file:

```text
UNIVERSAARL_INV_OpeningInventory.xlsx
```

Required columns:

| Field | Example | Required | Notes |
| --- | --- | --- | --- |
| ItemNo | U-ITEM-HW100 | yes | Must exist or be import-ready. |
| LocationCode | SAAR-HL | yes | Location must exist. |
| Quantity | 25 | yes | Opening stock. |
| UnitCost | 100.00 | yes | Valuation. |
| ValuationDate | 2026-01-01 | yes | Opening basis. |
| SourceReference | Legacy stock report | yes | Traceability. |

Consultant review:

- Are item/location/setup dependencies ready?
- Are quantity and value reconciled?
- Is opening inventory in scope for simulated cutover?

BC usage:

- item journal
- value entries
- inventory valuation
- UAT and cutover rehearsal

## Data quality statuses

- `received-clean`
- `received-needs-cleanup`
- `missing-required-fields`
- `blocked-by-decision`
- `accepted-for-sandbox`
- `accepted-for-book-example`
- `rejected`
- `parked`

## Example customer reply pattern

Use this style in book/project narration:

```text
The customer returns the first finance data package. The chart of accounts includes the minimum accounts required for the starter finance foundation, but the VAT accounts are marked as needing tax-advisor review. The consultant accepts the account list for sandbox setup and opens a decision record for the VAT boundary.
```

## Next refinement

Create actual CSV/XLSX sample files only after the project agrees which first process path should be simulated end-to-end:

- finance foundation only
- first customer/vendor/item
- first purchase scenario
- first sales scenario
- first inventory opening scenario
