# Universaarl Execution Roadmap

Status: active-draft
Purpose: Single operating roadmap for the Universaarl Business Central implementation system, from improvement freeze back into read-first foundation validation and later customer-ready process playthrough.
Last reviewed: 2026-07-06

## Sprache und Terminologie

Die führende Projektsprache ist Deutsch. Projektführende, kundenorientierte und buchrelevante Artefakte sollen deutsche Begriffe zuerst verwenden und englische Begriffe nur als Business-Central-, Microsoft-Learn-, Code-, Status- oder Suchhilfe ergänzen.

Leitregel:

- Deutsch zuerst: Debitoren (Customers), Kreditoren (Vendors), Artikel (Items), Sachposten (G/L Entries), Buchungsgruppen (Posting Groups), Nummernserien (Number Series), Konfigurationspakete (Configuration Packages), Buchungsvorschau (Preview Posting), lesender Erstnachweis (Read-first Evidence).
- Technische IDs, Dateinamen, npm-Scripts, JSON-Keys, Playwright-Testnamen, Git-Branches und Statuswerte dürfen technisch oder englisch bleiben, wenn Tooling oder Stabilität davon profitieren.
- Kundenhandbuch, Schulung, UAT und Buch verwenden deutsche Begriffe als führende Begriffe.
- Englische Projektformulierungen in bestehenden Drafts sind Übergangsstand und werden bei substanzieller Bearbeitung schrittweise auf deutsche Leserführung umgestellt.

## Current operating decision

The project is in `Foundation Readiness consolidation after read-first resume`. The earlier `Improvement Freeze / M0-M1 transition` is no longer the active operating phase; it remains the historical transition that led into the current read-first Foundation boundary.

The read-first return has happened. Further live work must now start from the consolidated Foundation boundary, not from stale TARGET-075 preparation or an as-is retry of the parked VAT active-editor route.

| Topic | Current decision |
| --- | --- |
| Target environment | `playthru` only |
| Target company | `UNIVERSAARL-DE` |
| Reference company name | Universaarl GmbH |
| Current live status | read-first resume, customer setup proof and item price/cost proof have produced Foundation/Master-Data dependency evidence; Payment Terms route recovery proved Page 4 through `profile=Business Manager`, NET30 has reopen proof, and `U-ITEM-HW100` has realistic fictional price/cost values in `playthru` |
| Parked case | `TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION` |
| Completed resume pilot | `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK` |
| Next live type | no immediate live run; first consume the Debitor/Artikel evidence in `FOUNDATION-READINESS-DECISION` and decide the VAT-/Posting-Boundary before O2C/P2P |
| Artifact classification | `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` |
| Next local control task | keep roadmap, dashboard, state and artifact classification aligned; demote historical next-step noise instead of adding new layers |

## North star and active truth

This roadmap is the current operating source for the Universaarl Business Central implementation system. The repository is not only a test collection or book draft. It is a reusable customer-project blueprint that should let a Business Central consultant, solution architect, project manager, trainer or future agent understand the next responsible step within minutes.

Active truth:

- Business Central environment: `playthru`
- Target company: `UNIVERSAARL-DE`
- Reference legal entity: Universaarl GmbH
- Currency and market context: EUR, German customer/training logic
- Data realism: real Business Central UI plus customer-project-like Universaarl records with business purpose, owner, dependencies, UAT/training use and setup readiness. These records may be fictional or anonymized, but must behave like real customer input. No UI mockups, throwaway dummy data or confidential real customer data may become evidence, UAT, training or book truth.
- Execution boundary: all practical Business Central and Playwright proof work happens only in `playthru`
- Current local decision: `FOUNDATION-READINESS-DECISION`
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

Latest local check result: Foundation Readiness consolidation, 2026-07-06.

| Check | Result | Roadmap consequence |
| --- | --- | --- |
| `agent:preflight` | passed | Local project state is consistent enough for planning. |
| `check:encoding` | passed | Text files are clean enough for this package. |
| `agent:quality:audit` | passed with risk findings | Quality risks remain visible: active-pilot/core TypeScript coverage only, direct storageState usage and legacy Playwright flake surface. |
| `agent:resume:check` | passed locally | `TARGET-075` is locally prepared, but this does not lift the freeze. |
| `agent:resume:check:overnight` | passed in the latest check | The overnight gate requires at least 9 hours of remaining auth window. If it fails later, refresh auth before unattended or delayed live work. |
| `agent:freeze:status` | historical gate passed for TARGET-075 work | Future live work still requires current case/auth gates. |
| `agent:foundation:decision:check` | passed locally | `FOUNDATION-READINESS-DECISION.md` is the active boundary before Master Data or process work. |
| `npm run fibu:target:foundation-consistency-pilot -- --check` | passed locally | The guarded TARGET-075 runner is ready without opening Business Central. |
| `npm run fibu:target:foundation-consistency-pilot -- --list` | passed, 1 test listed | The TARGET-075 spec is discoverable through the guarded runner. |

TARGET-073B boundary:

- Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was visible in the main Business Central surface.
- Page Inspection confirmed `VAT Posting Setup (472, List)` and table `VAT Posting Setup (325)`.
- `Liste bearbeiten` was visible/activated, but no safe row-scoped active editor was proven.
- No VAT target values were typed; no setup, master data, draft, Preview Posting, Posting, payment, API shortcut or company switch happened.
- Do not repeat TARGET-073B as-is. Foundation Readiness must choose a non-repeating route or consciously keep this as a setup limitation.

