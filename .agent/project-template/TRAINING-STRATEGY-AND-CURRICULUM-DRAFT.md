# Training Strategy and Curriculum Draft

Status: draft
Purpose: Professionelle, rollenbasierte Schulungsplanung fuer Universaarl Business Central, Kundenhandbuch, UAT und Playwright-belegte Lernunterlagen.
Last reviewed: 2026-07-05

## Core idea

Training is not a late project add-on. Training is a delivery stream that starts with discovery, grows through setup, is validated through Playwright and UAT, and becomes customer handbook content.

Every training unit must connect to:

- a workstream and epic
- a customer role or audience
- a business process or setup responsibility
- required customer data
- Business Central concepts
- a practical exercise
- a success check
- UAT or acceptance where relevant
- Playwright/sandbox evidence where the unit teaches concrete BC behavior
- a handbook or book output

## Source anchors

Use these Microsoft sources as training anchors:

- Business Central training landing page:
  https://learn.microsoft.com/en-us/training/dynamics365/business-central
- Get started with Business Central:
  https://learn.microsoft.com/en-us/training/paths/get-started-dynamics-365-business-central/
- Work with the Business Central user interface:
  https://learn.microsoft.com/en-us/training/paths/work-with-user-interface-dynamics-365-business-central/
- Configure financials in Business Central:
  https://learn.microsoft.com/en-us/training/paths/configure-financials-business-central/
- Process financial operations in Business Central:
  https://learn.microsoft.com/en-us/training/paths/process-financial-operations-business-central/
- Purchase items and services in Business Central:
  https://learn.microsoft.com/en-us/training/paths/purchase-items-services-dynamics-365-business-central/
- Sell items and services in Business Central:
  https://learn.microsoft.com/en-us/training/paths/sell-items-services-dynamics-365-business-central/
- Get started with inventory management:
  https://learn.microsoft.com/en-us/training/paths/get-started-inventory-management/
- Dynamics 365 testing strategy:
  https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy

These sources explain product and implementation concepts. Universaarl Playwright/sandbox evidence proves concrete behavior in the project company.

## Training principles

- Train by role, not by menu structure.
- Teach why before where to click.
- Teach daily process, exception, correction and escalation.
- Use customer data and project story where possible.
- Keep internal agent/evidence language out of customer materials.
- Do not mark training as final without source/evidence for the main BC behavior.
- Use Playwright as proof and rehearsal support, not as a replacement for customer practice.
- Separate key-user training from end-user training.
- Separate setup-owner training from daily-operation training.
- Make management training about decisions, reports, controls and risks, not data entry.

## Training audiences

### Executive and management

Characters:

- Mara Stein
- Jonas Weber
- Claudia Schulte

Need:

- project status
- process impact
- controls
- reporting
- approval points
- go-live readiness

Training focus:

- what Business Central changes for the business
- how to read dashboards/reports
- what management must approve
- how risks and open decisions are handled

### Key users

Characters:

- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Elena Fischer
- Sami Yilmaz

Need:

- process ownership
- master-data quality
- setup awareness
- UAT
- escalation
- first-line support

Training focus:

- concepts and dependencies
- daily process plus exceptions
- how to validate results
- how to diagnose common mistakes
- when to escalate

### End users

Examples:

- purchasing clerks
- sales order processors
- warehouse operators
- accounting users

Need:

- safe daily execution
- visible checks
- simple correction and escalation path

Training focus:

- tasks they perform
- fields that matter
- safe vs data-changing actions
- common errors
- what not to touch

### Administrators

Character:

- Sami Yilmaz

Need:

- users
- role centers
- permissions
- workflows
- job queues
- support diagnostics
- integrations where relevant

Training focus:

- system operation and controlled change
- support boundaries
- audit and access
- environment/company awareness

### Project and book team

Characters:

- Nora Becker
- Adrian Vogt
- Jana Weiss
- Robin Adler
- Sarah Klein
- Tom Seidel

Need:

- keep training, UAT, evidence and book aligned

Training focus:

- evidence status
- book readiness
- UAT-to-training feedback
- Playwright-to-handbook translation

## Training program phases

### Phase T0: Project orientation

Purpose:

- explain the project, cast, workstreams, Jira structure and sandbox boundary.

Modules:

- TR-00-01 Project journey and roles
- TR-00-02 Business Central environment, company and evidence boundary
- TR-00-03 How tickets, data requests, decisions and risks work

Evidence need:

- no BC write evidence required
- project docs and company-context proof later

Handbook output:

- project introduction
- role overview
- glossary for Jira/project terms

### Phase T1: Business Central navigation foundation

Purpose:

- make all users safe in the UI before they touch process data.

Modules:

- TR-01-01 Role Center, Tell Me/search and navigation
- TR-01-02 Lists, cards, FastTabs, FactBoxes, actions and dialogs
- TR-01-03 Filters, views, search, focus mode and page context
- TR-01-04 Safe actions vs data-changing actions

Evidence need:

- read-only Playwright proof for environment/company/page context
- screenshots must show the actual UI element being taught

Handbook output:

- navigation quick guide
- safe-action guide
- common UI mistakes and recovery

### Phase T2: Finance foundation

Purpose:

- teach accounting and key users why finance setup gates later processes.

Modules:

