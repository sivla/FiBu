# Concept Realism Review Cadence Draft

Status: draft
Purpose: Wiederkehrende kritische Reviews, ob das Gesamtprojekt, die Projektmethode, Jira/Confluence-Struktur, BC-Route, Schulung, Evidence und Buchkuratierung realistischer oder schlanker angepasst werden muessen.
Last reviewed: 2026-07-06

## Core decision

The project must regularly review itself.

This is not a one-time blueprint exercise. Universaarl should keep improving as a realistic Business Central implementation project, and the general blueprint should stay useful for human project managers, consultants, solution architects, trainers, key users and customers.

Recurring concept reviews are required because:

- Dynamics 365 projects are business transformation projects, not only technical projects.
- Governance, project approach, training, data, testing and adoption must be reviewed and adapted during the lifecycle.
- Business Central implementation reality changes as customer data, sandbox evidence, UAT feedback and training gaps appear.
- The repo can easily drift into documentation theater, agent theater or demo-perfect fiction unless reviewed deliberately.

## Source basis

Primary Microsoft sources:

- Dynamics 365 Success by Design: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design
- Dynamics 365 implementation guide overview: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview
- Project governance: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/project-governance
- Project approach: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/project-governance-project-approach
- Testing strategy: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy
- Training process and best practices: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/training-strategy-process-and-best-practices

External advisory sources:

- Consulting-house benchmark review: `CONSULTING-HOUSE-BENCHMARK-REVIEW-DRAFT.md`
- Atlassian retrospectives: https://www.atlassian.com/team-playbook/plays/retrospective
- Atlassian agile retrospectives: https://www.atlassian.com/agile/scrum/retrospectives
- PMI lessons learned: https://www.pmi.org/learning/library/lessons-learned-sharing-knowledge-8189
- Prosci change management: https://www.prosci.com/change-management
- Prosci change management best practices: https://www.prosci.com/blog/change-management-best-practices
- Partner/advisory Dynamics implementation articles may be used as weak signals through the consulting-house benchmark, never as final authority.

Source hierarchy:

1. Microsoft Learn, Business Central docs, Dynamics 365 implementation guidance, MB-800 and Microsoft release documentation.
2. Universaarl sandbox evidence from `playthru` / `UNIVERSAARL-DE`.
3. Jira/Confluence-style project artifacts in this repo.
4. UAT/training feedback and customer-role plausibility.
5. Atlassian, PMI, Prosci and reputable partner articles as method/adoption benchmarks, filtered through `CONSULTING-HOUSE-BENCHMARK-REVIEW-DRAFT.md`.
6. Community sources only as prompts for further verification.

## Review cadence

### 1. Session concept pulse

Run after any meaningful work session or long-running goal checkpoint.

Timebox: 10-15 minutes.

Question:

Did this work make the project more realistic, more useful and easier to run, or did it only add material?

Required outputs:

- one dashboard/backlog update if direction changed
- one decision/risk if the project route changed
- one parked item if an idea is good but premature

### 2. Weekly-style concept review

Run when enough work has accumulated, or after several workstreams/documents changed.

Timebox: 30-60 minutes.

Review:

- project plan still matches current work
- Jira structure still human-manageable
- Confluence/spec-driven model still useful
- customer data requests are clear and realistic
- BC route choices are standard-oriented and justified
- training and handbook are tied to actual roles
- Playwright evidence supports the claims it is used for
- book output is curated and not test-log shaped
- agent operating model improves quality rather than ceremony
- open decisions and risks are visible

Required outputs:

- concept review note
- updated next recommended work
- accepted/parked/rejected improvement list

### 3. Milestone concept review

Run at the end of each major milestone:

- M0 Project mobilized
- Kickoff ready
- Discovery complete
- Solution Blueprint ready
- Build/configuration ready
- Migration readiness
- UAT readiness
- Training readiness
- Go-live readiness
- Hypercare/retrospective

This is the strongest review. It may change project structure, workstream order, Jira model, data model, training plan or book architecture.

Required outputs:

- milestone review page
- updated decision log
- updated risk register
- updated refinement backlog
- readiness verdict: ready, ready-with-risks, parked, rework-needed

### 4. Source refresh review

Run when:

- a Microsoft product/implementation claim matters
- a release-sensitive feature is used
- an MB-800 or Microsoft Learn path is relevant to the next workstream
- a partner/community best practice is used
- a final handbook/book claim is promoted

Required outputs:

- sources checked
- changed or confirmed claim boundaries
- source-backed vs assumption status
- follow-up research item if unresolved

### 5. Post-evidence realism review

Run after any meaningful Playwright/Business Central evidence package.

Question:

Did the evidence prove the project claim, or only a technical observation?

Required outputs:

