# Book as Project Management Model

Status: draft
Purpose: Das komplette Business-Central-Buch als realistisch durchgespieltes Einfuehrungsprojekt strukturieren.
Last reviewed: 2026-07-05

## Core idea

The book is not only a Business Central manual. It is the documented journey of a realistic implementation project.

The reader should experience:

- how a BC project starts
- what a consultant asks the customer for
- what data the customer sends
- how the data is reviewed
- which Jira tickets are opened
- which design decisions are made
- how setup is implemented in Business Central
- when configuration packages or imports are better than manual UI
- how Playwright proves selected steps
- how UAT and training are prepared
- how the customer learns to operate the solution
- how risks, gaps and open decisions are handled

The book should feel like a consultant is taking the reader through a real project, not like a list of pages and buttons.

Use `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md` and `PROJECT-STORYLINE-DRAFT.md` to keep the project human and consistent. Characters should represent real project roles and recurring responsibilities, but all named people are fictional case-study characters.

## Narrative model

Every major chapter should contain a project layer and a Business Central layer.

```text
Project situation
  -> customer question or business need
  -> Jira tickets opened
  -> customer data requested
  -> customer data received
  -> consultant review and decision
  -> BC setup or process implementation
  -> Playwright/evidence validation
  -> UAT and customer acceptance
  -> training/handbook output
  -> book conclusion and next project step
```

## Chapter pattern

Each chapter should answer these questions.

### 1. Project context

- Where are we in the implementation project?
- Which workstream and epic does this belong to?
- Which business problem are we solving?
- Which role owns the topic on customer side?
- Which earlier decision or data packet is required?

### 2. Jira view

- Which epic/story/task represents this chapter?
- Which data requests, decisions, risks or UAT scenarios are linked?
- What is Definition of Ready?
- What is Definition of Done?

### 3. Customer request

- What do we ask the customer for?
- Why do we need it?
- In which format should they provide it?
- What deadline and owner would exist in a real project?
- What happens if the data is missing or poor?

### 4. Customer response

- What did the fictional customer provide?
- Which sample files or tables exist?
- Which fields are complete?
- Which fields are missing or suspicious?
- Which questions go back to the customer?

### 5. Consultant review

- What does a BC consultant check?
- Which Microsoft/BC concept applies?
- Which implementation route is best?
- Which options were considered?
- Which risks are accepted, mitigated or parked?

### 6. Business Central implementation

- What is configured or reviewed in BC?
- Which fields/pages matter?
- Which route is used: UI, Assisted Setup, configuration package, Excel import, API, AL or no-change/park?
- How do we prove the result?
- What is not proven yet?

### 7. Playwright and evidence

- What scenario can Playwright repeat?
- What start state and test data are required?
- What visible evidence proves the claim?
- What screenshot is useful for the book?
- Which part is only lab, book-candidate or final?

### 8. UAT and training

- What should a key user test?
- What should an end user learn?
- What common mistakes should be explained?
- What exercise belongs in the sandbox?
- What acceptance criterion closes the ticket?

### 9. Book curation

- What belongs in reader-facing prose?
- What stays internal project/evidence material?
- Which source claims need citations?
- Which sandbox observations are safe to describe?
- Which next chapter follows naturally?

## Book parts as project phases

### Part 1: Project mobilization

Purpose:

- Introduce Universaarl.
- Explain project governance.
- Create the first Jira structure.
- Define roles, data strategy, evidence rules and training philosophy.

Project artifacts:

- project plan
- workstream map
- risk register
- decision log
- initial customer data catalog

BC content:

- environment and company context
- Business Central navigation and role centers
- sandbox boundary

### Part 2: Discovery and customer data

Purpose:

- Treat the fictional customer as a real customer.
- Request data in realistic templates.
- Review completeness and quality.

Project artifacts:

- data requests
- discovery tickets
- process inventory
- company profile

BC content:

- company information
- departments, dimensions and reporting needs
- process areas

### Part 3: Solution blueprint

Purpose:

- Decide how Universaarl should use standard Business Central.
- Keep fit-to-standard thinking visible.

Project artifacts:

- decision records
- risks
- fit-gap notes
- route decisions

BC content:

- finance foundation design
- product/master-data design
- process design for purchasing, sales and inventory

### Part 4: Finance and system foundation

Purpose:

- Build setup that later processes depend on.

Project artifacts:

- finance epics
- setup tasks
- data validation notes
- Playwright evidence
- UAT scenarios

BC content:

- chart of accounts
- posting groups
- VAT/USt setup
- dimensions
- number series
- journals
- bank basis

### Part 5: Master data and scalable setup

Purpose:

- Show both individual UI understanding and realistic bulk setup.

Project artifacts:

- data import tasks
- configuration package decisions
- data quality risks
- training materials

BC content:

- customers
- vendors
- items, services and non-inventory items
- units of measure
- categories, attributes and variants
- prices and conditions

### Part 6: Core business processes

Purpose:

- Run the customer business through Business Central.

Project artifacts:

- process epics
- UAT scenarios
- defects
- process evidence

BC content:

- purchasing / Source-to-Pay
- sales / Order-to-Cash
- inventory, costing and stock control
- warehouse where in scope

### Part 7: Controls, reporting and operations

Purpose:

- Make the system usable and governable.

Project artifacts:

- security matrix
- workflow decisions
- report requirements
- support model

BC content:

- users and roles
- permissions
- approval workflows
- reporting and dimensions
- job queues and operational checks where relevant

### Part 8: UAT, training, cutover and hypercare

Purpose:

- Prepare the customer to accept and operate the solution.

Project artifacts:

- UAT plan
- training matrix
- customer handbook
- go-live checklist
- hypercare model

BC content:

- end-to-end acceptance scenarios
- role-based training exercises
- correction and escalation examples

### Part 9: Lessons learned and project system

Purpose:

- Show how the project learns.

Project artifacts:

- retrospective
- backlog
- skill/helper improvements
- evidence debt
- next-phase roadmap

BC content:

- what remains phase 2
- advanced areas
- ongoing operations

## Fictional customer data rule

Simulated customer data is allowed and useful, but it must be labeled as fictional project data.

Use this wording in internal/project docs:

```text
This is simulated customer data for the Universaarl case study. It is used to make the project realistic and to drive Business Central setup, UAT, training and book examples.
```

Do not pretend fictional data was received from a real customer.

## Ticket-to-book rule

Every major book section should map to at least one project item:

- Epic or Story for the business topic
- Data Request if customer data is needed
- Decision if setup/design route matters
- Risk if a wrong choice can hurt the project
- Playwright Evidence if BC behavior must be proven
- UAT Scenario if customer acceptance is required
- Training Item if the customer must learn it
- Book Output if prose must be curated

## Definition of a project-ready chapter

A chapter is project-ready when it has:

- workstream and epic mapping
- business purpose
- customer input or explicit no-data-needed note
- source/evidence status
- setup/process decision
- Playwright or UAT path where relevant
- customer training output
- book status
- follow-up tickets for open gaps

## Anti-patterns

Avoid:

- chapters that only list UI clicks
- tickets that do not affect data, decisions, evidence, training or book quality
- fictional customer data with no project purpose
- Playwright tests that are not tied to a process, UAT or evidence claim
- book prose that hides uncertainty
- configuration packages without field understanding and validation
- treating Jira as decoration instead of project control
