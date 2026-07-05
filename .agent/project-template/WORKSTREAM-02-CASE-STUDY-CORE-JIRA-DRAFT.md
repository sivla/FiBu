# WS02 Case Study Core Jira Draft

Status: draft
Purpose: Jira-faehige Ausarbeitung fuer Universaarl als realistische Business-Central-Fallstudie, bevor Finance, Master Data und Prozessbuchungen weiter ausgebaut werden.
Last reviewed: 2026-07-05

## Workstream summary

`WS02-CASE-STUDY-CORE` schafft die fachliche Basis der Universaarl-Fallstudie. Der Workstream klaert, welche Firma im Buch aufgebaut wird, welche Organisation dahintersteht, welche Rollen und Standorte relevant sind, welche Business-Central-Company als erster Aufbaupunkt dient und welche Grenzen fuer Quellen, Evidence, Training und Buchclaims gelten.

Dieser Workstream ersetzt keine Finance- oder Stammdateneinrichtung. Er verhindert, dass Finance, Dimensionen, Kontenplan, Buchungsgruppen, USt, Rollen, Lagerorte oder Trainingsszenarien isoliert erfunden werden.

## Workstream outcomes

- Universaarl wirkt wie eine echte mittelstaendische Firma, nicht wie ein Testdatensatz.
- `playthru` und `UNIVERSAARL-DE` sind als erste aktive Zielumgebung eingeordnet.
- Mehrere spaetere Universaarl-Companies bleiben geplant, aber `UNIVERSAARL-DE` bleibt der erste stabile Foundation-Aufbaupunkt.
- Rollen, Abteilungen, Standorte, Verantwortlichkeiten und Schulungsgruppen sind als Projektkontext vorhanden.
- Customer-data-Requests `DR-CORE-001` und `DR-CORE-002` sind mit BC-Nutzung, Buchwirkung, UAT und Trainingsausgabe verbunden.
- Legacy/RM/CRONUS wird nur noch als historische Lernquelle behandelt.
- Das Buch bekommt eine kuratierte Fallstudien-Einfuehrung ohne Agenten- oder Evidence-Metasprache.

## Epic CS-01: Company Story and Legal Entity Model

### Story: Define Universaarl as a realistic customer

Issue type: Story
Business purpose: Die Fallstudie braucht ein Unternehmen, dessen Setup-Entscheidungen fachlich begruendet werden koennen.
Customer data: `DR-CORE-001 Company information`
Implementation route: local project definition first; BC write only in later gated cases.
Source/evidence: project template, Microsoft Learn for company/environment concepts, sandbox observation for visible company state.
Risk: A thin company story turns later setup into arbitrary clicks.
Training/book output: beginner-friendly introduction to company, environment, legal entity and implementation scope.
Playwright/UAT output: later read-only company context scenario in `playthru` / `UNIVERSAARL-DE`.

Acceptance criteria:

- Legal name, first target company, country/region, currency, language, fiscal-year assumption and contact roles are captured or explicitly marked open.
- The book can explain why a separate Business Central company is needed.
- The draft does not claim tax/legal finality without official or expert review.
- Legacy company names are not active target truth.

### Story: Decide multi-company roadmap

Issue type: Story
Business purpose: Universaarl is not meant as one flat company forever; later intercompany and specialized companies need a deliberate roadmap.
Customer data: organization model, legal-entity assumptions, country/localization assumptions.
Implementation route: roadmap decision now; additional company creation only through later gated cases.
Source/evidence: `BC-COMPANY-USECASE.md`, project decision log, future Microsoft Learn source mapping for intercompany.
Risk: Treating later companies as optional decoration would make intercompany and international setup feel artificial.
Training/book output: explain why `UNIVERSAARL-DE` starts first and why later companies need their own setup.
Playwright/UAT output: no live scenario yet; future company-registry and intercompany preflight scenarios.

Acceptance criteria:

- `UNIVERSAARL-DE` is named as first German foundation company.
- Future companies such as production, sales, service or holding are roadmap items, not current setup facts.
- Intercompany is marked as mandatory later topic, but blocked until multiple companies and foundation data exist.
- Foreign companies are not assigned SKR04 by default; they need their own localization decision.

## Epic CS-02: Organization, Locations and Responsibility Model

### Story: Collect organization model

Issue type: Data Request
Business purpose: Departments, sites and process owners drive dimensions, roles, training, reporting and UAT.
Customer data: `DR-CORE-002 Organization model`
Implementation route: collect/simulate locally before any BC dimension or user setup.
Source/evidence: customer-data catalog and simulation draft.
Risk: Dimensions and roles become unstable if departments or locations are invented late.
Training/book output: explain cost centers, departments, sites and role ownership in customer language.
Playwright/UAT output: later dimension and role-center tests can reference stable names.

Acceptance criteria:

- Departments, cost centers, physical locations, business units and process owners are listed or marked open.
- Each organization value is classified as legal entity, location/site, dimension candidate, role group or reporting-only value.
- Phase-1 values are separated from later expansion.
- Unclear values generate follow-up questions, not silent setup.

### Story: Create role and stakeholder map

Issue type: Story
Business purpose: The book needs recurring voices that represent realistic BC project responsibilities.
Customer data: stakeholder roles, key users, admin roles, training ownership.
Implementation route: local project artifact; no BC user or permission changes.
Source/evidence: `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md`.
Risk: Without roles, training and acceptance become generic.
Training/book output: role-specific learning paths for accounting, purchasing, sales, warehouse, admin and management.
Playwright/UAT output: later UAT scenarios can name the role under test without using real user accounts.

Acceptance criteria:

- Customer leadership, key users, implementation partner roles and training owners are defined as fictional characters.
- Characters are used only to clarify BC/project decisions, not as unrelated fiction.
- No real personal data or auth data is introduced.
- Each key process has at least one business owner and one training audience.

## Epic CS-03: Environment, Company Context and Evidence Boundary

### Story: Define environment and company context rules

Issue type: Story
Business purpose: BC evidence is only useful if the active environment and company are unambiguous.
Customer data: target environment and company registry.
Implementation route: read-only proof before effective BC actions; writes only after gated Smart Decision.
Source/evidence: `BC-COMPANY-USECASE.md`, `COMPANY-REGISTRY.json`, result JSONs from target context cases.
Risk: Data could be created in the wrong company or old evidence could be treated as final.
Training/book output: explain environment vs company in simple customer language.
Playwright/UAT output: reusable company-context proof before setup or process scenarios.

Acceptance criteria:

- Active target world is `playthru` / `UNIVERSAARL-DE`.
- Legacy RM/CRONUS/MCP evidence is classified as archive or learning input only.
- Effective actions require visible company context in the result.
- The book does not use legacy evidence as final Universaarl proof.

### Story: Define screenshot and evidence standards for core context

Issue type: Task
Business purpose: Screenshots should teach the reader and prove the internal state, not merely exist.
Customer data: none.
Implementation route: local quality rule; future Playwright screenshots must include page, company, step, what is visible, what it proves and what it does not prove.
Source/evidence: screenshot inventory, evidence result schema, quality-audit rules.
Risk: Loose screenshots create book noise and weak evidence.
Training/book output: screenshots become explanatory book assets.
Playwright/UAT output: screenshot QA before final book usage.

Acceptance criteria:

- Every future core-context screenshot states page, company, step and learning value.
- Internal evidence language stays out of final book prose.
- Screenshots without explanation are marked draft/rejected/legacy, not final.

## Epic CS-04: Business Central Navigation and UI Baseline

### Story: Establish baseline navigation language