- evidence status
- book/handbook claim boundary
- UAT/training impact
- route adjustment if BC behavior differs from expectation
- helper/capability improvement if repeatability failed

### 6. Adoption and training review

Run before training material becomes final-candidate and again before UAT/go-live readiness.

Review:

- Does each role know what changes for them?
- Is there awareness, motivation, knowledge, ability and reinforcement?
- Are exercises realistic?
- Are common mistakes and escalation paths documented?
- Are new users supported after go-live?
- Does the handbook teach daily work rather than only setup screens?

Required outputs:

- training readiness verdict
- handbook gaps
- adoption risks
- UAT/training follow-up tickets

## Review dimensions

Every concept realism review scores these dimensions:

| Dimension | Review question | Verdict |
| --- | --- | --- |
| Customer realism | Would a real customer understand their role, data, decisions and workload? | pass / weak / fail |
| PM realism | Could a human PM run this in Jira/Confluence without drowning? | pass / weak / fail |
| Consultant realism | Does this reflect how a BC consultant would actually discover, decide, configure and teach? | pass / weak / fail |
| Architect realism | Is the route standard-oriented, maintainable, secure, scalable and upgrade-friendly? | pass / weak / fail |
| Data realism | Are data owners, format, validation, timing, blockers and quality gaps explicit? | pass / weak / fail |
| BC realism | Is the Business Central behavior sourced, observed or honestly marked as assumption? | pass / weak / fail |
| Evidence realism | Does Playwright prove the intended claim, not just a screen? | pass / weak / fail |
| Training realism | Can users learn and perform the process, including mistakes and escalation? | pass / weak / fail |
| Book realism | Does the book read as curated guidance rather than raw execution log? | pass / weak / fail |
| Tool realism | Do Jira, Confluence, GitHub, BCSpec and agents reduce friction rather than add ceremony? | pass / weak / fail |
| External benchmark realism | Do reputable consulting-house signals reveal a real missing project ingredient, or only generic marketing noise? | pass / weak / fail |

Any `fail` verdict must create one of:

- decision
- risk
- backlog item
- parked item
- rejected item

## Review template

```text
Review ID:
Date:
Review type: session | weekly-style | milestone | source-refresh | post-evidence | adoption-training
Reviewer roles:
Scope reviewed:
Files/artifacts reviewed:
Sources checked:

What became more realistic:
What became less realistic:
What is over-modeled:
What is under-specified:
What a real PM would struggle with:
What a real BC consultant would challenge:
What a solution architect would challenge:
What reputable consulting sources would challenge:
What the customer would not understand:
What needs Microsoft source verification:
What needs sandbox/Playwright evidence:
What needs UAT/training feedback:

Verdicts:
- Customer realism:
- PM realism:
- Consultant realism:
- Architect realism:
- Data realism:
- BC realism:
- Evidence realism:
- Training realism:
- Book realism:
- Tool realism:
- External benchmark realism:

Decisions created/updated:
Risks created/updated:
Backlog changes:
Parked/rejected items:
Next review trigger:
```

## Knowledge-data inputs

Each larger review should use a small evidence pack, not vague memory.

Recommended inputs:

- current dashboard
- refinement backlog
- latest changed workstream files
- decision log
- risk register
- data-request status
- route decision cards
- consulting-house benchmark review
- training matrix/module cards
- Playwright scenario/evidence map
- source list from Microsoft Learn and Business Central docs
- one or two external method/adoption references where useful
- recent model/agent usage summary if agent workflow was involved

Do not load everything by default. Use the smallest evidence pack that can answer the review question.

## Escalation rules

Escalate to `judge_work` or BC Architect Reviewer when:

- BC setup, posting, tax/VAT, security, migration or architecture route is affected
- final book/handbook claims may change
- evidence contradicts project assumptions
- the project structure may change significantly
- customer-facing guidance could become misleading

Escalate to `big_brain_review` only when:

- the whole project operating model changes
- a milestone readiness verdict changes
- a risky setup/posting strategy is accepted
- a final blueprint/book policy is approved

## Anti-patterns

Avoid:

- reviews that only praise progress
- reviews without source/evidence input
- reviews that produce no decision, risk, backlog change or explicit no-change verdict
- using external partner articles as authority for BC product behavior
- copying partner marketing language into the project, training or book without a concrete artifact and source/evidence boundary
- changing the project model after every small discomfort
- leaving `fail` verdicts without ownership
- letting review work replace actual implementation, UAT, training or evidence

## Success criteria

This cadence is working when:

- project structure becomes simpler over time, not larger by default
- customer data requirements become clearer
- fewer claims are unsupported
- training becomes more role-realistic
- Playwright evidence maps to useful business questions
- Jira/Confluence artifacts feel human-operable
- route decisions are made earlier and with better evidence
- weak ideas are parked or rejected faster
- the book becomes more curated and less log-like
