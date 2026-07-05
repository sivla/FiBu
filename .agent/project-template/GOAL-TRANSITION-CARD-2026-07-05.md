# Goal Transition Card - 2026-07-05

Status: active-transition
Purpose: Aktuellen Langziel-Agenten kontrolliert in das Universaarl Projektmanagement-System ueberfuehren.

## Current goal

Das laufende Ziel bleibt unveraendert: Das FiBu/Business-Central-Projekt soll zu einem dauerhaft lernenden, fachlich starken Buch-, Test- und Automatisierungssystem werden. Universaarl wird als realistische Business-Central-Fallstudie aufgebaut, im Buch erklaert, mit Quellen abgesichert, mit Playwright nachvollziehbar gemacht und ueber Skills/Capabilities verbessert.

Der Improvement Freeze ist weiterhin aktiv. Deshalb wurden keine Business-Central-Live-Aktionen, keine Live-Playwright-Tests und keine Setup-, Stammdaten-, Draft-, Preview-, Posting-, Payment- oder Cleanup-Aktionen ausgefuehrt.

## Current changed files

Aktuell gehoeren diese Aenderungen zum Transition-/Projektmodus-Paket:

- `.agent/project-template/GOAL-TRANSITION-PROTOCOL.md`
- `.agent/project-template/GOAL-TRANSITION-CARD-2026-07-05.md`
- `.agent/project-template/BOOK-AS-PROJECT-MANAGEMENT-MODEL.md`
- `.agent/project-template/BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md`
- `.agent/project-template/CUSTOMER-DATA-SIMULATION-DRAFT.md`
- `.agent/project-template/README.md`
- `.agent/project-template/PROJECT-DASHBOARD-DRAFT.md`
- `.agent/project-template/REFINEMENT-BACKLOG.md`
- `.agent/project-template/DECISION-LOG-DRAFT.md`
- `scripts/agent/workbreakdown-check.mjs`

Direkt vorher abgeschlossen und gepusht:

- Project plan, workbreakdown, Jira model, customer data catalog, decision log, risk register, dashboard and handbook/training standard.
- Commit `ca1b263b agent: add customer training project governance`.

## Current active work

Der sichere Checkpoint ist erreicht: Die lokale Governance-/Training-/Projektakte steht als Draft-System. Der naechste Schritt ist nicht, im alten Queue-Modus weiterzuarbeiten, sondern neue Arbeit im Projektmodus zu starten.

Zusaetzlich ist festgehalten, dass das Buch selbst wie ein durchgespieltes Business-Central-Einfuehrungsprojekt strukturiert werden soll: Projektlage, Kundenfrage, Jira-Tickets, Kundendaten, Consultant Review, BC-Umsetzung, Evidence, UAT, Training und Buchtext bilden eine zusammenhaengende Kapitelmechanik.

## Workstream mapping

- Primary workstream: `WS01-GOVERNANCE`
- Secondary workstream: `WS14-BOOK-PLAYWRIGHT-LEARNING`
- Supporting workstreams affected later: `WS02-CASE-STUDY-CORE`, `WS03-FINANCE-FOUNDATION`, `WS04-MASTER-DATA-PRODUCT`, `WS13-UAT-TRAINING-CUTOVER`

## Epic mapping

- `WS01` Epic: Project charter and scope
- `WS01` Epic: Jira structure and work item policy
- `WS01` Epic: Decision log and risk register
- `WS14` Epic: Book structure and chapter curation
- `WS14` Epic: Skills and capabilities
- `WS14` Epic: Coverage and final-claim governance

## Issue type mapping

- `Decision`: Transition long-running goals into the project system.
- `Task`: Write and maintain transition protocol/card.
- `Risk`: Prevent old queue/execution habits from bypassing project gates.
- `Book Output`: Keep book work mapped to workstreams and customer-facing quality.
- `Training Item`: Ensure future customer-facing work includes training/handbook impact.
- `Playwright Evidence`: Map future Playwright scenarios to UAT/evidence outputs instead of raw test names.
- `Skill/Helper Improvement`: Convert repeated blockers into durable agent behavior.

## Customer data impact

