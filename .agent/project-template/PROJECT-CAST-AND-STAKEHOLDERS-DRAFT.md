# Project Cast and Stakeholders Draft

Status: draft
Purpose: Fiktive, aber realistisch wirkende Personen und Rollen fuer die Universaarl Business Central Projektstory.
Last reviewed: 2026-07-05

## Fiction rule

All people in this file are fictional characters for the Universaarl case study. They are designed to make the book and project simulation realistic.

Use this disclaimer when needed:

```text
All named people are fictional characters in the Universaarl case study. They represent realistic project roles, responsibilities, conflicts and learning needs.
```

## Why characters matter

The book should not feel like an abstract product manual. Real projects are shaped by people:

- sponsors define value and scope
- key users provide process knowledge
- finance owns posting risk
- warehouse users reveal practical process gaps
- IT owns users, roles and integrations
- consultants challenge assumptions
- trainers translate setup into daily work
- project managers protect scope, decisions and cadence

Characters should appear repeatedly so the reader understands how Business Central implementation decisions emerge from real conversations.

## Customer organization: Universaarl GmbH

Universaarl is a fictional mid-sized German company with finance, purchasing, sales, inventory and warehouse processes. The first active company is `UNIVERSAARL-DE` in environment `playthru`.

### Customer leadership

| Person | Role | Also responsible for | Project behavior |
| --- | --- | --- | --- |
| Mara Stein | Managing Director / Executive Sponsor | final priority and scope calls | Wants a clean go-live story, dislikes technical detail unless risk or cost is involved. |
| Jonas Weber | CFO / Finance Process Owner | sponsor deputy, final finance sign-off | Strong on accounting control, worries about VAT, posting groups and reporting accuracy. |
| Claudia Schulte | Controller | dimensions, management reporting, financial reports | Pushes for useful reporting and challenges overcomplicated account structures. |
| Robert Klein | External Tax Advisor | VAT and compliance review | Not a daily BC user; reviews tax-sensitive decisions and boundaries. |

### Customer key users

| Person | Role | Also responsible for | Project behavior |
| --- | --- | --- | --- |
| Lena Hartmann | Accounting Lead / Finance Key User | UAT lead for finance, customer/vendor posting group review | Very practical, knows old Excel processes, wants clear correction paths. |
| Tobias Brandt | Purchasing Manager | vendor master owner, purchasing UAT | Wants purchasing to be fast; accepts controls when they do not slow daily work too much. |
| Pia Neumann | Sales Operations Lead | customer master owner, sales UAT | Wants pricing, customer terms and documents to be reliable and easy to explain. |
| Elena Fischer | Inventory and Warehouse Lead | stock counts, location/bin process, warehouse training | Cares about physical reality: where goods are, who moves them, and what happens when counts differ. |
| Sami Yilmaz | IT and Microsoft 365 Admin | users, roles, security groups, environment access, data exports | Owns practical access questions and often helps extract legacy data. |
| Julia Meier | Training Coordinator | scheduling, attendance, role-based training logistics | Makes sure training is not just a document, but something users actually attend and practice. |

## Implementation partner team

### Core team

| Person | Role | Also responsible for | Project behavior |
| --- | --- | --- | --- |
| Nora Becker | Project Manager | plan, Jira hygiene, meetings, risks, decisions | Keeps scope and cadence clean; asks for owners and due dates. |
| Adrian Vogt | Senior BC Solution Architect | solution coherence, fit-to-standard, route decisions | Self-confident BC architect; challenges weak paths and avoids unnecessary customization. |
| Eva Krueger | BC Finance Consultant | GL, posting groups, VAT boundary, dimensions, journals | Explains accounting consequences and asks for source/evidence before final claims. |
| Felix Roth | BC Supply Chain Consultant | purchasing, sales, inventory, warehouse | Keeps product model, inventory valuation and warehouse execution separated. |
| Milena Brand | Data Migration Lead | templates, configuration packages, import validation | Pushes against manual bulk entry and insists on data quality gates. |
| Tom Seidel | Test and UAT Lead | UAT catalog, defects, acceptance | Converts process promises into testable scenarios. |
| Sarah Klein | Trainer and Handbook Lead | role-based training, customer handbook, exercises | Translates BC setup into what users must learn and practice. |
| Robin Adler | Playwright Evidence Engineer | repeatable UI proof, screenshot truth, helper debt | Treats automation as evidence, not as random clicking. |
| Jana Weiss | Book Curator | chapter flow, reader language, final-claim quality | Turns project/evidence material into readable book chapters. |

## Dual-role examples

Real projects often have people with multiple responsibilities. Use these deliberately in the story:

- Jonas Weber is CFO and sponsor deputy.
- Lena Hartmann is finance key user and finance UAT lead.
- Sami Yilmaz is IT admin and legacy data extraction coordinator.
- Tobias Brandt owns purchasing process and vendor master quality.
- Pia Neumann owns sales process and customer master quality.
- Elena Fischer owns inventory process and warehouse training acceptance.
- Adrian Vogt acts as solution architect and final reviewer for BC route decisions.
- Sarah Klein owns both training design and customer handbook consistency.
- Robin Adler owns both Playwright proof and automation learning feedback.

