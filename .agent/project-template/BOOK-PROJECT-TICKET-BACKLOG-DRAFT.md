# Book Project Ticket Backlog Draft

Status: draft
Purpose: Initial Jira-style backlog for treating the complete book as a Business Central implementation project.
Last reviewed: 2026-07-05

## How to use

These are draft issue candidates, not final Jira exports. They define the kind of tickets needed to turn the book into a fully managed project simulation.

Use fields from `JIRA-WORK-ITEM-MODEL.md` when converting them to Jira.

## Ticket ID convention

```text
BCPM-[number]
```

Suggested ticket groups:

- `BCPM-0001..0099`: governance and project setup
- `BCPM-0100..0199`: case study and discovery
- `BCPM-0200..0299`: finance foundation
- `BCPM-0300..0399`: master data and product model
- `BCPM-0400..0499`: purchasing
- `BCPM-0500..0599`: sales
- `BCPM-0600..0699`: inventory and costing
- `BCPM-0700..0799`: warehouse
- `BCPM-0800..0899`: security, workflows and controls
- `BCPM-0900..0999`: reporting and analytics
- `BCPM-1000..1099`: data migration and integration
- `BCPM-1100..1199`: UAT, training, cutover and hypercare
- `BCPM-1200..1299`: book, Playwright and agent learning

## Governance and project setup

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0001 | Epic | WS01 | Mobilize Universaarl BC implementation project | Project plan and governance baseline |
| BCPM-0002 | Task | WS01 | Review project plan and phase gates | Accepted project plan draft |
| BCPM-0003 | Task | WS01 | Define Jira work item model | Issue types, statuses, labels, DoR/DoD |
| BCPM-0004 | Task | WS01 | Create decision log | Decision register |
| BCPM-0005 | Task | WS01 | Create risk register | Risk register |
| BCPM-0006 | Task | WS01 | Create customer data catalog | Data request catalog |
| BCPM-0007 | Decision | WS01 | Decide book-as-project management model | Accepted narrative/project model |
| BCPM-0008 | Risk | WS01 | Track risk: Jira theater without project value | Mitigation in documentation cadence |
| BCPM-0009 | Book Output | WS14 | Write project mobilization chapter | Reader-facing introduction |

## Case study and discovery

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0100 | Epic | WS02 | Define Universaarl company and implementation context | Case study baseline |
| BCPM-0101 | Data Request | WS02 | Request company information | DR-CORE-001 data packet |
| BCPM-0102 | Data Request | WS02 | Request organization model | DR-CORE-002 data packet |
| BCPM-0103 | Spike | WS02 | Discover target legal entities and phase scope | Company model options |
| BCPM-0104 | Decision | WS02 | Select first target company and later company model | Company scope decision |
| BCPM-0105 | Task | WS02 | Define project roles and customer personas | Role/persona matrix |
| BCPM-0106 | Training Item | WS13 | Explain project roles to the customer | Training note |
| BCPM-0107 | Book Output | WS14 | Write Universaarl case study opening | Book section |

## Finance foundation

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0200 | Epic | WS03 | Build finance foundation and control model | Finance foundation ready/parked evidence |
| BCPM-0201 | Data Request | WS03 | Request chart of accounts | DR-FIN-001 data packet |
| BCPM-0202 | Data Request | WS03 | Request posting group design inputs | DR-FIN-002 data packet |
| BCPM-0203 | Data Request | WS03 | Request VAT/USt assumptions | DR-FIN-003 data packet |
| BCPM-0204 | Data Request | WS03 | Request dimensions and reporting structure | DR-FIN-004 data packet |
| BCPM-0205 | Decision | WS03 | Decide SKR04-oriented starter scope | Decision record |
| BCPM-0206 | Decision | WS03 | Decide posting group model | Decision record |
| BCPM-0207 | Decision | WS03 | Decide VAT phase-1 scope and compliance boundary | Decision record |
| BCPM-0208 | Task | WS03 | Verify chart of accounts in BC | Evidence result |
| BCPM-0209 | Playwright Evidence | WS14 | Reopen chart of accounts and prove visible values | Repeatable scenario |
| BCPM-0210 | UAT Scenario | WS13 | Finance key user reviews account structure | UAT script |
| BCPM-0211 | Training Item | WS13 | Train posting groups and account determination | Training module |
| BCPM-0212 | Book Output | WS14 | Curate finance foundation chapter | Book chapter candidate |

## Master data and product model

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0300 | Epic | WS04 | Design commercial master data and product model | Master data blueprint |
| BCPM-0301 | Data Request | WS04 | Request customer list | Customer import template |
| BCPM-0302 | Data Request | WS04 | Request vendor list | Vendor import template |
| BCPM-0303 | Data Request | WS04 | Request item/service catalog | Item import template |
| BCPM-0304 | Decision | WS04 | Decide item/service/non-inventory classification | Product model decision |
| BCPM-0305 | Decision | WS04 | Decide UI example vs configuration package route | Implementation route decision |
| BCPM-0306 | Task | WS04 | Create one customer example manually | UI learning proof |
| BCPM-0307 | Task | WS11 | Prepare configuration package for master data | Package design |
| BCPM-0308 | Playwright Evidence | WS14 | Validate sample customer/vendor/item in UI | Repeatable scenario |
| BCPM-0309 | Training Item | WS13 | Train master data ownership and data quality | Training module |
| BCPM-0310 | Book Output | WS14 | Curate master data chapter | Book chapter candidate |