Quality-audit boundary:

- `tsconfig.json` covers the active TARGET-075/core TypeScript set, but is not full project health proof yet.
- Auth freshness remains a live-run precondition.
- Legacy waits, force clicks and coordinate clicks remain technical debt.
- TARGET-075 remains a read-first evidence source, not an active next case.
- Cleanup is now bounded. Further work should return to Foundation Readiness, non-repeating route decisions, UAT/training or book/evidence output.

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
2. Dashboard, backlog, state and artifact classification must point to this roadmap.
3. Keep legacy material out of active next-step truth.
4. Remove contradictory next-step language when it suggests broad expansion before the read-first foundation return.
5. Prefer one concrete artifact over another broad review.

Do not:

- add another strategy layer
- create new subagent infrastructure
- expand Jira imports unless they directly support the next BC/training/evidence step
- mass-delete historical evidence without a replacement, supersession or explicit purge decision

## Phase 1 - End freeze safely

German operating note: Freeze read-first abschliessen, then keep live work behind the current Foundation gate.

Current status: completed for the TARGET-075 / Foundation-Readiness handoff.

Before any further Business Central or Playwright live work:

- `npm run agent:preflight`
- `npm run check:encoding`
- `npm run agent:quality:audit`
- `npm run agent:resume:check || true`
- `npm run agent:resume:check:overnight || true`
- `npm run agent:freeze:status || true`
- `npm run agent:target075:readiness`
- `npm run agent:foundation:decision:check`
- `npm run fibu:target:foundation-consistency-pilot -- --check`
- `npm run fibu:target:foundation-consistency-pilot -- --list`

Resume decision:

- `TARGET-073` remains parked.
- `TARGET-075` is completed as read-first evidence.
- `TARGET-073B` is consumed as no-write Page-472 surface/editor evidence and is blocked for as-is retry.
- The next live case must be a materially different Foundation gap case, not another Page-314 direct/search retry or Page-472 active-editor retry.

Any next read-first Foundation case may:

- verify `playthru`
- verify `UNIVERSAARL-DE`
- open one explicitly scoped Foundation page
- capture visible values, screenshots and compact evidence

Any next read-first Foundation case must not:

- write setup
- create or edit master data
- create document drafts
- preview posting
- post
- confirm risky dialogs
- treat visible setup as final accounting, VAT or compliance proof

## Phase 2 - Prove foundation before processes

Current status: active after TARGET-075, PWS-FF-002B and TARGET-073B.

Order:

1. `TARGET-075` - Chart of Accounts / Foundation read-first reopen check. Done as read-first evidence; not a write or posting proof.
2. Starter account visibility read-first proof:
   - targeted Chart of Accounts check for `1200`, `1406`, `1800`, `3300`, `3806`, `4400`, `5400`
   - no account create/edit
   - no SKR04 completeness claim
3. VAT/USt read-first proof:
   - VAT Business Posting Groups
   - VAT Product Posting Groups
   - VAT Posting Setup
   - no final German tax claim
4. Dimensions read-first proof:
   - Dimensions
   - Dimension Values
   - General Ledger Setup read-only
   - no repeated global-dimension write retry without a materially new hypothesis
5. Posting Groups read-first proof:
   - Customer Posting Groups
   - Vendor Posting Groups
   - General Posting Setup
   - missing setup rows are blockers, not guessed values
6. Foundation readiness decision:
   - proven
   - parked
   - blocks master data
   - enough for bookdraft only
   - not enough for posting

Required artifact after Phase 2:

- `FOUNDATION-READINESS-DECISION.md`

## Phase 3 - Build master data as customer project

Current status: prewrite-preflight-next.

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

- `PWS-MD-001` Customer context observed read-first
- `PWS-MD-002` Vendor context observed read-first
- `PWS-MD-003` Item/Service context observed read-first
- `PWS-MD-004` Customer card/template/required-field preflight selected next, no save/no create

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

1. Keep this roadmap, dashboard, backlog and state aligned only when the active truth changes.
2. Do not start another broad cleanup pass.
3. Keep `FOUNDATION-READINESS-DECISION.md` as the active boundary.
4. Do not repeat `TARGET-073` as-is.
5. Consume the latest customer setup route recovery: 3/4 setup pages were recovered in the current runner; Page 312/Geschaeftsbuchungsgruppen remains a runner-specific search blocker but has stronger accepted Universaarl Foundation evidence in `TARGET-032A/TARGET-032B`.
6. Run `CUSTOMER-SETUP-VALUE-WRITE-GATE` next: open `U-CUST-100`, set or verify only Customer Posting Group `INLAND`, Gen. Business Posting Group `INLAND` and Payment Terms Code `NET30`, then capture after and reopen proof. Do not touch VAT, dimensions, payment method, documents, Preview Posting, Posting or API.

## Acceptance criteria

- A new agent can identify the active environment, active company, parked case, resume pilot and no-write boundary from this file.
- Dashboard and state point to this roadmap.
- `TARGET-073` is not resumed by accident.
- `TARGET-073B` cannot be interpreted as an active next case or as a VAT write, setup, master-data, preview or posting case.
- Book, UAT, training and evidence work use the chapter map and training evidence map before claiming readiness.
