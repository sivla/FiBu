# Universaarl Execution Roadmap

Status: active-draft
Purpose: Single operating roadmap for the Universaarl Business Central implementation system, from improvement freeze back into read-first foundation validation and later customer-ready process playthrough.
Last reviewed: 2026-07-06

## Current operating decision

The project is in `Improvement Freeze / M0-M1 transition`.

The freeze is not a permanent stop, but it must not be skipped. The next live work is a controlled read-first return pilot, not a continuation of the parked VAT active-editor retry.

| Topic | Current decision |
| --- | --- |
| Target environment | `playthru` only |
| Target company | `UNIVERSAARL-DE` |
| Reference company name | Universaarl GmbH |
| Current live status | freeze active until resume gates are checked |
| Parked case | `TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION` |
| First resume pilot | `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK` |
| Next live type | read-first, no writes |
| Next local control task | keep roadmap, dashboard, state and chapter/training/evidence maps aligned |

## North star and active truth

This roadmap is the current operating source for the Universaarl Business Central implementation system. The repository is not only a test collection or book draft. It is a reusable customer-project blueprint that should let a Business Central consultant, solution architect, project manager, trainer or future agent understand the next responsible step within minutes.

Active truth:

- Business Central environment: `playthru`
- Target company: `UNIVERSAARL-DE`
- Reference legal entity: Universaarl GmbH
- Currency and market context: EUR, German customer/training logic
- Execution boundary: all practical Business Central and Playwright proof work happens only in `playthru`
- Current resume pilot: `TARGET-075`
- Parked live case: `TARGET-073`

Legacy truth:

- `RM-DEMO`, `MCP_1_20260210`, CRONUS, Rhein-Main and RM-* material are not active target truth.
- Existing legacy evidence may remain only as traceability or `legacy-purge-source`.
- Reusable patterns from legacy material must be neutralized or rebuilt for Universaarl before they guide active work.
- New state, dashboard, book, training or Playwright routes must not point a new agent back into legacy as the normal path.

## Operating loop

Every meaningful work package should follow this small loop:

1. Read active truth: instance, company, active case, freeze status, allowed actions, legacy boundary and next step.
2. Pick one concrete project artifact or evidence step: data package, route decision, read-first proof, UAT scenario, training card, handbook/book candidate, Playwright helper or cleanup.
3. Execute only the smallest useful batch.
4. Classify the result as proven, observed, assumption, blocked, parked, rejected or legacy-purge-source.
5. Update dashboard, state, backlog, decision/risk or readiness artifact if the next-step picture changed.
6. Remove or park noise when a file no longer helps active control.

Do not create another strategy layer unless it replaces confusion with a concrete operating artifact.

## Tool and artifact model

| Layer | Owns | Does not own |
| --- | --- | --- |
| Confluence model | Customer-readable knowledge, blueprint, decisions, risks, data requests, UAT, training and handbook context. | Raw Playwright logs or secret/auth material. |
| Jira model | Work, owners, status, blockers, decisions, risks, data requests, UAT and training tasks. | Product evidence or final book prose by itself. |
| GitHub/repo model | Playwright, scripts, checks, evidence files, technical markdown, agent learning and repeatability. | Customer-facing PM truth when Jira/Confluence would be clearer. |
| Business Central `playthru` | Real product observation, setup, data, process proof, UAT/training candidates and screenshot evidence. | Work outside the sandbox boundary or real customer data. |

This split is practical, not bureaucratic. If a work item cannot improve project control, Business Central correctness, repeatability, UAT/training, customer handbooks or book quality, it should be parked or removed.

## Local check snapshot

Latest local check result: roadmap implementation run, 2026-07-06.

| Check | Result | Roadmap consequence |
| --- | --- | --- |
| `agent:preflight` | passed | Local project state is consistent enough for planning. |
| `check:encoding` | passed | Text files are clean enough for this package. |
| `agent:quality:audit` | passed with risk findings | Quality risks remain visible: narrow TypeScript coverage, direct storageState usage and legacy Playwright flake surface. |
| `agent:resume:check` | passed locally | `TARGET-075` is locally prepared, but this does not lift the freeze. |
| `agent:freeze:status` | freeze active | Live execution remains blocked until the freeze is explicitly lifted. |

Quality-audit boundary:

- `tsconfig.json` is not full project health proof yet.
- Auth freshness remains a live-run precondition.
- Legacy waits, force clicks and coordinate clicks remain technical debt.
- `TARGET-075` stays read-first precisely because this risk surface still exists.

## Three operating tracks

| Track | Purpose | Current priority | Output |
| --- | --- | --- | --- |
| Project operation | Keep Jira/Confluence-style work human-manageable and decision-driven. | Use this roadmap as the current steering source. | Dashboard, backlog, decisions, risks and readiness notes. |
| Business Central playthrough | Prove Universaarl setup and processes in `playthru` with repeatable evidence. | Resume with read-first Foundation validation only. | Result JSON, screenshots, screenshot QA, normalized result and state-finalize plan. |
| Book, handbook and training | Convert project/evidence into curated customer-readable guidance. | Use chapter map and training cards before writing process text. | Book sections, handbook material, UAT scenarios and role-based training cards. |

## Phase 0 - Consolidate control

Current status: active.

Done:

- Project dashboard exists.
- Workstream book chapter map exists.
- Training module cards exist through finance foundation and first master-data packages.
- Read-first scenario catalog exists for WS02/WS03/WS04.

Now:

