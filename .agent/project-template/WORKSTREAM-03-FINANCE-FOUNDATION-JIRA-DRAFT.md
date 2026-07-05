# WS03 Finance Foundation Jira Draft

Status: draft
Purpose: Jira-ready breakdown for the Finance Foundation and Control Model workstream.
Last reviewed: 2026-07-05

## Workstream summary

Finance Foundation establishes the accounting, posting and control base that later sales, purchasing, inventory, bank, fixed assets and reporting processes depend on.

This workstream should be handled before broad master data or document processing. Some tasks can remain parked, but the book must clearly state which foundation pieces are proven, candidate, blocked or intentionally deferred.

## Workstream outcomes

- Universaarl has a documented financial foundation.
- Required customer accounting decisions are visible.
- Setup route decisions compare UI, configuration packages, imports and no-change/park options.
- Playwright can prove selected setup and later ledger effects repeatably.
- Customer training explains not just where to click, but why account determination works.
- Book chapters can explain the finance foundation without pretending legal/tax finality.

## Epic FF-01: General Ledger Setup and Accounting Periods

Purpose: Establish base financial behavior before posting.

### Story: Discover finance base settings

Tasks:

- Request fiscal year, posting periods and calendar assumptions.
- Request local accounting assumptions for German company.
- Identify whether opening balances are planned.
- Identify whether multi-currency is in phase 1.
- Identify deferral requirements.
- Identify reporting period needs for management.

### Story: Design GL setup route

Tasks:

- Decide which GL setup fields must be explained in the first book volume.
- Decide which fields are required for first controlled postings.
- Separate final compliance claims from sandbox learning claims.
- Define which settings may remain standard for phase 1.

### Story: Validate BC setup context

Tasks:

- Open General Ledger Setup read-only in target company.
- Capture company, page and relevant visible values.
- Classify visible values as accepted, unknown, needs decision or parked.
- Record gaps as follow-up data requests or decisions.

### Story: Training and book output

Tasks:

- Explain posting dates, fiscal periods and basic GL setup purpose.
- Explain which GL setup fields affect later postings.
- Add warning that book examples are not tax-advisor approval.
- Create beginner-friendly checklist for finance foundation readiness.

## Epic FF-02: Chart of Accounts and Account Categories

Purpose: Create or verify the accounts that later posting groups and reports depend on.

### Story: Collect chart of accounts requirements

Tasks:

- Request customer chart of accounts or target SKR04-oriented account structure.
- Identify required balance sheet, P&L, VAT, bank, receivable, payable, inventory and fixed asset accounts.
- Identify account naming convention.
- Identify blocked/deprecated account policy.
- Identify account category/reporting needs.

### Story: Design chart of accounts scope

Tasks:

- Decide starter account scope for Universaarl phase 1.
- Separate SKR04-oriented learning structure from official compliance claim.
- Decide which accounts are needed before posting groups.
- Decide whether accounts are created manually, imported or kept from setup data.

### Story: Implement or verify accounts

Tasks:

- Confirm target company and environment.
- Capture before-state for chart of accounts.
- Create or verify only scoped accounts.
- Reopen created/changed accounts to prove persistence.
- Record account type, posting type, blocked state and category if visible.
- Park accounts that need source or customer decision.

### Story: Playwright validation

Tasks:

- Build read-only chart of accounts reopen scenario.
- Validate account search by number and name.
- Validate page title and company context.
- Capture screenshot truth only when account values are visible.

### Story: Training and book output

Tasks:

- Explain what a G/L account is.
- Explain why not every SKR04 account is needed for the learning company.
- Explain deletion/change restrictions after use.
- Provide customer checklist for account review.

## Epic FF-03: Posting Groups and Posting Setup

Purpose: Define how Business Central finds G/L accounts from customers, vendors, items and documents.

### Story: Discover account determination needs

Tasks:

- Request customer/vendor posting group expectations.
- Request revenue, expense, receivable, payable and inventory account mapping.
- Request domestic/foreign business group assumptions.
- Request product/service group assumptions.
- Identify whether multiple posting groups are needed in phase 1.

### Story: Design posting group model

Tasks:

