# Agent Operating Model Draft

Status: draft
Purpose: Schlankes Rollen-, Routing- und Governance-Modell fuer Agentenarbeit am Universaarl Business Central Implementierungsbetriebssystem.
Last reviewed: 2026-07-05

## Core decision

Use multiple agent roles only when they improve project quality, not because multi-agent work sounds advanced.

The default remains:

- one accountable orchestrator
- clear project context
- explicit evidence/source gates
- no parallel writes to the same truth
- no parallel Business Central execution in `playthru`

Specialized agents are used as reviewers, researchers, workers or curators with narrow mandates. They do not create a second project truth.

## Why this exists

This project is now large enough that one general-purpose run can blur too many concerns:

- Business Central consulting judgment
- solution architecture
- project management
- Jira/Confluence structuring
- customer onboarding
- data requirements
- Playwright evidence
- training and handbook writing
- book curation
- repo/tooling cleanup

Specialized agent roles can help when they reduce context pollution, make reviews more critical, and keep routine work away from expensive reasoning. They hurt when they create coordination overhead, duplicate documentation or conflicting edits.

## Non-negotiable rules

- One orchestrator owns the current truth for a run.
- Subagents produce bounded outputs, not final project decisions.
- Only one agent may write canonical project files for one work package unless the orchestrator explicitly merges outputs.
- Only one agent may run Business Central or Playwright against `playthru` at a time.
- No agent may act in another BC instance or tenant.
- No agent may promote raw Playwright output directly into customer handbook or book text.
- No agent may use a stronger model class without a task reason and, where required, model-usage logging.
- No agent may add new dependencies or tooling architecture without an actual project blocker or explicit approval.

## Relationship to existing routing

This model extends the existing local routing files:

- `.agent/model-routing.md`
- `.agent/model-routing.json`
- `.agent/subagent-routing.md`
- `.agent/autopilot.md`

It does not replace them.

Recommended task classes:

| Agent role | Typical taskclass | Why |
| --- | --- | --- |
| Orchestrator / BC Program Lead | `judge_work` for decisions; `wizard_work` for integration edits | Owns project coherence and merges outputs. |
| BC Consultant / Solution Architect Reviewer | `judge_work` or rare `big_brain_review` | Reviews BC truth, architecture, route choices and risk. |
| Research Agent | `monkey_work` for source gathering; `judge_work` for synthesis | Collects Microsoft Learn/MB-800/BC docs and marks uncertainty. |
| Jira/Confluence Blueprint Agent | `wizard_work` or `judge_work` | Turns specs, data requests and workstreams into usable PM artifacts. |
| Training/Handbook Curator | `wizard_work` or `judge_work` | Produces customer-readable material from approved sources/evidence. |
| Playwright Evidence Agent | `wizard_work` for scripts; `judge_work` for risky BC route decisions | Plans or executes evidence, but exclusively in `playthru`. |
| Mechanical Cleanup Agent | `monkey_work` | Tables, links, status sync, formatting and validation. |

Use `big_brain_review` only for decisions with broad consequences: new operating model acceptance, risky posting/setup strategy, final book/handbook claim policy, or major architecture route.

## Agent roles

### 1. Orchestrator / BC Program Lead

Purpose:

- hold the overall goal
- choose the next best work package
- decide which specialist is needed
- merge outputs into project truth
- protect scope, realism and human usability

May write:

- dashboard
- decision/risk registers
- refinement backlog
- project operating docs
- final integrated drafts

Must check:

- project goal
- newest files
- git status
- conflicts with parallel work
- customer/project value

### 2. BC Consultant / Solution Architect Reviewer

Purpose:

- review whether a proposed BC route makes sense
- compare standard, assisted setup, templates, configuration packages, Excel, API, AL, integration and park/no-change
- check fit-to-standard, maintainability, data model, security, migration, reporting and upgrade impact
- challenge book/training claims that overreach evidence

Output:

- review findings
- route recommendation
- risks and assumptions
- required sources/evidence
- clear approve/park/rework decision

Must not:

- perform mass edits
- execute BC actions
- write customer-facing prose as final

### 3. Research Agent

Purpose:

- gather official Microsoft sources
- compare MB-800/Microsoft Learn guidance with project assumptions
- summarize current product/implementation guidance
- identify gaps where sandbox evidence or customer decision is needed

Output:

- source list
- short synthesis
- claims that are source-backed
- claims that remain assumptions
- recommended project artifacts to update

Must prefer:

- Microsoft Learn
- Business Central docs
- Dynamics 365 implementation guide
- MB-800-oriented learning paths
- official product/release documentation

Community sources are advisory only.

### 4. Jira/Confluence Blueprint Agent

Purpose:

- turn a workstream or spec into Jira/Confluence-ready structure
- keep Jira human-manageable
- keep Confluence useful as project knowledge, not dumping ground
- map data requests, decisions, risks, UAT, training, evidence and handbook outputs

Output:

- epic/story/task candidates
- Confluence page outline
- owner/status/acceptance suggestions
- dependency map
- import-readiness notes

Must not:

- create new Jira issue types without explicit approval
- duplicate existing docs
- turn small tasks into large specs

### 5. Training/Handbook Curator

Purpose:

- convert approved project knowledge into customer-readable training and handbook material
- keep role, exercise, common mistake, escalation and evidence boundary explicit
- separate internal agent/evidence language from customer-facing language