No new customer data was invented or assumed.

Current data impact:

- Existing data requests remain draft in `CUSTOMER-DATA-CATALOG-DRAFT.md`.
- `CUSTOMER-DATA-SIMULATION-DRAFT.md` beschreibt, wie fiktive Kundendatenpakete fuer Universaarl realistisch angefordert, geprueft und genutzt werden.
- The transition makes missing data visible before future setup/process work.
- Immediate next data refinement should focus on `DR-CORE-001`, `DR-CORE-002`, `DR-FIN-001`, `DR-FIN-002`, `DR-FIN-003` and `DR-FIN-004`.

## Decision impact

Decision added:

- `DEC-006 Transition long-running goals into the project system`

Decision effect:

- Old mode is not deleted, but every larger new work item must start with workstream, epic, issue type, business purpose, customer data, implementation route, source/evidence, risk, training/book and Playwright/UAT impact.
- TARGET-073 remains parked under the existing project decision unless a new helper/source basis changes the route.

## Risk impact

Risks reinforced:

- `RISK-001 Raw automation becomes book content`
- `RISK-003 Finance foundation becomes too micro-case driven`
- `RISK-004 Playwright routes are not repeatable`
- `RISK-008 Project documentation becomes noise`
- `RISK-009 Parallel agent changes create worktree conflicts`

No new P0/P1 risk is introduced by this transition card. The main mitigation is to keep project docs compact, mapped and useful.

## UAT and training impact

Future work must explicitly state:

- target role
- learning objective
- daily-use action or decision
- expected Business Central result
- visible validation
- common mistake or exception
- correction or escalation route

The transition itself does not create a passed UAT or completed training. It creates the operating frame for later UAT/training work.

## Book impact

The book remains the primary product, not a byproduct of tests.

Impact:

- Future book work must map to a workstream/epic.
- Raw evidence is not book text.
- Customer-facing sections must be readable as Fachbuch, Kundenhandbuch and Schulungsleitfaden.
- Universaarl stays active target world; RM-DEMO/CRONUS remain legacy/reference only.
- `BOOK-AS-PROJECT-MANAGEMENT-MODEL.md` ist der neue Leitfaden dafuer, dass Kapitel nicht nur BC-Funktionen erklaeren, sondern auch die zugehoerige Projektentscheidung, Kundendatenanforderung, UAT-/Trainingslogik und Buchkuratierung zeigen.

## Playwright and evidence impact

No live Playwright test was run.

Future Playwright work must map to:

- business process or setup goal
- UAT or evidence status
- source/evidence need
- screenshot truth
- repeatability status
- book/training usefulness

Technical probes remain internal until translated into customer-facing meaning.

## Next recommended project item

Best next project item:

```text
Workstream: WS02-CASE-STUDY-CORE
Epic: Company story and organizational model
Issue type: Story / Data Request / Book Output
Business purpose: Make Universaarl specific enough that setup decisions are no longer arbitrary.
Customer data: DR-CORE-001 company information and DR-CORE-002 organization model.
Implementation route: local project definition first; no BC live action while freeze remains active.
Source/evidence: Microsoft Learn/MB-800 structure plus existing Universaarl state, no new claims without source/evidence.
Risk: Missing customer model causes arbitrary setup and weak book narrative.
Training/book: establish roles, departments, locations, products and beginner narrative.
Playwright/UAT: later map company/context checks and foundation read-only pilot to this story.
```

Secondary next item:

- Continue refining `WS03-FINANCE-FOUNDATION` only after the case-study core has enough company data to justify finance setup decisions.

## What will not be touched

- No Business Central live access.
- No Live-Playwright run.
- No setup, master data, draft, Preview Posting, Posting, payment or cleanup.
- No TARGET-073 retry.
- No old Evidence deletion or mass RM/CRONUS replacement.
- No broad package/script refactor.
- No secret/auth files.
- No invented customer facts.

## Project-mode default from here

Every larger new work item starts with:

```text
Workstream:
Epic:
Issue type:
Business purpose:
Customer data needed:
Implementation route:
Source/evidence needed:
Risk:
Training/book output:
Playwright/UAT output:
```