## Character tension patterns

Use realistic tensions to make the book practical:

### Finance control vs process speed

Jonas and Lena want correct posting groups, VAT and dimensions. Tobias and Pia want purchasing/sales to stay quick. The consultant must explain which controls are required and which are optional.

### Manual understanding vs scalable setup

Key users need to understand how records are created manually. Milena pushes for configuration packages or imports when data volume is too large for UI entry.

### Reporting ambition vs setup complexity

Claudia wants detailed reporting. Adrian challenges whether a need belongs in the chart of accounts, dimensions, reports or Power BI.

### Warehouse reality vs system design

Elena explains that goods move in physical steps. Felix separates item master data, inventory valuation and warehouse execution so setup does not blur the process.

### Evidence vs assumption

Robin refuses to call something proven because it "looked right once". Jana refuses to turn raw test output into final book text.

### Tax sensitivity

Robert Klein does not operate BC daily but must review VAT-sensitive claims. The book must distinguish BC product behavior from tax/legal finality.

## Project ceremonies with characters

### Kickoff

Participants:

- Mara Stein
- Jonas Weber
- Nora Becker
- Adrian Vogt
- Eva Krueger
- Felix Roth
- Sami Yilmaz

Purpose:

- align scope
- explain project phases
- confirm sandbox boundary
- introduce data request process
- agree that the book follows the project journey

### Finance discovery workshop

Participants:

- Jonas Weber
- Lena Hartmann
- Claudia Schulte
- Eva Krueger
- Adrian Vogt

Purpose:

- chart of accounts
- posting groups
- VAT assumptions
- dimensions
- reporting
- finance UAT

### Master data workshop

Participants:

- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Milena Brand
- Felix Roth

Purpose:

- customers
- vendors
- items/services
- data quality
- templates and configuration packages

### Inventory and warehouse workshop

Participants:

- Elena Fischer
- Felix Roth
- Claudia Schulte
- Milena Brand
- Robin Adler

Purpose:

- item types
- locations
- opening inventory
- warehouse scope
- inventory valuation evidence

### UAT planning session

Participants:

- Tom Seidel
- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Elena Fischer
- Sarah Klein
- Robin Adler

Purpose:

- define scenarios
- assign testers
- define pass/fail
- connect Playwright evidence to UAT
- identify training needs

### Training readiness review

Participants:

- Julia Meier
- Sarah Klein
- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Elena Fischer
- Sami Yilmaz

Purpose:

- role-based training plan
- handbook readiness
- exercises
- support and escalation rules

## Speaking style for the book

Characters should appear in short, useful scenes. Do not turn the book into fiction for its own sake.

Good use:

```text
Lena Hartmann, the accounting key user, asks why a customer posting group is needed when the customer card already has an account number. Eva uses this question to explain that Business Central does not post directly from the customer number; it derives G/L accounts through posting setup.
```

Bad use:

```text
Long personal backstory, office drama or dialogue that does not teach a BC or project point.
```

## Character-to-workstream map

| Workstream | Primary customer characters | Partner characters |
| --- | --- | --- |
| WS01 Governance | Mara, Jonas, Sami | Nora, Adrian |
| WS02 Case Study/Core | Mara, Jonas, Sami, Julia | Nora, Adrian, Jana |
| WS03 Finance Foundation | Jonas, Lena, Claudia, Robert | Eva, Adrian, Robin, Jana |
| WS04 Master Data/Product | Lena, Tobias, Pia, Elena | Felix, Milena, Eva |
| WS05 Purchasing | Tobias, Lena | Felix, Eva, Tom, Sarah |
| WS06 Sales | Pia, Lena | Felix, Eva, Tom, Sarah |
| WS07 Inventory | Elena, Claudia, Jonas | Felix, Eva, Milena, Robin |
| WS08 Warehouse | Elena, Sami | Felix, Tom, Sarah |
| WS09 Security/Workflows | Sami, Jonas, Lena, Tobias, Pia | Adrian, Nora |
| WS10 Reporting | Claudia, Jonas, Mara | Eva, Adrian |
| WS11 Data Migration/Integration | Sami, Lena, Tobias, Pia, Elena | Milena, Adrian |
| WS13 UAT/Training/Cutover | Julia, all key users | Tom, Sarah, Nora |
| WS14 Book/Playwright/Learning | all as chapter voices | Robin, Jana, Adrian |

## Next refinement

Create scene outlines for:

1. kickoff and project mobilization
2. first finance data request
3. chart of accounts review
4. posting group decision
5. master data package review
6. first purchasing UAT
7. first sales UAT
8. inventory opening stock decision
9. training readiness review
10. go-live simulation review
