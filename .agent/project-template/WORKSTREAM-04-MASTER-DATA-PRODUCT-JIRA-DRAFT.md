# WS04 Master Data Product Jira Draft

Status: draft
Purpose: Jira-faehige Ausarbeitung fuer Universaarl-Stammdaten, Produktmodell, Templates, Datenqualitaet und skalierbare Anlagewege.
Last reviewed: 2026-07-05

## Workstream summary

`WS04-MASTER-DATA-PRODUCT` definiert die Stammdaten, die spaeter Verkauf, Einkauf, Lager, Zahlungen, Reporting, UAT und Buchkapitel tragen. Der Workstream behandelt Kunden, Lieferanten, Artikel, Services, Nichtlagerartikel, Lagerorte, Einheiten, Kategorien, Preise, Zahlungsbedingungen, Templates und Datenqualitaet.

Dieser Workstream ist kein sofortiger Live-Import. Er entscheidet zuerst, welche Daten fachlich benoetigt werden, welche Felder zwingend sind, welche Einrichtung aus `WS03-FINANCE-FOUNDATION` vorausgesetzt wird und ob manuelle UI-Anlage, Templates, Konfigurationspakete, Excel-Import, API oder Parken der beste Weg ist.

## Source anchors

- Microsoft Learn: [Register new customers by creating a Customer Card](https://learn.microsoft.com/en-us/dynamics365/business-central/sales-how-register-new-customers)
- Microsoft Learn: [Register a new vendor](https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-how-register-new-vendors)
- Microsoft Learn: [Create item cards for goods or services](https://learn.microsoft.com/en-au/dynamics365/business-central/inventory-how-register-new-items)
- Microsoft Learn: [Use Excel to import data with configuration packages](https://learn.microsoft.com/en-au/dynamics365/business-central/across-import-data-configuration-packages)
- Microsoft Learn: [Set up company configuration packages](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/set-up-standard-company-configuration-packages)
- Microsoft Learn training path: [Configure Sales and Purchasing in Business Central](https://learn.microsoft.com/en-us/training/paths/configure-sales-purchasing-business-central/)

Interpretation for this project:

- Manual cards are needed for learning, screenshots and field understanding.
- Templates help keep repeated customer/vendor/item creation consistent.
- Configuration packages or Excel-based imports are candidates for realistic bulk setup.
- API/AL routes are not first choice for the book unless a later case explicitly needs them.
- Every import route needs UI validation, error review and rollback/cleanup/keep strategy.

## Workstream outcomes

- Universaarl has a realistic master-data model instead of isolated test records.
- Each planned customer, vendor, item, service and location has a book purpose and process purpose.
- Required finance dependencies are explicit before live creation.
- Manual UI examples and scalable setup/import routes are both represented.
- Customer data requests are ready to become Jira issues.
- Playwright scenarios can prove page context, templates, required fields, saved values and list/card reopen checks.
- Training output explains what normal users, key users and admins must know.
- Book output explains master data as business meaning, not just card fields.

## Epic MD-01: Customer Master Data

### Story: Discover customer data requirements

Issue type: Data Request
Business purpose: Customers drive O2C, receivables, payments, reporting and customer training.
Customer data: `DR-MD-001 Customers`
Implementation route: collect and validate data locally before live creation.
Source/evidence: customer data catalog, Microsoft Learn customer-card guidance, future Universaarl card evidence.
Risk: Customer records without posting groups, payment terms or tax context cannot support realistic sales processes.
Training/book output: explain customer card purpose, key fields, payment terms, posting groups and contact/address data.
Playwright/UAT output: future customer-card creation or read-only preflight scenario.

Acceptance criteria:

- Customer number policy is clear: number series or explicit `U-CUST-*` values.
- Required fields include name, address/country, posting groups, payment terms, VAT/tax context where relevant and contact data.
- Customers are mapped to O2C, payments, reporting or error-handling purpose.
- Missing posting groups, VAT groups or payment terms block live creation.

### Story: Decide customer setup route

Issue type: Decision
Business purpose: The project needs a route that is explainable to beginners and scalable for a real company.
Customer data: accepted customer list and setup dependencies.
Implementation route: compare manual Customer Card, customer templates, configuration package/Excel import, API and park route.
Source/evidence: Microsoft Learn customer-card and template guidance.
Risk: Bulk import can hide bad data; manual creation does not scale.
Training/book output: explain when to create one customer manually and when to use import/templates.
Playwright/UAT output: one manual example scenario plus later import validation scenario if chosen.

Acceptance criteria:

- At least one manual customer path is planned for book/training.
- Bulk route is parked until required templates and posting setup are available.
- No customer is created without company context and after-state reopen proof.

## Epic MD-02: Vendor Master Data

### Story: Discover vendor data requirements

Issue type: Data Request
Business purpose: Vendors drive P2P, payables, payment proposals, fixed assets, services and purchasing training.
Customer data: `DR-MD-002 Vendors`
Implementation route: collect and validate vendor data before live creation.
Source/evidence: customer data catalog, Microsoft Learn vendor-card guidance, future Universaarl card evidence.
Risk: Vendor records without posting groups, payment terms or payment method cannot support purchase/payment scenarios.
Training/book output: explain vendor card, payable account determination, payment terms, payment method and purchasing address.
Playwright/UAT output: future vendor-card creation or read-only preflight scenario.

Acceptance criteria:

- Vendor number policy is clear: number series or explicit `U-VEND-*` values.
- Required fields include name, address/country, posting groups, payment terms, payment method where in scope and contact data.
- Vendors are mapped to purchasing, payments, fixed assets, services or error diagnosis.
- Bank/payment details are excluded unless a later payment/bank case explicitly unlocks them.

### Story: Decide vendor setup route

Issue type: Decision
Business purpose: Vendor creation must balance training clarity and realistic data loading.
Customer data: accepted vendor list and setup dependencies.
Implementation route: compare manual Vendor Card, vendor templates, configuration package/Excel import, API and park route.
Source/evidence: Microsoft Learn vendor-card and template guidance.
Risk: Importing vendors before finance setup is ready creates unusable or misleading records.
Training/book output: explain one vendor manually and then show why templates/imports matter.
Playwright/UAT output: one manual example scenario plus import validation path if chosen.

Acceptance criteria:

- At least one manual vendor path is planned for book/training.
- Bulk route waits for vendor posting group, general business posting group, VAT business posting group and payment terms.
- Vendor creation does not include real bank data.

## Epic MD-03: Product Model, Items, Services and Non-Inventory Items

### Story: Classify product and service data

Issue type: Data Request
Business purpose: Items and services decide whether later processes affect inventory, value entries, sales, purchase or service flows.
Customer data: `DR-MD-003 Items, services and non-inventory items`
Implementation route: classify locally before live item creation.
Source/evidence: customer data catalog, Universaarl dataset blueprint, Microsoft Learn item-card guidance.
Risk: Treating services, non-inventory items and inventory items as the same object hides important BC behavior.
Training/book output: explain item type, base unit, costing method, posting groups and when stock is tracked.
Playwright/UAT output: future item-card and item-list scenario with type, posting groups and reopen proof.

Acceptance criteria:

- Each product is classified as inventory, service or non-inventory.
- Required fields include item no., description, type, base unit, general product posting group, VAT product posting group and inventory posting group where relevant.
- Inventory items include costing method and unit-cost assumption or explicit park reason.
- Service/non-inventory items do not claim inventory valuation.

### Story: Decide item setup route

Issue type: Decision
Business purpose: Product setup must be understandable but also realistic for multiple product families.
Customer data: accepted item/service catalog.
Implementation route: compare manual Item Card, copy existing item, item templates, configuration package/Excel import, API and park route.
Source/evidence: Microsoft Learn item-card guidance and configuration-package guidance.
Risk: Item import without posting/costing decisions breaks later O2C/P2P/Inventory evidence.
Training/book output: explain one item manually and show when templates/imports are safer.
Playwright/UAT output: one manual item scenario plus list/card reopen validation; package validation later if chosen.

Acceptance criteria:

- At least one item can be explained manually.
- Item bulk route waits for unit, posting group, costing and inventory dependencies.
- Error item `U-ITEM-ERR900` remains gated and is not created casually.

## Epic MD-04: Locations, Units, Categories and Supporting Master Data

### Story: Define location and warehouse boundary

Issue type: Story
Business purpose: Locations are needed for inventory, but full warehouse setup should not be mixed into first master-data creation.
Customer data: organization model and location/site data.
Implementation route: simple location model first; advanced warehouse fields only in later warehouse workstream.
Source/evidence: Universaarl dataset blueprint, future location-card evidence.
Risk: Enabling warehouse logic too early makes basic inventory examples harder for beginners.
Training/book output: explain location as where inventory is held, separate from warehouse processes such as bins/pick/put-away.
Playwright/UAT output: location-card read/create scenario only after scope decision.

Acceptance criteria:

- Initial locations are limited to 2-3 business-purpose locations such as main warehouse, QA and service stock.
- Each location has a process reason and book screenshot purpose.
- Advanced warehouse flags are parked unless WS08 explicitly unlocks them.

### Story: Define units, categories, attributes and variants

Issue type: Story
Business purpose: Items need consistent units and classification before documents and inventory entries become meaningful.
Customer data: item/service catalog and product family assumptions.
Implementation route: plan locally; write only through later gated setup or item scenario.
Source/evidence: Microsoft Learn item guidance, future item/category evidence.
Risk: Overcomplicated categories/variants distract from first book volume; missing units block item creation.
Training/book output: explain base unit of measure, categories, attributes and when variants are helpful.
Playwright/UAT output: future read-only/preflight evidence for visible fields on item card/list.

Acceptance criteria:

- Base units are mandatory for item planning.
- Categories and attributes are planned only where they improve search/filter/training.
- Variants are parked unless a real product-family reason exists.

## Epic MD-05: Prices, Discounts, Terms and Commercial Conditions

### Story: Define phase-1 commercial conditions

Issue type: Story
Business purpose: Sales and purchasing examples need terms and prices, but full pricing complexity can come later.
Customer data: payment terms, price assumptions, purchase costs, sales prices, discount policy.
Implementation route: local decision first; live pricing setup only after customer/vendor/item dependencies exist.
Source/evidence: Microsoft Learn sales/purchasing setup path, future price/discount evidence.
Risk: Price and discount setup can become a distraction before core master data is stable.
Training/book output: explain where price/cost appears, what is a term, and when discounts matter.
Playwright/UAT output: future document-line scenario validates price/cost behavior.

Acceptance criteria:

- Payment terms are required for first customer/vendor examples.
- Initial sales price and purchase cost are simple assumptions, not a full pricing model.
- Discounts, special prices and price lists are later scope unless needed for first process evidence.

## Epic MD-06: Templates, Configuration Packages and Data Quality

### Story: Decide master-data loading strategy

Issue type: Decision
Business purpose: A real implementation should not manually click dozens of records when a controlled package/import route is safer.
Customer data: accepted customer/vendor/item/location data and validation rules.
Implementation route: manual example for understanding; template/package/import for scale when dependencies are ready.
Source/evidence: Microsoft Learn configuration packages and customer/vendor/item template guidance.
Risk: Configuration packages can apply bad defaults quickly; manual entry can be slow and inconsistent.
Training/book output: explain route choice: manual learning record, template consistency and import validation.
Playwright/UAT output: package/import validation scenario with error review, not blind apply.

Acceptance criteria:

- Route matrix exists for customer, vendor, item, location and supporting data.
- Import route requires dry-run/readiness, field mapping, validation, package errors review and UI reopen proof.
- API is parked unless a later case explicitly justifies it.
- Cleanup/keep strategy is decided before bulk apply.

### Story: Define master-data quality gates

Issue type: Task
Business purpose: Master data must be usable in documents, postings, reports and training.
Customer data: all MD data packages.
Implementation route: local quality gate now; live validation later.
Source/evidence: data catalog, dataset blueprint, future Universaarl evidence.
Risk: Incomplete master data causes process blockers that look like UI or Playwright failures.
Training/book output: checklist for key users before data is accepted.
Playwright/UAT output: data-quality validation checks in future scenarios.

Acceptance criteria:

- Every master-data package has owner, purpose, required fields, dependencies, validation rule and BC usage.
- Records missing posting group, VAT group, unit, terms or setup dependency are rejected or parked.
- Test/error records are explicitly labeled and not used as normal process data.

## Epic MD-07: Book, Training and UAT for Master Data

### Story: Create master-data chapter structure

Issue type: Book Task
Business purpose: Readers need to understand why master data controls later documents and postings.
Customer data: accepted MD design and route decisions.
Implementation route: local chapter outline before final screenshots.
Source/evidence: Microsoft Learn source anchors, future Universaarl screenshots.
Risk: Book becomes card-field inventory instead of a business explanation.
Training/book output: beginner-friendly sections for customers, vendors, items, locations and import choices.
Playwright/UAT output: screenshot list and page-context requirements for each object.

Acceptance criteria:

- Chapter explains purpose, required fields, dependencies, safe buttons, data-changing buttons and validation.
- Text separates customer handbook guidance from consultant/import guidance.
- No final claim appears without source or Universaarl evidence.

### Story: Define role-based training for master data

Issue type: Training Task
Business purpose: Different roles own different parts of master data.
Customer data: role map from WS02 and data ownership from MD packages.
Implementation route: local training matrix input.
Source/evidence: stakeholder draft, customer data catalog, future UAT.
Risk: Users may create records without understanding posting and process impact.
Training/book output: role-specific learning goals and exercises.
Playwright/UAT output: UAT scenarios for creating/validating representative records.

Acceptance criteria:

- Sales users understand customer basics but not finance-only setup fields.
- Purchasing users understand vendor basics but not unrestricted payment/bank changes.
- Inventory users understand item/location fields needed for stock and documents.
- Key users/admins understand templates, imports and data quality gates.

## Route matrix

| Data object | Manual UI learning | Template candidate | Configuration package / Excel candidate | API candidate | Current default |
| --- | --- | --- | --- | --- | --- |
| Customer | yes, one example | yes | yes, after posting/terms/VAT dependencies | parked | decide before live create |
| Vendor | yes, one example | yes | yes, after posting/terms/payment dependencies | parked | decide before live create |
| Item | yes, one example | yes | yes, after unit/posting/costing dependencies | parked | decide before live create |
| Location | yes, small set | limited | possible for several locations | parked | simple UI first, warehouse later |
| Payment terms | yes if missing | no | possible as setup data | parked | depends on finance foundation |
| Prices/discounts | later examples | no | possible later | parked | park until first process needs it |

## Workstream-level UAT scenarios

| Scenario | Purpose | Status |
| --- | --- | --- |
| UAT-MD-001 Customer card preflight | Key user can identify required customer fields and dependencies before creation. | planned |
| UAT-MD-002 Vendor card preflight | Key user can identify required vendor fields and payment boundary. | planned |
| UAT-MD-003 Item card type decision | Key user can distinguish inventory, service and non-inventory item behavior. | planned |
| UAT-MD-004 Location boundary review | Inventory lead can explain simple location vs warehouse setup. | planned |
| UAT-MD-005 Data import validation | Data lead can review package/import errors before applying data. | planned |

## Workstream-level training modules

| Module | Audience | Learning goal |
| --- | --- | --- |
| TR-MD-001 Customer basics | Sales, accounting key users | Understand customer card fields, terms and posting impact. |
| TR-MD-002 Vendor basics | Purchasing, accounting key users | Understand vendor card fields, terms and payment boundary. |
| TR-MD-003 Item and service basics | Sales, purchasing, inventory | Distinguish inventory, service and non-inventory records. |
| TR-MD-004 Location basics | Inventory and warehouse leads | Understand simple locations before warehouse complexity. |
| TR-MD-005 Templates and imports | Key users, data migration lead, admin | Know when to use templates, packages or manual UI. |
| TR-MD-006 Data quality checklist | All master-data owners | Validate records before they are used in documents. |

## Workstream-level book outputs

- Chapter section: why master data is the backbone of daily BC work.
- Customer section: how a customer card controls sales, receivables and payment behavior.
- Vendor section: how a vendor card controls purchasing, payables and payment behavior.
- Item section: inventory vs service vs non-inventory, and why type matters.
- Location section: simple stock location before warehouse management.
- Consultant sidebar: manual UI vs templates vs configuration packages vs imports.
- Checklist: fields that must be known before the first sales or purchase document.

## Workstream-level Playwright scenarios

- Read-only master-data page preflight for Customers, Vendors, Items and Locations.
- Scoped New/dropdown/template observation without saving, when live gates allow read-only UI discovery.
- Manual creation scenario for exactly one record per object type after dependencies are ready.
- Reopen-proof scenario for saved fields.
- Screenshot QA for card/list fields, template dialogs and required-field messages.
- Configuration-package validation scenario: field selection, package errors and target UI validation, without blind apply.

## Dependencies

- `WORKSTREAM-02-CASE-STUDY-CORE-JIRA-DRAFT.md`
- `WORKSTREAM-03-FINANCE-FOUNDATION-JIRA-DRAFT.md`
- `CUSTOMER-DATA-CATALOG-DRAFT.md`
- `CUSTOMER-DATA-SIMULATION-DRAFT.md`
- `UNIVERSAARL-DATASET-BLUEPRINT.md`
- `BC-FULL-PLAYTHROUGH-CATALOG.md`
- Posting groups, VAT groups, number series and dimensions must be accepted or explicitly parked before live master-data creation.

## Open questions

- Which master-data object should be the first live pilot after the freeze: customer, vendor, item or read-only preflight only?
- Which fields are already configured in `UNIVERSAARL-DE` and which are still parked from finance foundation?
- Should first records use explicit `U-*` numbers or allow number series where assignment is proven?
- Which item type should be first: simple inventory item for O2C/P2P or service/non-inventory item for a lighter first process?
- Should configuration packages be demonstrated with a tiny safe package before or after the first manual examples?
- Which master-data screenshots are required for the first customer handbook chapter?