- Define Customer Posting Groups.
- Define Vendor Posting Groups.
- Define General Business Posting Groups.
- Define General Product Posting Groups.
- Define General Posting Setup matrix.
- Define Inventory Posting Groups and Inventory Posting Setup dependency boundary.
- Document which setup belongs to Finance, Product, Inventory or process workstreams.

### Story: Implement scoped posting setup

Tasks:

- Open relevant posting group pages.
- Capture before-state.
- Create or verify minimal scoped rows only.
- Avoid broad edits in unrelated setup pages.
- Reopen rows to prove persistence.
- Record affected G/L accounts and dependencies.

### Story: Playwright validation

Tasks:

- Build read-only reopen scenario for each relevant posting setup page.
- Validate row existence and visible account mapping.
- Avoid active editor typing unless editor proof exists.
- Mark incomplete matrix rows as blocked, not final.

### Story: Training and book output

Tasks:

- Explain customer/vendor/general/inventory posting groups separately.
- Explain why posting groups are account determination, not just codes.
- Show a simple trace from master data to document to ledger after later postings.
- Add common mistake section: wrong group, missing matrix row, wrong account type.

## Epic FF-04: VAT/USt Setup

Purpose: Prepare tax posting logic while keeping legal/tax finality boundaries clear.

### Story: Collect VAT requirements

Tasks:

- Request VAT registration context.
- Request domestic, EU and export transaction assumptions.
- Request VAT product groups for goods/services.
- Identify reverse charge or special cases if in phase 1.
- Identify tax reporting expectations.

### Story: Design VAT setup

Tasks:

- Define VAT Business Posting Groups.
- Define VAT Product Posting Groups.
- Define VAT Posting Setup rows.
- Decide phase-1 VAT scope.
- Identify required G/L accounts.
- Mark legal/tax-advisor validation boundary.

### Story: Implement or verify VAT setup

Tasks:

- Open VAT setup pages read-only before changes.
- Capture before-state.
- Create or verify only scoped setup rows if unlocked.
- Reopen rows and capture visible values.
- Do not claim VAT correctness without process evidence.

### Story: Playwright validation

Tasks:

- Validate VAT setup row visibility.
- Build later transaction scenario that produces VAT Entry if posting is unlocked.
- Capture expected-vs-actual tax behavior.

### Story: Training and book output

Tasks:

- Explain VAT Business vs VAT Product Posting Groups.
- Explain why VAT setup depends on transaction context.
- Explain why visible setup is not yet proof of legal correctness.
- Add customer checklist for tax advisor review.

## Epic FF-05: Dimensions and Reporting Structure

Purpose: Define analysis structure without overloading the chart of accounts.

### Story: Discover dimension needs

Tasks:

- Request departments, cost centers, locations, projects and channels.
- Identify management reporting dimensions.
- Identify mandatory dimensions per master data or account type.
- Identify blocked combinations if needed.
- Identify global and shortcut dimension priorities.

### Story: Design dimension model

Tasks:

- Decide global dimensions.
- Decide shortcut dimensions.
- Decide default dimension rules.
- Decide which dimensions are phase 1.
- Avoid using G/L accounts as pseudo-dimensions.

### Story: Implement or verify dimensions

Tasks:

- Create or verify dimension codes and values.
- Reopen dimensions to prove persistence.
- Assign default dimensions only when target master data is clear.
- Park blocked combinations until process evidence exists.

### Story: Playwright validation

Tasks:

- Validate dimension page and values.
- Validate default dimension assignment on a sample master record where in scope.
- Later validate dimension flow into entries or reports.

### Story: Training and book output

Tasks:

- Explain dimensions as reporting categories.
- Explain global and shortcut dimensions.
- Explain common mistake: creating too many G/L accounts instead of dimensions.
- Provide exercise for filtering entries by dimension after posting evidence exists.

## Epic FF-06: Journals, Batches and Number Series for Finance

Purpose: Prepare controlled finance posting routes and document numbering.

### Story: Discover journal process needs

Tasks:

- Request recurring journal needs.
- Request payment and cash receipt process boundaries.
- Request manual journal approval rules.
- Identify opening balance posting route.
- Identify correction/reversal expectations.

### Story: Design journal setup

Tasks:

