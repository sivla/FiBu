# Active Artifact Classification

Status: active-control
Purpose: Keep the Universaarl project steerable by separating active control from work material, reference material, parked history and legacy purge sources.
Last reviewed: 2026-07-06

## Active truth

- Environment: `playthru`
- Company: `UNIVERSAARL-DE`
- Reference entity: Universaarl GmbH
- Live status: Improvement Freeze remains active until resume gates are checked.
- Parked live case: `TARGET-073`
- First allowed resume pilot: `TARGET-075`, read-first and no-write.
- Foundation handoff: `FOUNDATION-READINESS-DECISION.md` follows TARGET-075 before setup, master data or process work.

## Classification rules

| Class | Meaning | Rule |
| --- | --- | --- |
| `active-control` | A file may steer the next action. | Keep short, current and aligned. |
| `active-work` | A file is useful working material for the current roadmap. | Use only through the active-control files. |
| `reference` | A file explains policy, source, skill, training or past decisions. | Read when relevant, but it does not override active-control. |
| `parked` | A file or case is intentionally not active now. | Do not resume without a new decision. |
| `legacy-purge-source` | A file contains old RM/MCP/CRONUS/Rhein-Main patterns that may be mined or ported. | Do not use as active Universaarl truth. |
| `superseded/remove-candidate` | A file or signal should be shortened, archived or removed later. | Do not delete historical evidence blindly. |

## Active-control set

| Artifact | Class | Why it controls |
| --- | --- | --- |
| `README.md` | `active-control` | Root entrypoint for new humans and agents; must not steer to legacy worlds. |
| `HANDOVER.md` | `active-control` | Short handover entrypoint for new Codex accounts; must mirror roadmap, state and freeze/TARGET-075 boundary. |
| `.agent/project-template/README.md` | `active-control` | Short index for the project-template folder; points to classification instead of listing every draft as active. |
| `.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md` | `active-control` | Single current roadmap, freeze/resume order and TARGET-075 boundary. |
| `.agent/TARGET-075-PILOT-READINESS.md` | `active-control` | Concrete TARGET-075 runbook with auth, freeze, runner and no-write gates for the first resume pilot. |
| `.agent/project-template/PROJECT-DASHBOARD-DRAFT.md` | `active-control` | Compact project manager view. |
| `.agent/state/current.json` top-level active truth and `implementationOperatingSystem` block | `active-control` | Machine-readable active instance, company, freeze and next case. |
| `.agent/project-template/REFINEMENT-BACKLOG.md` first sections | `active-control` | Work ordering only when it follows the roadmap. |
| `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` | `active-control` | Explains which files may steer and which are parked/reference/legacy. |
| `.agent/SKILL-SYSTEM.md` | `active-control` | Governs when skills should exist, without expanding a skill library on Vorrat. |

## Active-work set

| Artifact group | Class | Use now |
| --- | --- | --- |
| `.agent/project-template/WORKSTREAM-03-FINANCE-FOUNDATION-JIRA-DRAFT.md` | `active-work` | Finance Foundation planning after TARGET-075. |
| `.agent/project-template/ROUTE-DECISION-CARDS-FOUNDATION-MASTER-DATA-DRAFT.md` | `active-work` | Route decisions before setup/master-data writes. |
| `.agent/project-template/PLAYWRIGHT-SCENARIO-CATALOG-WS02-WS03-WS04-DRAFT.md` | `active-work` | Read-first scenario planning. |
| `.agent/project-template/TRAINING-MODULE-CARDS-DRAFT.md` | `active-work` | Training cards only where dependencies are explicit. |
| `.agent/project-template/WORKSTREAM-BOOK-CHAPTER-MAP-DRAFT.md` | `active-work` | Book patches must use this map before claiming readiness. |
| `.agent/project-template/SIMULATED-DATA-TABLES-CORE-MD-DRAFT.md` | `active-work` | Data packages are Jira-ready, not BC-setup-ready. |
| `playwright/projects/fibu-book5/UNIVERSAARL-CORE-MASTERDATA-PLAN.md` | `active-work` | Core master-data plan follows TARGET-075 and Foundation Readiness before PWS-MD read-first probes or writes. |
| `playwright/projects/fibu-book5/BC-FULL-PLAYTHROUGH-CATALOG.md` | `active-work` | Business Central scope map; follows TARGET-075 then Foundation Readiness, not historical queues. |
| `playwright/projects/fibu-book5/UNIVERSAARL-W1-FOUNDATION-READINESS-GATE.md` | `active-work` | Foundation boundary reference after company creation; aligns first live resume with TARGET-075 read-first/no-write before setup, master data or process work. |

