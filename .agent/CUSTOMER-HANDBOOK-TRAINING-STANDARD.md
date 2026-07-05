# Customer Handbook and Training Standard

Status: active
Purpose: Make every Business Central topic useful as book chapter, customer handbook section and training guide.
Last reviewed: 2026-07-05

## Core rule

Every important Business Central topic must help a customer understand, decide, execute and verify work in Business Central. A good chapter is not only a click path. It explains the business concept, the Business Central object, the required data quality, the user role, the daily process, the check after the process and the correction route.

Use this standard before treating a book section, UAT scenario or Playwright evidence pack as customer-ready.

## What the customer must understand

For each topic, identify:

- business terms a key user must know
- Business Central concepts used in daily work
- decisions the customer must be able to make
- dependencies to setup, master data, documents, journals, entries and reports
- consequences of wrong setup, wrong master data or wrong posting
- when a normal user can proceed and when escalation to key user, admin or consultant is needed

If this cannot be explained in customer language, the topic is not ready for final book text.

## Training view by role

Each process or setup topic should classify training needs by role:

- Accounting: posting groups, VAT, G/L accounts, journals, entries, corrections and reconciliation.
- Purchasing: vendors, purchase documents, receipts, invoices, approvals, item charges and corrections.
- Sales: customers, quotes, orders, shipments, invoices, prices, credit checks and corrections.
- Warehouse and inventory: items, locations, journals, picks, put-aways, counts, item ledger entries and value entries.
- Management: reports, dimensions, KPIs, financial statements, exception review and approval visibility.
- Key users: setup ownership, master-data quality, UAT scenarios, process variants and escalation paths.
- Administrators: permissions, role centers, workflows, job queues, integrations, audit settings and support diagnostics.

Not every chapter needs every role. The author must name which roles are affected and which roles are not in scope.

## Handbook section pattern

Customer-facing handbook sections should contain:

- short business explanation
- when to use the process
- required setup and master data
- step-by-step user action
- required fields and why they matter
- safe buttons versus data-changing buttons
- expected Business Central result
- how to verify success
- common mistakes and visible symptoms
- correction, reversal, cleanup or escalation route
- role boundary: normal user, key user, admin or consultant
- sandbox exercise when useful
- control questions when the topic is important for training

The final book may use prose instead of this exact list, but the content must be present somewhere in the chapter, training note or handbook artifact.

## Evidence and Playwright training value

Playwright scenarios should be usable as training proof when practical:

- start state
- role or user perspective
- test data
- user action
- expected Business Central reaction
- screenshot truth
- resulting document, entry, ledger, report or error
- cleanup/keep status
- customer-facing explanation

A technical probe is allowed, but it must not be presented as a customer training scenario. Translate useful technical evidence into a clear handbook instruction before it becomes book text.

## Book quality boundary

The book must not say:

- this case proves
- the agent observed
- evidence file
- result JSON
- later we must
- internal blocker

The book should say:

- what the user sees
- why the step exists
- which field is important
- which action changes data
- what Business Central creates or updates
- how the user checks the result
- what to do when the result is wrong

Internal uncertainty belongs in state, evidence, atlas, source registry, open questions or project backlog. Customer-facing text gets the finished explanation or a plain limitation without internal process language.

## Training readiness gate

A process is not training-ready until it has:

- clear target role
- clear start condition
- clear data prerequisites
- one repeatable path through Business Central
- visible success check
- at least one common mistake or exception note
- source or Universaarl evidence for the main claim
- book wording that a beginner can follow

If a topic lacks these items, mark it as `handbook-draft`, `training-readiness`, `needs-source`, `needs-universaarl-evidence` or `technical-only`, not final.

## Relation to sources

- Microsoft Learn explains Business Central product logic and training concepts.
- Universaarl evidence proves the concrete UI and behavior in `playthru` / `UNIVERSAARL-DE`.
- Official legal or tax sources are required for legal, VAT, GoBD, e-invoice and compliance claims.
- Community sources may suggest routes but do not make a customer-facing claim final.

When source and sandbox behavior disagree, record the difference internally and write the customer text conservatively.