- Define journal templates needed in phase 1.
- Define batches and number series.
- Define who can post and who can prepare.
- Decide which journal routes are training-only, UAT or actual sandbox evidence.

### Story: Implement or verify finance journal setup

Tasks:

- Open journal template and batch pages read-only.
- Verify required batches.
- Create or adjust only scoped batches if unlocked.
- Reopen to prove persistence.
- Record number series assignments.

### Story: Playwright validation

Tasks:

- Build read-only journal setup validation.
- Build later preview/posting route only when explicitly unlocked.
- Validate resulting G/L entries if posting happens.

### Story: Training and book output

Tasks:

- Explain journal templates vs batches.
- Explain difference between preview, posting and reversal.
- Add normal-user/key-user/admin responsibility boundaries.

## Epic FF-07: Bank and Payment Foundation

Purpose: Prepare bank accounts, payment terms, payment methods and reconciliation boundary.

### Story: Collect bank and payment data

Tasks:

- Request bank accounts, IBAN/BIC and account owners.
- Request payment terms.
- Request payment methods.
- Request bank reconciliation process.
- Request payment file/import/export requirements.

### Story: Design bank foundation

Tasks:

- Define phase-1 bank account scope.
- Define payment terms and methods.
- Define bank posting group/account mapping.
- Decide whether bank reconciliation is phase 1 or later.

### Story: Implement or verify bank setup

Tasks:

- Open bank account pages.
- Create or verify scoped bank account only if customer data is available.
- Reopen to prove persistence.
- Verify payment terms and methods.
- Avoid real bank integrations unless explicitly in scope.

### Story: Training and book output

Tasks:

- Explain bank account setup and payment methods.
- Explain payment journal and cash receipt boundaries.
- Explain bank reconciliation as its own later process.

## Epic FF-08: Fixed Assets Foundation

Purpose: Keep fixed assets visible as a finance area without blocking the first finance foundation unnecessarily.

### Story: Decide phase scope

Tasks:

- Decide whether fixed assets are phase 1, later volume or parked.
- Request fixed asset classes, depreciation books and existing asset list if in scope.
- Identify local accounting and tax depreciation boundaries.

### Story: Design fixed asset setup

Tasks:

- Define depreciation books.
- Define FA classes and subclasses.
- Define FA posting groups.
- Define acquisition/depreciation/disposal scenarios.

### Story: Training and book output

Tasks:

- Explain acquisition, depreciation and disposal at a high level.
- Mark legacy/lab evidence boundaries if existing evidence comes from older runs.
- Create follow-up epic for full FA process if in scope.

## Workstream-level UAT scenarios

- UAT-FF-01: Key user reviews chart of accounts and account categories.
- UAT-FF-02: Key user reviews posting group matrix and explains account determination.
- UAT-FF-03: Key user reviews VAT setup boundary and confirms tax-advisor review need.
- UAT-FF-04: Key user creates or reviews dimensions and understands reporting effect.
- UAT-FF-05: Key user reviews journal setup and posting responsibility.

## Workstream-level training modules

- Finance foundation overview.
- Chart of accounts and account categories.
- Posting groups and account determination.
- VAT setup basics and boundaries.
- Dimensions for reporting.
- Journals, preview, posting and correction.
- Bank/payment basics.

## Workstream-level book outputs

- Foundation chapter: why finance setup comes before transactions.
- Chart of accounts section.
- Posting groups section.
- VAT/USt setup section with compliance boundary.
- Dimensions section.
- Journals and bank basis section.
- Finance foundation readiness checklist.

## Workstream-level Playwright scenarios

- Read-only reopen of Chart of Accounts.
- Read-only reopen of posting group pages.
- Read-only reopen of VAT setup rows.
- Read-only reopen of dimensions and values.
- Read-only reopen of journal templates/batches.
- Later controlled posting scenario only after explicit unlock.

## Open questions

- Which finance setup objects are already proven in `UNIVERSAARL-DE` and which are only legacy/lab?
- Which finance foundation items should be phase-1 final versus book-candidate?
- Should Bank and Payment become its own workstream after the first bank reconciliation chapter?
- Should Fixed Assets become its own workstream if the book gives it a full operational chapter?
- Which customer data requests must exist before any further setup write?
