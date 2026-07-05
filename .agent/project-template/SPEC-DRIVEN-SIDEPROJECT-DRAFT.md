# Spec-Driven Sideproject Draft

Status: draft
Purpose: Pruefen, ob OpenSpec/Spec-Driven-Development als Vorbild fuer Universaarl Business Central Projekt, Buch, Jira, Training, UAT und Playwright-Evidence taugt.
Last reviewed: 2026-07-05

## Short recommendation

Use the OpenSpec idea, but do not adopt raw OpenSpec as the only project structure yet.

The useful pattern is:

- persistent specs in the repo instead of requirements trapped in chat
- one change folder per meaningful initiative
- proposal, requirements, design and tasks before execution
- archive completed changes into the current source of truth
- review intent before reviewing only output

For Universaarl, the pattern must be extended. This is not only software delivery. It is a Business Central implementation, a book, a customer-training package, a Jira-like project file, a sandbox evidence system and an agent-learning system. A custom `BCSpec` template is more useful than plain OpenSpec until we have proven the workflow on one pilot.

## Research basis

OpenSpec positions itself as a lightweight, open-source spec-driven framework for AI coding assistants. Its core value is agreeing on specs before implementation, keeping each change in its own folder with proposal/specs/design/tasks, and preserving context in repository files.

OpenSpec concepts map cleanly to our need for durable context:

- `openspec/specs/` is the source of truth for agreed behavior.
- `openspec/changes/<change-id>/` holds a proposed modification.
- change artifacts include proposal, delta specs, design and tasks.
- archive merges completed deltas into the current specs.
- custom schemas and project config can define team-specific workflows.

GitHub Spec Kit is a stronger, more structured alternative with constitution/spec/plan/tasks/implement flow. It is useful for disciplined feature delivery, but it is heavier and more code/product oriented than this BC book/project system currently needs.

Sources reviewed:

- https://openspec.pro/
- https://github.com/Fission-AI/OpenSpec
- https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md
- https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md
- https://github.com/github/spec-kit

## Fit for Universaarl

### Strong fit

- Prevents chat-only decisions from disappearing.
- Gives the long-running goal agent a stable source of intent.
- Makes every larger change reviewable before execution.
- Connects naturally to Jira-style tickets, tasks and acceptance criteria.
- Helps separate current agreed project state from proposed improvements.
- Supports brownfield work because we can introduce it incrementally.

### Weak fit if used raw

- OpenSpec is primarily optimized for code changes.
- Our outputs include customer data requests, BC configuration, UAT, training, book curation and Playwright evidence.
- The default proposal/spec/design/tasks set does not explicitly ask for source basis, BC route comparison, customer owner, data quality, training impact or book claim boundaries.
- Without a custom schema, it can become duplicate documentation next to Jira/backlog files.

## Recommended sideproject: BCSpec

Create a small domain-specific spec-driven layer called `BCSpec`.

BCSpec should behave like OpenSpec in spirit but include Business Central implementation artifacts:

```text
.agent/spec-driven/
  README.md
  constitution.md
  specs/
    project-management/spec.md
    case-study-core/spec.md
    finance-foundation/spec.md
    master-data-product/spec.md
    purchasing/spec.md
    sales/spec.md
    inventory/spec.md
    warehouse/spec.md
    training-handbook/spec.md
    playwright-evidence/spec.md
    book-curation/spec.md
  changes/
    <change-id>/
      proposal.md
      requirements.md
      project-impact.md
      customer-data.md
      implementation-route.md
      decision-risk.md
      evidence-plan.md
      training-uat.md
      book-curation.md
      tasks.md
      acceptance.md
      archive-note.md
```

Do not create this as the canonical root until the first pilot proves value. For now, keep the sideproject documented inside `.agent/project-template/`.

## BCSpec workflow

1. Discover
   - What business/project/book problem are we solving?
   - Which customer roles, data, BC areas and sources are involved?
   - What do we already know, and what must be researched?

2. Propose
   - Why do this now?
   - What changes?
   - What is explicitly out of scope?
   - Which workstream, epic, book chapter and training module are affected?

