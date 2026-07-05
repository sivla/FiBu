# Documentation Cadence

Status: draft
Purpose: Keep project documentation current while Business Central, book and Playwright work continues.
Last reviewed: 2026-07-05

## Principle

Documentation is part of the work, not a cleanup activity at the end. Every project step should either improve the system, improve the book, improve repeatability or improve customer understanding.

## Before each work item

Record:

- workstream
- epic
- business purpose
- target BC company/environment
- required customer data
- source and evidence needs
- implementation route candidate
- risks and locked actions
- expected book/training output

If those cannot be named, the work item is a discovery spike, not an execution task.

## During execution

Update when a meaningful event happens:

- a customer decision is made
- a BC setup route changes
- a dependency is discovered
- a Playwright route fails or becomes stable
- a source contradicts an assumption
- a screenshot proves less than expected
- a setup or master-data object changes
- a blocker appears

## After execution

Close the loop:

- What changed?
- What was proven?
- What was not proven?
- What was rejected?
- What belongs in the book?
- What belongs in the customer handbook?
- What should become UAT?
- What should become a skill/helper/capability?
- What follow-up issue is needed?

## Daily or session review

For a long-running goal or queue, run a compact review:

- files changed
- active workstream and epic
- important decisions
- open blockers
- new risks
- new customer data needs
- Playwright stability findings
- book curation impact
- next recommended work item

## Weekly-style project review

When enough work accumulates, review:

- workstream coverage
- unresolved P0/P1 risks
- missing customer data
- source gaps
- UAT readiness
- training readiness
- book final-claim readiness
- Playwright repeatability debt
- old raw material that should be curated or rejected

## Concept realism review

Use `CONCEPT-REALISM-REVIEW-CADENCE-DRAFT.md` when the project structure itself may need adjustment.

Run it:

- after several meaningful project-template changes
- before milestone readiness claims
- when Jira/Confluence/spec-driven structure feels heavy or unclear
- when evidence contradicts the current concept
- when external Microsoft guidance or implementation best practice changes the expected route
- before promoting major handbook/book material

The review must produce one of:

- no-change verdict with reason
- decision update
- risk update
- backlog change
- parked/rejected concept
- source/evidence follow-up

Do not run concept reviews as ceremony. If no artifact changes and no decision is made, explicitly record why the current model still stands.

## Evidence rules

Use these categories:

- `source-backed`: official source supports the product or method claim.
- `observed-universaarl`: current sandbox observation in active target company.
- `playwright-repeatable`: same route can be rerun in a stable way.
- `book-candidate`: useful but not final.
- `final`: source/evidence/curation gates are satisfied.
- `rejected`: tried and not suitable.
- `blocked`: cannot proceed without data, source, tool, permission or decision.

## Documentation files to update

Use the smallest relevant file:

- Work breakdown: when structure changes.
- Jira model: when issue types, labels or workflow changes.
- Artifact templates: when repeatable templates improve.
- Customer data catalog: when data requirements become clear.
- Decision log: when a route or architecture choice is made.
- Risk register: when project risk changes.
- Book files: only when text is source/evidence-ready for readers.
- Skills/capabilities: when an agent behavior should persist.

## Quality bar

Good documentation should answer:

- What are we doing?
- Why does it matter for the customer?
- Why is this the right BC route?
- What data do we need?
- What proof do we have?
- What does the customer need to learn?
- What does the book say?
- What should the agent do better next time?

If a document cannot answer any of those questions, it is probably noise.