Issue type: Story
Business purpose: Beginners need stable words for Role Center, search, lists, cards, FastTabs, FactBoxes, actions, dialogs and entries.
Customer data: target user roles and language expectations.
Implementation route: source-backed local explanation plus later read-only UI observation.
Source/evidence: Microsoft Learn UI concepts, Universaarl read-only observations.
Risk: Book chapters become fragile click lists if UI concepts are not explained.
Training/book output: first navigation chapter and glossary.
Playwright/UAT output: reusable UI-context detection scenario.

Acceptance criteria:

- The workstream distinguishes list pages, cards, worksheets, dialogs, request pages and entries.
- Search is not used as a blind default when a direct navigation path or page context is known.
- Button/dropdown learning, tooltip learning and layout handling are captured as Playwright requirements.

### Story: Define UI learning feedback loop

Issue type: Task
Business purpose: Repeated UI lessons must become better helpers, skills or capabilities.
Customer data: none.
Implementation route: local rule and later helper backlog.
Source/evidence: previous BC UI blockers, Playwright findings, skill/capability files.
Risk: The agent repeats the same mistake instead of learning BC behavior.
Training/book output: UI behavior becomes teachable content when relevant.
Playwright/UAT output: helper candidates for dropdowns, active editor, dialogs, grids, FastTabs and screenshot QA.

Acceptance criteria:

- A blocker can be classified as selector issue, layout issue, BC concept issue, permission issue or data/setup dependency.
- Repeated blocker patterns create helper/skill/capability backlog entries.
- Live writes are not resumed only because a click path exists; business purpose remains required.

## Epic CS-05: Company Information and Localization Inputs

### Story: Prepare company information setup

Issue type: Story
Business purpose: Company Information is the first visible identity layer for the case-study company.
Customer data: `DR-CORE-001 Company information`
Implementation route: local data readiness first; BC write only with visible company context and source/evidence boundary.
Source/evidence: Microsoft Learn setup guidance, Universaarl result JSONs, customer-data simulation.
Risk: Address, VAT ID or fiscal assumptions could be treated as legal truth without review.
Training/book output: explain which company fields are identity, which affect documents, and which require customer/tax validation.
Playwright/UAT output: future reopen proof for visible company information.

Acceptance criteria:

- Name, address, country/region, currency, language, VAT/tax registration context and fiscal-year assumptions are separated.
- Tax-sensitive fields are marked as requiring review before final book claim.
- The book explains why company information appears on documents and setup screens.

### Story: Decide localization and chart-of-accounts boundary

Issue type: Decision
Business purpose: German Universaarl companies use SKR04-oriented starter accounts, but foreign companies need their own localization path.
Customer data: country/localization scope and company roadmap.
Implementation route: decision record before cross-company setup.
Source/evidence: Microsoft Learn, MB-800-aligned finance setup, future official/tax review where needed.
Risk: Applying SKR04 universally would be wrong for non-German companies.
Training/book output: clear distinction between German starter setup and later country-specific setups.
Playwright/UAT output: future account/checkpoint scenarios per company.

Acceptance criteria:

- `UNIVERSAARL-DE` keeps SKR04-oriented starter scope.
- Foreign companies are parked until their localization, tax and chart-of-accounts route is decided.
- Claims remain "starter" and "phase 1" until validated.

## Epic CS-06: Book Opening, Training and UAT Frame

### Story: Write the project opening as customer-readable book text

Issue type: Book Task
Business purpose: The book needs a strong opening that explains the company and implementation journey without internal agent language.
Customer data: company story, roles, organization model.
Implementation route: local book draft after this workstream is accepted.
Source/evidence: project plan, storyline, stakeholder draft, official BC concepts.
Risk: Raw project notes leak into the book and weaken the reader experience.
Training/book output: chapter opening for Universaarl case study.
Playwright/UAT output: no live scenario; references future proof points.

Acceptance criteria:

- Text explains what a company is, why Universaarl needs one, and why setup order matters.
- No phrases like "Evidence shows", "the agent", "this case proves", or "later must" appear in final book prose.
- Open items are handled as project notes, not as awkward book meta.