## Purchasing / Source-to-Pay

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0400 | Epic | WS05 | Implement purchasing and Source-to-Pay | Process design and evidence |
| BCPM-0401 | Data Request | WS05 | Request purchasing process and vendor terms | Process data packet |
| BCPM-0402 | Decision | WS05 | Decide direct purchase invoice vs purchase order route | Process route decision |
| BCPM-0403 | Task | WS05 | Verify Purchases and Payables Setup | Setup evidence |
| BCPM-0404 | Playwright Evidence | WS14 | Run purchasing scenario read/preview path | Evidence scenario |
| BCPM-0405 | UAT Scenario | WS13 | Key user tests purchase order to invoice | UAT script |
| BCPM-0406 | Training Item | WS13 | Train purchase order, receipt, invoice and correction | Training module |
| BCPM-0407 | Book Output | WS14 | Curate purchasing process chapter | Book chapter candidate |

## Sales / Order-to-Cash

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0500 | Epic | WS06 | Implement sales and Order-to-Cash | Process design and evidence |
| BCPM-0501 | Data Request | WS06 | Request sales process and customer terms | Process data packet |
| BCPM-0502 | Decision | WS06 | Decide quote/order/invoice route for phase 1 | Process route decision |
| BCPM-0503 | Task | WS06 | Verify Sales and Receivables Setup | Setup evidence |
| BCPM-0504 | Playwright Evidence | WS14 | Run sales scenario read/preview path | Evidence scenario |
| BCPM-0505 | UAT Scenario | WS13 | Key user tests quote to invoice | UAT script |
| BCPM-0506 | Training Item | WS13 | Train sales quote, order, shipment, invoice and correction | Training module |
| BCPM-0507 | Book Output | WS14 | Curate sales process chapter | Book chapter candidate |

## Inventory, costing and warehouse

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0600 | Epic | WS07 | Implement inventory, costing and stock control | Inventory readiness |
| BCPM-0601 | Data Request | WS07 | Request opening inventory | DR-INV-001 data packet |
| BCPM-0602 | Decision | WS07 | Decide costing assumptions and inventory posting route | Decision record |
| BCPM-0603 | Task | WS07 | Verify Inventory Setup and posting setup | Setup evidence |
| BCPM-0604 | Playwright Evidence | WS14 | Prove item ledger/value entry scenario | Evidence scenario |
| BCPM-0605 | Training Item | WS13 | Train inventory adjustment and value entry meaning | Training module |
| BCPM-0700 | Epic | WS08 | Decide and implement warehouse scope | Warehouse scope and scenarios |
| BCPM-0701 | Data Request | WS08 | Request locations, bins and warehouse process | Warehouse data packet |
| BCPM-0702 | Decision | WS08 | Decide simple locations vs warehouse management | Warehouse scope decision |
| BCPM-0703 | UAT Scenario | WS13 | Key user tests inbound/outbound warehouse route | UAT script |
| BCPM-0704 | Book Output | WS14 | Curate inventory and warehouse chapters separately | Book output |

## Controls, reporting and operations

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-0800 | Epic | WS09 | Design users, roles, workflows and controls | Security/control model |
| BCPM-0801 | Data Request | WS09 | Request users and roles | DR-SEC-001 data packet |
| BCPM-0802 | Decision | WS09 | Decide permission and key-user model | Decision record |
| BCPM-0803 | Training Item | WS13 | Train admin, key user and end user boundaries | Training module |
| BCPM-0900 | Epic | WS10 | Design reporting and analytics | Reporting blueprint |
| BCPM-0901 | Data Request | WS10 | Request management reporting requirements | Report request packet |
| BCPM-0902 | UAT Scenario | WS13 | Key user validates dimension/report filters | UAT script |
| BCPM-0903 | Book Output | WS14 | Curate reporting chapter | Book output |

## UAT, training, cutover and book system

| ID | Type | Workstream | Title | Output |
| --- | --- | --- | --- | --- |
| BCPM-1100 | Epic | WS13 | Prepare UAT, training, cutover and hypercare | Readiness package |
| BCPM-1101 | Task | WS13 | Create UAT scenario catalog | Scenario catalog |
| BCPM-1102 | Task | WS13 | Create role-based training matrix | Training matrix |
| BCPM-1103 | Task | WS13 | Create cutover checklist | Cutover draft |
| BCPM-1104 | Task | WS13 | Create hypercare support model | Support model |
| BCPM-1105 | Task | WS13 | Create training strategy and curriculum | Training curriculum |
| BCPM-1106 | Task | WS13 | Map training modules to Playwright and UAT evidence | Training evidence map |
| BCPM-1107 | Training Item | WS13 | Create first training module cards | Trainer-ready module drafts |
| BCPM-1200 | Epic | WS14 | Operate book, Playwright and learning system | Evidence-backed book machine |
| BCPM-1201 | Task | WS14 | Map book chapters to workstreams and epics | Book map |
| BCPM-1202 | Task | WS14 | Map Playwright scenarios to UAT and evidence claims | Scenario map |
| BCPM-1203 | Task | WS14 | Audit raw book content against project model | Audit list |
| BCPM-1204 | Skill/Helper Improvement | WS14 | Convert repeated BC UI blocker into helper/skill | Learning output |
| BCPM-1205 | Book Output | WS14 | Write project lessons learned chapter | Book output |

## Next backlog refinement

The next step is to expand `WS02-CASE-STUDY-CORE` and `WS04-MASTER-DATA-PRODUCT` into the same depth as `WORKSTREAM-03-FINANCE-FOUNDATION-JIRA-DRAFT.md`.