- TR-02-01 Company, fiscal year and GL setup basics
- TR-02-02 Chart of accounts and account categories
- TR-02-03 Posting groups and account determination
- TR-02-04 VAT/USt setup concept and review boundary
- TR-02-05 Dimensions and reporting structure
- TR-02-06 Journals, preview, posting and correction
- TR-02-07 Bank and payment foundation

Evidence need:

- read-only reopen proofs for setup pages
- transaction/ledger evidence only for modules that teach actual posting effects
- VAT claims stay bounded until source and transaction evidence support them

Handbook output:

- finance foundation guide
- account determination explainer
- finance key-user checklist

### Phase T3: Master data and scalable setup

Purpose:

- teach data ownership and setup/import discipline.

Modules:

- TR-03-01 Customer master data
- TR-03-02 Vendor master data
- TR-03-03 Items, services and non-inventory items
- TR-03-04 Units of measure, categories, attributes and variants
- TR-03-05 Templates, configuration packages and imports
- TR-03-06 Data quality checks and cleanup

Evidence need:

- manual example record in UI for learning
- import/configuration-package route validated separately when used
- UI reopen proof for important imported/created records

Handbook output:

- master-data ownership guide
- required-fields checklist
- import validation checklist

### Phase T4: Purchasing / Source-to-Pay

Purpose:

- teach purchasing users and finance how purchase flow affects documents, inventory and payables.

Modules:

- TR-04-01 Vendor and purchasing setup dependency
- TR-04-02 Purchase quote/order/invoice route
- TR-04-03 Receipt, invoice and partial receipt boundary
- TR-04-04 Purchase corrections and credit memos
- TR-04-05 Vendor ledger, G/L impact and checks

Evidence need:

- Playwright scenario for selected purchasing route
- ledger/subledger proof when posting is taught
- UAT key-user validation

Handbook output:

- purchasing daily process guide
- purchasing exception guide

### Phase T5: Sales / Order-to-Cash

Purpose:

- teach sales users and finance how sales flow affects customers, inventory and receivables.

Modules:

- TR-05-01 Customer and sales setup dependency
- TR-05-02 Quote/order/invoice route
- TR-05-03 Shipment/invoice boundary
- TR-05-04 Prices, discounts and availability checks
- TR-05-05 Customer ledger, G/L impact and checks

Evidence need:

- Playwright scenario for selected sales route
- ledger/subledger proof when posting is taught
- UAT key-user validation

Handbook output:

- sales daily process guide
- sales correction and escalation guide

### Phase T6: Inventory and warehouse

Purpose:

- teach product, quantity, value and physical warehouse work as separate but connected topics.

Modules:

- TR-06-01 Items vs inventory vs warehouse
- TR-06-02 Locations, inventory quantities and value entries
- TR-06-03 Inventory adjustments and physical inventory
- TR-06-04 Opening inventory and cutover rehearsal
- TR-06-05 Warehouse scope: simple locations vs bins/warehouse processes
- TR-06-06 Warehouse receiving, picking, shipment and exceptions

Evidence need:

- item ledger/value entry proof for inventory effects
- warehouse proof only after warehouse scope is decided
- UAT exercises for stock count and movement scenarios

Handbook output:

- inventory user guide
- warehouse process guide
- count and correction checklist

### Phase T7: Reporting, controls and admin

Purpose:

- make the solution controllable after daily operations start.

Modules:

- TR-07-01 Dimensions and report filtering
- TR-07-02 Financial reports and management view
- TR-07-03 Roles, permissions and role centers
- TR-07-04 Workflows and approvals
- TR-07-05 Change log, job queues and support diagnostics

Evidence need:

- report/filter proof with meaningful sample data
- permission/workflow evidence only when safe and scoped

Handbook output:

- management reporting guide
- admin and support guide

### Phase T8: UAT, go-live and hypercare

Purpose:

- train the customer to accept, operate and support the solution.

Modules:

- TR-08-01 How to run UAT
- TR-08-02 How to log defects and questions
- TR-08-03 Cutover checklist and readiness
- TR-08-04 Hypercare and support triage
- TR-08-05 Lessons learned and continuous improvement

Evidence need:

- UAT scenario results
- defect/retest trace
- training attendance/practice notes in project simulation

Handbook output:

- UAT guide
- go-live checklist
- hypercare support guide

## Training material package

Each final training module should produce:

- trainer notes
- participant handout
- step-by-step handbook page
- exercise sheet
- expected result/check sheet
- common mistakes and correction sheet
- UAT linkage where relevant
- Playwright/evidence reference
- source reference for product logic
- book chapter link

## Training readiness levels

- `idea`: useful topic, not planned.
- `planned`: module has audience and purpose.
- `draft`: content exists but not fully sourced/evidenced.
- `evidence-ready`: main BC behavior has source/sandbox evidence.
- `uat-ready`: customer exercise and pass/fail criteria exist.
- `trainer-ready`: handout, exercise, trainer notes and checks exist.
- `delivered`: simulated or real training session delivered.
- `accepted`: key users confirm training is usable.
- `parked`: blocked by missing data, source, setup or evidence.

## Evidence rule

No module is `trainer-ready` if it teaches concrete BC behavior without at least one of:

- official Microsoft source for product concept
- Universaarl sandbox observation
- repeatable Playwright scenario
- accepted UAT result

For action-heavy modules, Playwright should prove the path or explicitly explain why the training route is manual/UAT-only.

## Next refinement

Use `ROLE-BASED-TRAINING-MATRIX-DRAFT.md` to turn this curriculum into role-specific schedules and learning paths.