1. Treat this roadmap as the current steering document.
2. Dashboard, backlog and state must point to this roadmap.
3. Keep legacy material out of active next-step truth.
4. Remove contradictory next-step language when it suggests broad expansion before the read-first foundation return.
5. Prefer one concrete artifact over another broad review.

Do not:

- add another strategy layer
- create new subagent infrastructure
- expand Jira imports unless they directly support the next BC/training/evidence step
- mass-delete historical evidence without a replacement, supersession or explicit purge decision

## Phase 1 - End freeze safely

Current status: pending gates.

Before any Business Central or Playwright live work:

- `npm run agent:preflight`
- `npm run check:encoding`
- `npm run agent:quality:audit`
- `npm run agent:resume:check || true`
- `npm run agent:freeze:status || true`

Resume decision:

- `TARGET-073` remains parked.
- `TARGET-075` is the first live pilot.
- `TARGET-075` is read-first only.

TARGET-075 may:

- verify `playthru`
- verify `UNIVERSAARL-DE`
- open Chart of Accounts and Foundation context
- capture visible values, screenshots and compact evidence

TARGET-075 must not:

- write setup
- create or edit master data
- create document drafts
- preview posting
- post
- confirm risky dialogs
- treat visible setup as final accounting, VAT or compliance proof

## Phase 2 - Prove foundation before processes

Current status: planned after freeze/resume gates.

Order:

1. `TARGET-075` - Chart of Accounts / Foundation read-first reopen check.
2. VAT/USt read-first proof:
   - VAT Business Posting Groups
   - VAT Product Posting Groups
   - VAT Posting Setup
   - no final German tax claim
3. Dimensions read-first proof:
   - Dimensions
   - Dimension Values
   - General Ledger Setup read-only
   - no repeated global-dimension write retry without a materially new hypothesis
4. Posting Groups read-first proof:
   - Customer Posting Groups
   - Vendor Posting Groups
   - General Posting Setup
   - missing setup rows are blockers, not guessed values
5. Foundation readiness decision:
   - proven
   - parked
   - blocks master data
   - enough for bookdraft only
   - not enough for posting

Required artifact after Phase 2:

- `FOUNDATION-READINESS-DECISION.md`

## Phase 3 - Build master data as customer project

Current status: dependency-blocked.

Use existing data packages:

- `UNIVERSAARL_CORE_CompanyInformation`
- `UNIVERSAARL_CORE_OrganizationModel`
- `UNIVERSAARL_MD_Customers`
- `UNIVERSAARL_MD_Vendors`
- `UNIVERSAARL_MD_ItemsServices`

For each package choose a route:

- UI example
- Template
- Configuration Package
- Excel-assisted
- API or AL only if clearly justified later
- parked

Read-first Playwright specs before any master-data write:

- `PWS-MD-001` Customer context
- `PWS-MD-002` Vendor context
- `PWS-MD-003` Item/Service context

Writes are allowed only after a Smart Decision and only with:

- purpose
- owner
- data source
- route decision
- before/after proof
- reopen proof
- training/book link

## Phase 4 - Build process traces

Current status: planned after master-data readiness.

Sequence:

1. O2C minimal.
2. P2P minimal.
3. Inventory quantity/value.
4. Payments and bank after open items exist.
5. Reporting after meaningful posted or process data exists.
6. Fixed Assets, Projects, Service and Warehouse as later scope decisions.

Every process must define:

- start state
- business purpose
- customer data
- Business Central route
- evidence plan
- UAT script
- training module
- book chapter link

## Phase 5 - Curate book and handbook

Current status: ongoing, gated by evidence and sources.

Rules:

- Do not turn raw Playwright logs, Jira rows or agent notes into book text.
- Use `WORKSTREAM-BOOK-CHAPTER-MAP-DRAFT.md` before every material book patch.
- Final or near-final book claims need official source, Universaarl evidence, UAT/training acceptance or explicit assumption status.
- Legacy RM-DEMO, CRONUS and old laboratory material remain archive/reference only unless replaced by Universaarl evidence.

Priority:

1. Chapters 3-8 become Universaarl-first and foundation-aware.
2. Chapter 9 waits for setup-row evidence before final account-determination examples.
3. Chapter 7 waits for foundation gates before master-data instructions become final.
4. Process chapters wait for O2C/P2P/Inventory evidence.

## Phase 6 - Keep project artifacts useful

Current status: ongoing.

Next local artifacts only when they unlock real work:

- `FOUNDATION-READINESS-DECISION.md`
- `UAT-SCENARIO-CATALOG-DRAFT.md`
- Purchasing process training card
- Sales process training card
- Inventory process training card

Avoid:

- new methodology layers
- new subagent frameworks
- micro-state-only commits
- broad RM replacement without Universaarl replacement evidence
- Jira import expansion that does not steer the next BC/training/evidence step

## Current next action

Use this exact order:

1. Keep this roadmap, dashboard, backlog and state aligned.
2. Run local freeze/resume checks.
3. If the freeze remains active, do local-only readiness cleanup.
4. If the freeze is lifted, run `TARGET-075` as read-first only.
5. After TARGET-075, create or update `FOUNDATION-READINESS-DECISION.md`.

## Acceptance criteria

- A new agent can identify the active environment, active company, parked case, resume pilot and no-write boundary from this file.
- Dashboard and state point to this roadmap.
- `TARGET-073` is not resumed by accident.
- `TARGET-075` cannot be interpreted as a setup, master-data, preview or posting case.
- Book, UAT, training and evidence work use the chapter map and training evidence map before claiming readiness.