### Story: Define role-based training baseline

Issue type: Training Task
Business purpose: The book doubles as customer handbook and training guide.
Customer data: roles, departments, process responsibilities.
Implementation route: local training matrix draft after roles are stable.
Source/evidence: stakeholder map and process workstreams.
Risk: Training becomes generic if it is not tied to roles and BC responsibilities.
Training/book output: learning goals, exercises, support/escalation rules by role.
Playwright/UAT output: future role-based UAT scenario catalog.

Acceptance criteria:

- Finance, purchasing, sales, inventory/warehouse, admin, management and key-user audiences are defined.
- Each role has everyday processes, exception handling and escalation needs.
- UAT scenarios distinguish Playwright repeatability from customer acceptance.

## Workstream-level UAT scenarios

| Scenario | Purpose | Status |
| --- | --- | --- |
| UAT-CS-001 Company context read-only proof | User can identify environment, company and page context before doing setup. | planned |
| UAT-CS-002 Navigation vocabulary check | Key user can explain Role Center, list, card, FastTab, FactBox, action and dialog. | planned |
| UAT-CS-003 Organization-to-dimension review | Key users classify departments/sites as dimensions, locations, roles or reporting-only values. | planned |
| UAT-CS-004 Company information review | Finance/admin validates company information fields before final setup claims. | planned |
| UAT-CS-005 Legacy evidence boundary review | Project team confirms old RM/CRONUS evidence is not final Universaarl proof. | planned |

## Workstream-level training modules

| Module | Audience | Learning goal |
| --- | --- | --- |
| TR-CS-001 Environment and company | All key users | Understand why work must happen in the right BC company. |
| TR-CS-002 Universaarl project story | All project roles | Understand the case-study company and project journey. |
| TR-CS-003 BC page types and navigation | End users and key users | Recognize lists, cards, worksheets, FastTabs, FactBoxes, actions and dialogs. |
| TR-CS-004 Roles and responsibilities | Key users, managers, admins | Know who owns setup, data quality, UAT and daily operations. |
| TR-CS-005 Evidence and finality boundary | Project team and book team | Separate local observation, source-backed product behavior and final claims. |

## Workstream-level book outputs

- Universaarl case-study opening chapter.
- Beginner explanation of environment, company and legal entity.
- Explanation of why `UNIVERSAARL-DE` is the first setup company but not the only future company.
- Role-based introduction to project stakeholders and user groups.
- Navigation primer that supports later click guides without becoming a raw test log.
- Short explanation of why SKR04-oriented starter accounts apply to German Universaarl companies only.

## Workstream-level Playwright scenarios

- Read-only company context proof.
- Role Center/context screenshot QA.
- Companies list / company information read-only validation.
- UI navigation baseline: search, page title, breadcrumb/page caption, FastTabs, FactBox, action dropdowns and tooltips.
- Screenshot metadata writer for page, company, step, visible controls, teaching value and proof boundary.

## Dependencies

- `PROJECT-STORYLINE-DRAFT.md`
- `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md`
- `CUSTOMER-DATA-CATALOG-DRAFT.md`
- `CUSTOMER-DATA-SIMULATION-DRAFT.md`
- `BC-COMPANY-USECASE.md`
- `BC-FULL-PLAYTHROUGH-CATALOG.md`
- `UNIVERSAARL-DATASET-BLUEPRINT.md`
- Future Microsoft Learn source mapping for company/environment, setup, navigation and intercompany.

## Open questions

- Which additional Universaarl companies are part of the first book volume, and which belong to phase 2?
- Which locations are physical inventory locations, which are reporting dimensions, and which are legal entities?
- Which customer roles need BC users in the sandbox, and which remain fictional training personas?
- Which Company Information fields are safe sandbox values and which need tax/legal review before final book claims?
- Should the first book chapter open with project mobilization or directly with environment/company concepts?
- Which UI baseline screenshots are necessary before returning to live W1 Foundation work?