## State and case classification

| Artifact group | Class | Boundary |
| --- | --- | --- |
| `.agent/state/current.json` top-level active fields | `active-control` | Machine-readable active truth; lower historical blocks do not override roadmap/dashboard. |
| `.agent/state/last_run_summary.json` | `active-work` | Read for latest evidence summary only; it does not reopen parked cases. |
| `.agent/state/cases/target-075-chart-of-accounts-reopen-and-setup-consistency-check.json` | `active-work` | Prepared first resume pilot, read-first and no-write. |
| `.agent/state/cases/target-073-vat-page472-active-editor-route-decision.json` and TARGET-071/074 VAT route files | `parked` | Useful blocker history; do not repeat as-is. |
| `.agent/state/book-production-goal.json`, `.agent/state/project_state.json`, `.agent/state/lab_to_german_sandbox_migration_plan.json`, `.agent/state/german-final-rebuild-map.json` | `reference` or `legacy-purge-source` | Contain old RM/MCP/lab framing; mine boundaries only, do not use as active target truth. |
| `.agent/state/marathon.json`, `.agent/state/marathon_queue.json`, `.agent/state/next_10_case_plan.json` | `parked` | Historical queue memory. Roadmap/dashboard choose current sequence. |
| `.agent/state/*audit*.json`, `.agent/state/*coverage*.json`, `.agent/state/open_questions_register.json`, `.agent/state/source_registry.json` | `reference` | Use for evidence, source and quality context when relevant; not a live execution queue. |
| `.agent/state/cases/bank-*`, `.agent/state/cases/fixedassets-*`, `.agent/state/cases/warehouse-*`, older P2P/O2C/lab cases | `legacy-purge-source` or `parked` | Preserve traceability; port patterns to Universaarl only through a new roadmap decision. |

## Reference set

| Artifact group | Class | Boundary |
| --- | --- | --- |
| `.agent/BC-OPERATING-MODEL.md`, `.agent/PLAYTHRU-AUTHORITY-CHARTER.md`, `.agent/SMART-DECISION-GATE.md` | `reference` | Operating principles; do not override freeze/resume roadmap. |
| `.agent/skills/*.md` | `reference` | Use when the pattern applies; do not create new skills without concrete reuse. |
| `.agent/capabilities.json` | `reference` | Capability registry; not a queue. |
| `.agent/project-template/*DRAFT.md` not listed above | `reference` | Read when a workstream needs it; not an active next-step source by itself. |
| `playwright/projects/fibu-book5/BC-*.md` | `reference` | Atlases/source maps/catalogs guide evidence and book work; they do not lift gates. |

## Scripts, tests and evidence classification