3. Specify
   - Write requirements as `MUST`, `SHOULD` or `MAY`.
   - Add Given/When/Then scenarios where behavior can be proven.
   - Separate BC product behavior from project-management behavior and book/training behavior.

4. Design route
   - Compare manual UI, Assisted Setup, templates, configuration packages, Excel import, API, AL extension and park/no-change where relevant.
   - Explain why the selected route is realistic for a medium/large customer.
   - Define cleanup, rollback or safe-park handling.

5. Plan evidence
   - Define official source needs.
   - Define sandbox observation needs.
   - Define Playwright repeatability requirements.
   - Define UAT and training proof boundaries.

6. Task
   - Convert work into Jira-like issues.
   - Keep task size small enough to be executed and reviewed.
   - Mark parallelizable tasks only when they do not write the same files or BC objects.

7. Execute
   - Do the work.
   - Keep raw execution separate from book/handbook prose.
   - Record findings, blockers and route changes.

8. Archive
   - Merge accepted requirements into the current project specs.
   - Update book, training, Jira/backlog, decision/risk and evidence maps.
   - Reject or park unproven claims.

## Artifact templates

### proposal.md

```text
Change ID:
Title:
Status:
Workstreams:
Owner:
Problem:
Why now:
In scope:
Out of scope:
Expected customer value:
Expected book value:
Expected training value:
Expected Playwright/evidence value:
Dependencies:
```

### requirements.md

```text
Requirement:
Priority: MUST | SHOULD | MAY
Type: BC behavior | project behavior | training behavior | book behavior | evidence behavior
Rationale:
Scenario:
  Given:
  When:
  Then:
Evidence needed:
```

### project-impact.md

```text
Affected workstreams:
Affected epics:
Jira issue candidates:
Customer roles:
Data requests:
Decisions:
Risks:
Milestone impact:
```

### implementation-route.md

```text
Candidate routes:
- manual UI:
- Assisted Setup:
- templates:
- configuration package:
- Excel import:
- API:
- AL extension:
- no-change/park:
Recommended route:
Reason:
Validation route:
Cleanup/rollback/park:
```

### evidence-plan.md

```text
Official source basis:
Sandbox observation:
Playwright scenario:
Screenshot truth:
UAT scenario:
Training exercise:
Book claim boundary:
Repeatability status:
```

### acceptance.md

```text
Done only when:
- project impact is mapped
- customer data need is explicit
- implementation route is justified
- sources or evidence are named
- UAT/training impact is handled
- book output is curated or rejected
- decisions/risks are updated
- follow-up tickets exist for gaps
```

## First pilot

Pilot change:

`BCSPEC-001-master-data-product-training-and-evidence`

Reason:

WS04 already exists as a draft and is a good test case because it touches customer data, vendor/customer/item setup, templates, configuration packages, Playwright evidence, UAT, training and book curation. It is complex enough to prove whether BCSpec adds structure, but not so broad that it becomes a second project plan.

Pilot rule:

Use BCSpec only to guide one next refinement. Do not move the whole project into `.agent/spec-driven/` yet.

## Adoption rule for the long-running goal agent

The running goal should not be interrupted mid-action. At the next safe checkpoint, it can be steered like this:

```text
Before starting the next major BC/book/training/evidence change, create or update a BCSpec-style change note. Include proposal, requirements, project impact, customer data, implementation route, evidence plan, training/UAT impact, tasks and acceptance. Then execute only the tasks that are ready. If this creates duplicate Jira/book/project documentation, consolidate rather than adding another layer.
```

## Risks

- BCSpec can become project-management theater if it does not change execution quality.
- It can duplicate Jira/backlog files unless every BCSpec change points to concrete work items.
- It can slow down small edits if used too broadly.
- It can create false confidence if requirements are written but not backed by Microsoft sources, sandbox observation, Playwright or UAT.

## Decision gate

After the first pilot, decide one of three routes:

1. Keep BCSpec as a lightweight project-template discipline.
2. Create `.agent/spec-driven/` as a real local structure without installing OpenSpec.
3. Install OpenSpec and fork/customize a schema for BCSpec once the artifact set is stable.

The default recommendation is route 1 until the pilot proves that the extra layer improves quality.
