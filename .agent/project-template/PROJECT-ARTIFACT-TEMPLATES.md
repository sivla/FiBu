# Project Artifact Templates

Status: draft
Purpose: Reusable templates for Jira-style issues and project documentation.
Last reviewed: 2026-07-05

## Epic template

```text
Title:
Workstream:
Business process:
BC module/pages:
Purpose:
Customer outcome:
In scope:
Out of scope:
Dependencies:
Required customer decisions:
Required customer data:
Implementation route candidates:
Source requirements:
Playwright/evidence requirements:
UAT requirements:
Training output:
Book output:
Risks:
Acceptance criteria:
Done when:
```

## Story template

```text
Title:
Parent epic:
Role/persona:
Business need:
Current process:
Target BC behavior:
Setup/data required:
Evidence required:
Acceptance criteria:
Training note:
Book note:
Open questions:
```

## Task template

```text
Title:
Parent story:
Action:
Target company/environment:
Preconditions:
Steps:
Expected result:
Evidence to capture:
Risk/locked action:
Cleanup or park strategy:
Result:
Follow-up:
```

## Data request template

```text
Title:
Workstream:
Epic:
Data object:
Example: customers, vendors, items, bank accounts, opening balances, open purchase orders
Data type: configuration data | master data | opening balance | open transaction | reference data
Customer owner:
Required format:
Required fields:
Optional fields:
Validation rules:
Due date:
Used for:
Import route candidate:
Risks if missing:
Status:
```

## Decision record template

```text
Decision title:
Date:
Workstream/Epic:
Decision owner:
Problem:
Options considered:
Recommended option:
Reason:
Source basis:
Sandbox/evidence basis:
Customer impact:
Book impact:
Playwright impact:
Risks:
Reversal/correction path:
Status:
```

## Risk template

```text
Risk title:
Workstream/Epic:
Severity: P0 | P1 | P2 | P3
Probability: low | medium | high
Impact:
Trigger:
Mitigation:
Owner:
Due date:
Related decisions:
Related data requests:
Status:
```

## UAT scenario template

```text
Scenario title:
Workstream/Epic:
Business role:
Purpose:
Preconditions:
Test data:
Steps:
Expected BC result:
Expected ledger/document/report result:
Evidence:
Pass/fail criteria:
Customer tester:
Defects:
Acceptance status:
```

## Training item template

```text
Training title:
Workstream/Epic:
Target role:
Learning objectives:
Prerequisite knowledge:
Business context:
BC concepts:
Daily-use steps:
Exceptions and corrections:
Common mistakes:
Practice exercise:
Control questions:
Handbook output:
```

## Book output template

```text
Chapter/section:
Workstream/Epic:
Reader promise:
Business context:
BC concept:
Implementation decision:
Steps described:
Source-backed claims:
Sandbox observations:
Playwright evidence:
Screenshots:
Warnings/boundaries:
Customer training note:
Status: raw | book-candidate | final | rejected | blocked
```

## Playwright evidence template

```text
Scenario title:
Workstream/Epic:
BC process:
Target company/environment:
Start state:
Test data:
Actions:
Expected visible result:
Expected backend/business result:
Screenshots:
Selectors/helper needs:
Known fragile points:
Cleanup/keep strategy:
Repeatability status:
Book usefulness:
```

## Skill/helper improvement template

```text
Improvement title:
Triggered by:
Problem pattern:
Affected tests/pages/processes:
Desired new behavior:
Proposed helper/skill/capability:
Validation:
Documentation update:
Priority:
Status:
```