| Artifact group | Class | Boundary |
| --- | --- | --- |
| `package.json` active agent checks | `active-control` | Scripts such as `agent:preflight`, `agent:workbreakdown:check`, `check:encoding` and legacy guards protect the control plane. |
| `package.json` direct RM/MCP/CRONUS routes routed through `legacy-script-blocked.mjs` | `parked` | Blocked intentionally; do not bypass to execute historical live routes. |
| Package scripts with `legacy-target-file-reference` findings | `legacy-purge-source` | Warning inventory until the target tests are ported, blocked or archived. |
| `playwright/projects/fibu-book5/tests/*target-075*` | `active-work` | First resume pilot area only, still gated by freeze/resume checks. |
| `playwright/projects/fibu-book5/tests/pws-md-001-customer-context-readonly.spec.ts` and `fibu:pws:md001:customer-context` | `active-work` | Prepared Debitoren/Customer read-first pilot after `FOUNDATION-READINESS-DECISION.md`; not the active live case and no-write. |
| `playwright/projects/fibu-book5/tests/pws-md-002-vendor-context-readonly.spec.ts` and `fibu:pws:md002:vendor-context` | `active-work` | Prepared Kreditoren/Vendor read-first pilot after `FOUNDATION-READINESS-DECISION.md`; not the active live case and no-write/no-payment. |
| `playwright/projects/fibu-book5/tests/pws-md-003-item-service-context-readonly.spec.ts` and `fibu:pws:md003:item-service-context` | `active-work` | Prepared Artikel/Service read-first pilot after `FOUNDATION-READINESS-DECISION.md`; not the active live case and no-write/no-inventory-change. |
| RM-DEMO/MCP/CRONUS/Rhein-Main Playwright tests | `legacy-purge-source` | Reuse helper patterns only after neutralization or Universaarl port. |
| `playwright/projects/fibu-book5/evidence/**` | `reference` or `legacy-purge-source` | Preserve evidence chain; do not edit screenshots/results to make them look current. |

## Parked set

| Artifact or signal | Class | Boundary |
| --- | --- | --- |
| `TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION` | `parked` | Do not repeat without a materially new editor/helper route and explicit decision. |
| `.agent/state/marathon.json` and `.agent/state/marathon_queue.json` | `parked` | Old marathon execution is not the current steering source during freeze. |
| Deep historical `latest*` and old `nextStep` blocks inside `.agent/state/current.json` | `parked` | Historical run memory only; top-level active-control fields win. |
| Old P2P/BANK/FA/RM queue next steps | `parked` | Do not resume until roadmap selects that process again. |

## Legacy-purge-source set

| Artifact group | Class | Boundary |
| --- | --- | --- |
| RM-DEMO/MCP/CRONUS/Rhein-Main Playwright tests | `legacy-purge-source` | Mine patterns, then port/block/archive; not active proof. |
| Old evidence under `playwright/projects/fibu-book5/evidence/` | `legacy-purge-source` or `reference` | Preserve evidence chain; do not mass-edit screenshots/results. |
| Package scripts flagged by `agent:legacy:active-check` as `legacy-target-file-reference` | `legacy-purge-source` | Warning inventory until ported, blocked or archived. |
| `playwright/projects/fibu-book5/UNIVERSAARL-RM-DECOMMISSION-PLAN.md` | `active-work` | Controls legacy cleanup actions, not current BC execution. |
| `playwright/projects/fibu-book5/CURRENT-STATE.md` | `legacy-purge-source` | Historical lab chronology only; its old next-step lines do not steer Universaarl execution. |

## Superseded/remove candidates

| Candidate | Class | Why not delete now |
| --- | --- | --- |
| Duplicated high-level strategy drafts after roadmap consolidation | `superseded/remove-candidate` | Review one by one; some contain decision history. |
| Old local state examples and dry-run examples | `superseded/remove-candidate` | May be useful for schema checks; archive later if unused. |
| Broad review prompts converted into dashboard/backlog decisions | `superseded/remove-candidate` | Keep until a clean project archive exists. |

## Known contradictions and read rule

- If a lower historical state block disagrees with the roadmap, the roadmap wins.
- If a package script target contains legacy terms but the script name is not directly legacy, treat it as warning inventory, not active truth.
- If a file says to resume TARGET-073, P2P, BANK, FA or RM-DE-LAB directly, treat that instruction as parked unless the roadmap is updated first.
- If a book/training file still sounds like RM-DEMO/CRONUS is the live customer story, classify it as `legacy-purge-source` until rewritten for Universaarl.

## Batch review

This batch makes the project easier to steer because it defines which files are allowed to control next actions and demotes historical next-step noise without deleting evidence.
