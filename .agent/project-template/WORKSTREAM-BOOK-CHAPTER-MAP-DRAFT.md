# Workstream Book Chapter Map Draft

Status: draft
Purpose: Map Universaarl implementation workstreams, Jira work, customer data, UAT, training and Playwright evidence to curated book chapters.
Last reviewed: 2026-07-06

## Boundary

This file is a project-control artifact. It is not the book text and does not promote any chapter to final status.

Use it to decide which project work can become reader-facing material and which evidence, source, UAT or training gate is still missing. The book must stay curated: raw Jira rows, Playwright logs and agent notes do not become chapter prose without consultant review and book curation.

## Mapping rules

- One chapter can draw from multiple workstreams, but every final claim needs a source, Universaarl evidence, UAT/training acceptance or an explicit assumption label.
- RM-DEMO, CRONUS and old laboratory evidence may be mentioned only as legacy/archive context, not as Universaarl final proof.
- Setup chapters must explain purpose, customer data, route decision, BC concept, implementation route, evidence, UAT and training impact.
- Process chapters must not start before prerequisites are visible: company context, finance foundation, posting groups, VAT boundary, dimensions and master data.
- Playwright evidence proves repeatable sandbox behavior; UAT proves customer understanding and acceptance.

## Chapter map

| Book chapter or section | Workstream | Jira anchor | Book purpose | Customer data needed | Route/evidence gate | UAT/training link | Current status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Part A / Chapter 1: What this book is | WS01; WS14 | BCPM-0001; BCPM-0009 | Position the book as a guided Business Central implementation, not a menu walkthrough. | none | Source-backed project model; no BC proof needed. | Reader orientation and role expectations. | draft | Keep aligned with project operating model and remove agent-meta language before final. |
| Chapter 2: Learning paths and roles | WS13; WS14 | BCPM-1105; BCPM-1107 | Give beginners, key users, consultants and architects clear learning routes. | role and audience model | Training strategy and role matrix must stay current. | Training curriculum and role-based matrix. | draft | Connect module cards to chapter sections after each training-card batch. |
| Chapter 3: Universaarl case study | WS02 | BCPM-0100; BCPM-0107 | Introduce Universaarl as the realistic customer and explain the business context. | `DR-CORE-COMPANY-001`; `DR-CORE-ORG-001` | Company/organization data must be simulated, owned and not tax-final. | Environment/company and organization training. | draft-partial | Replace remaining legacy framing with Universaarl-only reader text when supporting data is stable. |
| Chapter 4: Business Central basics and navigation | WS02; WS14 | BCPM-0105; TASK-PWS-CORE-001 | Teach environment, company, role center, lists, cards, FastTabs, FactBoxes and safe navigation. | company context | Read-first company/navigation proof after freeze/resume gate. | `TR-00-02`; `TR-01-01`; `TR-01-02` | draft | Build/read-first navigation evidence before polishing screenshots. |
| Chapter 5: How Business Central thinks | WS03; WS14 | BCPM-0200; BCPM-1201 | Explain records, setup, posting, entries, ledgers and why setup order matters. | none at first; examples later | Microsoft source plus later Universaarl posting traces. | Foundation concepts for all roles. | draft | Add chapter claim boundaries from source registry before final. |
| Chapter 6: Company, organization and setup start | WS02; WS03 | BCPM-0101; BCPM-0102; BCPM-0200 | Show how a company and organization model become BC setup work. | Company Information and organization model packages. | Company Information read-first proof; no tax finality. | `TR-00-02`; organization-owner training. | draft-blocked | After freeze, use read-first proof; write setup only through later Smart Decision. |
| Chapter 7: Master data of the case study | WS04 | BCPM-0300; DR-MD-CUST-001; DR-MD-VEND-001; DR-MD-ITEM-001 | Explain why customers, vendors, items, services and non-inventory records are business-owned data. | customer, vendor, item/service packages | Numbering, posting groups, VAT, payment, UOM, product model and read-first page proof. | `TR-03-01`; `TR-03-02`; `TR-03-03` | dependency-blocked | Keep as data-quality chapter until foundation dependencies are resolved. |
| Chapter 8: Foundation setup | WS03 | BCPM-0201..BCPM-0208 | Teach chart of accounts, number series, posting groups, VAT boundary, dimensions and setup order. | chart of accounts, posting group inputs, VAT assumptions, dimension model | Official source plus Universaarl read-first/setup evidence; no final compliance claim. | `TR-02-01`; `TR-02-02`; `TR-02-03`; `TR-02-04` | draft-in-progress | Next evidence should be read-first VAT setup and Dimensions/Dimension Values after freeze/resume gate. |
| Chapter 9: Posting groups and account determination | WS03; WS05; WS06; WS07 | BCPM-0206; BCPM-0211 | Explain how BC finds G/L accounts from customer/vendor/product setup. | posting group design inputs | Setup-row proof and later preview/posting trace. | Posting groups training and later process UAT. | evidence-needed | Do not use process posting examples until setup rows are proven. |
| Purchasing chapters: Source-to-Pay | WS05 | BCPM-0400..BCPM-0407 | Teach purchase requisition/order/receipt/invoice/correction route selected for Universaarl. | vendors, items/services, payment terms, posting/VAT setup | Purchase setup read-first proof, route decision, preview/posting evidence if unlocked. | Purchasing key-user training and UAT. | planned | Create purchasing process card only after foundation/master-data gates are clear. |
| Sales chapters: Order-to-Cash | WS06 | BCPM-0500..BCPM-0507 | Teach quote/order/shipment/invoice/payment expectation and corrections. | customers, items/services, pricing/payment terms, posting/VAT setup | Sales setup read-first proof, route decision, preview/posting evidence if unlocked. | Sales and finance UAT/training. | planned | Create sales process card only after foundation/master-data gates are clear. |
| Inventory and costing chapters | WS07 | BCPM-0600..BCPM-0605 | Explain quantity, value, item ledger entries, value entries, costing and inventory controls. | items, UOM, locations, opening inventory, costing assumptions | Inventory setup and item ledger/value entry evidence. | Inventory training and stock UAT. | planned | Resolve product/location/UOM decisions before book examples. |
| Warehouse chapter | WS08 | BCPM-0700..BCPM-0704 | Decide whether phase 1 uses simple locations or warehouse management. | locations, bins, warehouse process, roles | Scope decision and read-first/execute evidence for chosen route. | Warehouse training if in scope. | planned/parked | Keep optional until warehouse scope is decided. |
| Security, workflows and controls chapter | WS09 | BCPM-0800..BCPM-0803 | Explain roles, permissions, key users, approval/workflow boundaries and segregation risks. | user/role request and approval rules | Source-backed security model plus read-first permission/role evidence. | Admin/key-user training. | planned | Create data request and role/control decision before setup. |
| Reporting and analytics chapter | WS10 | BCPM-0900..BCPM-0903 | Teach reporting, analysis, dimensions, Excel/Power BI perspective and management checks. | reporting requirements and dimension model | Posted/process data plus report/filter proof. | Management and finance reporting UAT. | planned | Do not finalize reporting examples until posted Universaarl data exists. |
| Migration, opening balances and cutover chapter | WS11; WS13 | BCPM-1000 series; BCPM-1103 | Explain how data moves from legacy/source files into BC and how cutover is controlled. | migration packages, opening balances, open entries, cutover owners | Route decision: configuration package, Excel, API, AL or parked; reconciliation proof. | Cutover rehearsal and UAT sign-off. | planned | Expand WS11 before real import planning. |
| UAT, training, go-live and hypercare chapters | WS13 | BCPM-1100..BCPM-1106 | Show how the customer proves and learns the solution before go-live. | role matrix, UAT scenarios, training attendance, support model | UAT result evidence, defects/retests, training acceptance. | All role-based training modules. | draft | Build UAT scenario catalog and connect to training evidence map. |
| Book, Playwright and learning-system chapter | WS14 | BCPM-1200..BCPM-1205 | Explain how evidence, screenshots, helper learning and curation keep the book trustworthy. | none; uses project evidence | Evidence pack standard and repeatability checks. | Consultant/author/internal team training. | draft | Keep internal-agent language out of customer-facing chapters. |

## Readiness legend

- `draft`: useful planning text exists, but not final chapter material.
- `draft-partial`: some reader text exists, but legacy or evidence gaps remain.
- `draft-blocked`: chapter direction is known, but required data/evidence/source is missing.
- `dependency-blocked`: downstream chapter cannot be final until upstream setup/data exists.
- `evidence-needed`: concept exists, but Universaarl proof is missing or incomplete.
- `planned`: no sufficient chapter draft yet.
- `planned/parked`: valid later topic, not phase-1 unless a decision moves it forward.

## Critical review

| Question | Verdict |
| --- | --- |
| Does this make the project more realistic? | yes; it prevents isolated setup/test work from becoming disconnected book content. |
| Is this a Jira/Confluence/book output? | yes; it fulfills `BCPM-1201` as a draft map and can become a Confluence book-planning page. |
| Does it authorize BC work? | no; it only maps prerequisites and gates. |
| Biggest risk | Treating planned chapters as already proven. The `Current status` and `Route/evidence gate` columns must stay visible. |
| Next concrete step | Add chapter-map anchors to dashboard/checks, then use the map when creating the next process training or evidence package. |
