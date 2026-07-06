# Universaarl BC Project Template

Status: active-control
Purpose: Short entrypoint for the Universaarl Business Central project file, without turning every draft into an active steering source.
Last reviewed: 2026-07-06

## Active Entry Order

Read these files in this order before starting larger project, book, training, Playwright or Business Central work:

1. `HANDOVER.md`
2. `.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md`
3. `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md`
4. `.agent/project-template/PROJECT-DASHBOARD-DRAFT.md`
5. `.agent/state/current.json`

The active target world is `playthru / UNIVERSAARL-DE / Universaarl GmbH`.

`TARGET-073` is parked. The first planned live resume pilot is `TARGET-075`, read-first and no-write, only after the freeze/resume gates have been checked.

Minimum local gate check before any live resume:

```powershell
npm run agent:preflight
npm run agent:resume:check:overnight
npm run agent:freeze:status
npm run agent:target075:readiness
npm run agent:foundation:decision:check
npm run fibu:target:foundation-consistency-pilot -- --check
npm run fibu:target:foundation-consistency-pilot -- --list
```

`agent:foundation:decision:write` belongs after a valid TARGET-075 result, not before. It writes `FOUNDATION-READINESS-DECISION.md`.

## What This Folder Is

This folder contains the project file for a realistic Business Central implementation, customer handbook, training path, UAT work and book curation. It is not a queue by itself.

Use the drafts here only through the active-control files. A draft may be useful working material, reference material, parked history or a remove candidate. The classification file decides that boundary.

## Control Rules

- Do not create a new methodology file if an existing artifact can be shortened, merged, clarified or parked.
- Do not treat old RM-DEMO, MCP_1_20260210, CRONUS, Rhein-Main or RM-* content as active project truth.
- Do not use a draft file as the next step unless the roadmap, dashboard or current state points to it.
- Do not resume live Business Central work until the freeze/resume gates allow it.
- Keep project updates useful for at least one concrete output: BC evidence, book/handbook text, UAT, training, data package, route decision, risk, decision, Playwright repeatability or cleanup of active truth.

## Main Artifact Groups

| Group | Use |
| --- | --- |
| Roadmap and dashboard | Current steering, freeze/resume path, next allowed work. |
| Workstream drafts | Working material for specific BC areas such as Finance Foundation, Master Data, UAT and training. |
| Data and route drafts | Concrete simulated customer data, route decisions and setup dependencies. |
| Book/training drafts | Customer-facing outputs that must become readable handbook material, not test logs. |
| Risk, decision and backlog files | Project management support when they clarify an actual decision or blocker. |
| Historical and legacy material | Preserve for traceability, but do not let it steer Universaarl execution. |

## Working Standard

Before work, state the business purpose, active workstream, dependencies, implementation route, source/evidence need, risk and expected book or training output.

During work, record decisions and blockers where they belong. Keep internal agent language out of customer-facing book text.

After work, update only the control files that genuinely changed. If no project truth changed, do not edit dashboard or state just to show activity.

Good documentation reduces confusion. If a file gets longer without making the next action clearer, shorten or park it.
