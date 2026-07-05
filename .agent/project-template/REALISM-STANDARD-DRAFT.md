# Realism Standard Draft

Status: draft
Purpose: Qualitaetsstandard, damit Universaarl wie ein echtes Business-Central-Projekt wirkt und nicht wie eine perfekte Demo.
Last reviewed: 2026-07-05

## Core rule

Universaarl is fictional, but the project behavior must be realistic.

Every project artifact should pass this question:

```text
Would a serious Business Central consultant, project manager, key user or customer sponsor recognize this as plausible project work?
```

If not, the artifact must be rewritten, marked as simplified training material, or parked.

## What realistic means

Realistic does not mean messy for entertainment. It means believable project behavior:

- customer data is incomplete on first delivery
- people have limited availability
- some people own two roles
- decisions have trade-offs
- scope is phased
- not every topic is phase 1
- configuration and migration data are handled differently
- manual UI is used for learning, not for every bulk setup
- UAT finds issues
- training reveals misunderstandings
- Playwright proves repeatable behavior, not business acceptance
- tax/legal claims have review boundaries
- some risks remain open at milestones
- cutover has timing, owner and fallback questions

## Realism gates

### Customer gate

Customer artifacts should include:

- named fictional owner
- business purpose
- realistic due date or project timing
- missing/unclear fields where plausible
- follow-up questions
- data quality status
- sign-off or escalation route

Avoid:

- perfect customer data with no cleanup
- one person approving everything
- unexplained assumptions
- data arriving without source or owner

### Project management gate

Tickets should include:

- workstream
- epic
- issue type
- owner or responsible role
- dependency
- Definition of Ready/Done
- risk or decision when relevant
- acceptance output

Avoid:

- tickets that only restate a chapter title
- dozens of decorative tickets
- tasks with no decision, data, setup, evidence, UAT, training or book effect

### Business Central gate

BC work should include:

- business reason
- setup/data prerequisites
- implementation route decision
- source or BC concept explanation
- expected BC result
- validation route
- correction/rollback/park strategy

Avoid:

- clicking through BC only because a page exists
- treating configuration packages as magic
- treating one screenshot as full process proof
- final claims without source/evidence

### Training gate

Training should include:

- audience
- learning objective
- prerequisite knowledge
- exercise
- expected result
- common mistakes
- escalation path
- handbook output
- evidence/UAT status

Avoid:

- generic training that does not match a role
- training on behavior not yet proven or sourced
- technical Playwright probe steps as customer exercises

### Story gate

Scenes and characters should include:

- project purpose
- decision, conflict, data issue or learning point
- connection to ticket/workstream
- output that changes project state

Avoid:

- office-drama scenes
- long personal backstory
- dialogue that does not teach BC, project work, evidence or training
- characters asking artificial questions only to explain documentation

### Evidence gate

Evidence should include:

- environment and company
- source or sandbox basis
- visible proof or explicit limitation
- repeatability status
- training/book usefulness
- what remains unproven

Avoid:

- "it worked once" as a final claim
- hidden screenshots with no learning value
- Playwright proof treated as UAT acceptance

## Realistic imperfections to include

Use these intentionally when they help teach project behavior:

- missing VAT review
- incomplete posting group mapping
- customer/vendor data without payment terms
- item list mixing inventory items, services and non-inventory items
- departments that are unclear as dimensions or role groups
- warehouse locations that are physical but not yet BC locations
- management asking for reports before dimensions are stable
- purchasing wanting speed while finance wants controls
- UAT finding a process gap
- training revealing that users confuse list, card and posted document
- cutover checklist blocked by opening balances

Each imperfection must produce a project artifact:

- data request
- decision
- risk
- backlog task
- UAT defect
- training note
- book boundary

## Realistic simplifications

Some simplification is allowed because this is still a book and sandbox project. Mark it clearly.

Allowed simplifications:

- smaller data volumes than a real customer
- fictional but plausible customer names
- reduced chart of accounts starter scope
- phase-1 process subset
- screenshots from a sandbox instead of production
- simulated customer meetings
- synthetic Excel/table data instead of real files

Not allowed:

- pretending simplified data is complete production data
- pretending a sandbox exercise is legal/tax approval
- pretending a Playwright run is customer sign-off
- pretending all modules are phase 1

## Realistic project timeline

Use a phased timeline rather than an instant build:

1. Mobilization
2. Discovery
3. Data request and data review
4. Solution blueprint
5. Foundation setup
6. Master data and migration preparation
7. Process build
8. System/integration checks
9. UAT
10. Training
11. Cutover simulation
12. Hypercare and lessons learned

Every chapter should know which phase it belongs to.

## Realistic role pressure

Characters should have believable constraints:

- Mara Stein wants outcomes and risk visibility, not every setup detail.
- Jonas Weber wants finance control and compliance boundaries.
- Lena Hartmann wants practical correction paths.
- Tobias Brandt wants purchasing speed.
- Pia Neumann wants sales usability and reliable customer data.
- Elena Fischer wants physical warehouse reality reflected in BC.
- Sami Yilmaz has to manage access and legacy data exports.
- Julia Meier needs training dates, participants and materials early.
- Adrian Vogt rejects weak BC routes.
- Eva Krueger blocks finance claims without source/evidence.
- Milena Brand challenges poor data quality.
- Robin Adler refuses fragile Playwright proof.
- Jana Weiss keeps internal evidence language out of the book.

## Realism checklist

Before marking a chapter, training module, ticket group or scenario as ready:

- Does it have a realistic owner?
- Does it use believable data?
- Does it include missing information or validation where plausible?
- Does it show a decision or trade-off?
- Does it avoid perfect demo behavior?
- Does it choose a realistic implementation route?
- Does it distinguish source, evidence, assumption and recommendation?
- Does it produce customer-facing value?
- Does it have a training or UAT implication where relevant?
- Does it avoid overclaiming?

## Status values

Use these labels:

- `realism-draft`
- `realism-reviewed`
- `too-demo-like`
- `needs-customer-data`
- `needs-decision`
- `needs-evidence`
- `training-simplification`
- `book-simplification`
- `realistic-enough-for-now`

## Next refinement

Apply this standard first to:

- `PROJECT-STORYLINE-DRAFT.md`
- `PROJECT-SCENE-CARDS-DRAFT.md`
- `CUSTOMER-DATA-SIMULATION-DRAFT.md`
- `ROLE-BASED-TRAINING-MATRIX-DRAFT.md`
- first future training module cards
