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