Output:

- training module cards
- handbook sections
- control questions
- UAT/training linkage
- claim status: draft, evidence-needed, UAT-needed, final-candidate, rejected

Must not:

- publish unproven behavior as final
- include raw Playwright or agent logs in customer text

### 6. Playwright Evidence Agent

Purpose:

- plan and execute repeatable evidence for Business Central behavior
- improve selectors/helpers only when an actual blocker shows the need
- verify context, company and safety before action

Hard boundary:

- practical BC/Playwright work only in `playthru`
- target company must be verified before any scenario
- default company target is `UNIVERSAARL-DE`
- no parallel Playwright/BC execution agents

Before execution, it must document:

- purpose
- instance and company
- read-only or write intent
- expected result
- safety/cleanup/park strategy
- linked Jira/spec/UAT/training/book purpose

Must stop if:

- environment is not `playthru`
- company is wrong or unclear
- a write is not authorized by a case/gate
- evidence would not serve a project purpose
- route becomes fragile or context is unclear

### 7. Mechanical Cleanup Agent

Purpose:

- do bounded, low-risk maintenance
- normalize tables
- sync file indexes
- find broken links
- summarize diffs
- extract status values
- run deterministic checks

Must not:

- decide BC architecture
- approve final book/handbook claims
- change route decisions
- perform BC/Playwright actions

## When to use specialized agents

Use a specialized agent when at least one is true:

- a work package has a clear specialist output
- a second critical view reduces risk
- source research can run separately from integration
- mechanical cleanup would waste high-reasoning context
- Playwright/evidence planning needs focused safety checks
- training/handbook prose needs separation from technical evidence
- a major decision needs maker-checker review

Do not use a specialized agent when:

- the task is small enough for one pass
- the agent would read the same huge context again without adding judgment
- outputs would need heavy reconciliation
- multiple agents would write the same files
- Business Central execution would become concurrent
- the goal is only to make the workflow feel advanced

## Recommended orchestration patterns

### Default: single orchestrator

Use for:

- normal project-template edits
- small documentation updates
- narrow Jira/Confluence refinements
- simple code/script fixes
- status/check runs

### Maker-checker

Use for:

- BC route decisions
- final handbook/book claim readiness
- data-migration assumptions
- UAT/training acceptance gates
- risky setup/posting decisions

Pattern:

```text
Maker drafts route/artifact.
Checker reviews against acceptance criteria.
Maker revises or orchestrator parks/rejects.
```

### Sequential handoff

Use for:

- research -> blueprint -> training -> evidence plan
- discovery -> spec -> Jira tasks -> handbook output

Pattern:

```text
Research Agent produces source-backed findings.
Blueprint Agent maps them to Confluence/Jira.
Orchestrator integrates.
Reviewer approves or parks.
```

### Concurrent analysis

Use sparingly for read-only work:

- source comparison
- file inventory
- status audits
- link/table cleanup

Never use concurrent execution for:

- Business Central writes
- Playwright live actions
- editing the same canonical files
- final route decisions without orchestrator merge

## Handoff template

Every subagent-style handoff should use this compact shape:

```text
Role:
Task:
Input files/sources:
Do not touch:
Expected output:
Decision authority: propose | review | execute | final
Allowed tools:
BC/Playwright allowed: no | read-only | execute-with-gate
Target environment: playthru only, if applicable
Acceptance criteria:
Stop conditions:
Model/taskclass:
```

## Output contract

Specialist outputs should include:

- summary
- files/sources read
- proposed changes or findings
- risks
- assumptions
- evidence/source status
- recommended next action
- whether orchestrator merge is required

No specialist output is final until the orchestrator either merges, rejects or parks it.

## Measurement

The model is useful only if it improves project delivery.

Track:

- fewer contradictory project docs
- fewer unreviewed final claims
- fewer repeated Playwright route failures
- clearer data-request ownership
- fewer broad context loads for simple tasks
- fewer expensive model uses for mechanical work
- fewer follow-up correction loops
- no concurrent `playthru` conflicts

If those metrics get worse, reduce agent usage.

## Rollout plan

### Phase 1: Documented manual roles

Use this file as a checklist. No new automation.

### Phase 2: Prompt library

Create reusable prompts for:

- BC Architect Review
- Source Research
- Jira/Confluence Mapping
- Training/Handbook Curation
- Playwright Evidence Planning
- Mechanical Cleanup

### Phase 3: Deterministic routing

Use existing scripts and model-routing files to recommend taskclass/model level before spawning or delegating.

### Phase 4: Controlled automation

Only if phases 1-3 prove value:

- allow automated specialist runs for read-only research or cleanup
- keep orchestrator merge mandatory
- keep `playthru` execution exclusive

## Anti-patterns

Avoid:

- many agents with unclear ownership
- agents writing overlapping docs
- a research agent making final BC setup decisions
- a training agent finalizing unproven behavior
- a Playwright agent clicking in BC without project purpose
- a strong model doing table cleanup
- a small model deciding tax, posting, security or architecture risk
- treating agent output as customer-facing text without curation
- using multi-agent orchestration to avoid making a decision

## Current recommendation

Adopt this model now as governance.

Do not build new automation yet. Use specialist roles manually and only automate once there is evidence that:

- the role repeatedly helps
- the handoff format is stable
- the output reduces rework
- no `playthru` or project-truth conflicts occur
