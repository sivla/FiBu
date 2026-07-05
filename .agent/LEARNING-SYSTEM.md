# Learning System

This project should learn from every run. A run is incomplete if it only produces a result file but does not improve at least one of evidence, book text, Playwright capability, skill guidance or a documented blocker.

## Learning loop

1. Capture the raw observation.
2. Classify it as one of:
   - `bc-domain-fact`
   - `ui-control-pattern`
   - `playwright-helper-pattern`
   - `book-reader-gap`
   - `customer-training-gap`
   - `safety-gate`
   - `source-research-needed`
   - `mcp-tooling-needed`
   - `tooling-unavailable`
   - `rejected-path`
3. Decide the durable home:
   - BC atlas or coverage file
   - `.agent/capabilities.json`
   - `.agent/skills/*.md`
   - `playwright/core/bc/*`
   - book draft or click guide
   - customer handbook or training artifact
   - open questions register
4. Add a small verification path.
5. Reference the evidence or source that caused the learning.

## Promote to skill

Promote a learning into a skill when at least one is true:

- the same blocker happened twice
- the action is risky enough to require a repeatable gate
- the pattern is needed by more than one module
- an agent repeatedly needs domain knowledge that is not obvious from code
- source research is required before a final book claim

Do not create a skill only because a topic exists. Create it when it changes future behavior.

## Skill backlog

| Candidate | Trigger | First output |
| --- | --- | --- |
| `bc-source-research` | Business Central product, setup, VAT, GoBD, e-invoice, release or best-practice fact is not locally proven | source-backed claim card |
| `bc-active-editor` | A BC grid/list/card field looks editable but Playwright cannot prove a true editor | editor diagnosis JSON |
| `bc-live-run-freeze-review` | Live queue was paused or a case was blocked by repeated UI mechanics | resume/reorder decision |
| `book-claim-auditor` | A book paragraph mixes lab evidence, final claims and internal language | claim boundary patch plan |
| `bc-helper-consolidator` | A test repeats force clicks, timeouts or coordinate logic already seen elsewhere | helper extraction plan |
| `customer-handbook-training-auditor` | A process is technically proven but does not yet tell a customer role what to understand, do, check or correct | handbook/training readiness patch plan |

## Research rule

If the agent does not know a Business Central fact, it must research it before writing a final book claim. Use local evidence first for UI behavior. Use Microsoft Learn, release plans, official implementation guidance or official legal/tax sources for product and compliance claims.

Use `.agent/mcp/MCP-SERVER-REGISTRY.md` when an MCP or local tooling path could help. Microsoft Learn Docs MCP is the preferred read-only source path for Business Central product facts. AL MCP, AL tools, Business Central MCP, publish/auth/debug flows and live sandbox write access stay gated; do not enable them only because research is needed.

When research is needed, write down:

- question
- source used
- MCP/tool used or deliberately not used
- claim allowed
- claim not allowed
- book wording boundary
- evidence/source reference

## Customer enablement rule

When a run affects a customer-facing Business Central topic, classify what changed for training:

- target role
- concept a key user must understand
- daily action or decision
- success check
- common mistake or exception
- correction, cleanup or escalation path
- whether the current evidence is `technical-only`, `handbook-draft`, `training-readiness` or customer-ready

Use `.agent/CUSTOMER-HANDBOOK-TRAINING-STANDARD.md` as the durable home for this rule. A Playwright result that only proves a control path is useful, but it is not yet a customer training scenario until the customer-facing meaning is written.

## Tool availability rule

Before a plan depends on `altool`, `al`, `dotnet`, `npx` or an MCP server, record whether the tool exists locally and whether using it would be read-only, diagnostic, auth-triggering or write-capable. Missing tools are not blockers by themselves; they become backlog or setup notes unless the active case explicitly requires them.

## Freeze rule

During an improvement freeze, learning work may edit `.agent`, scripts, docs and local helper code. It must not run or mutate Business Central.
