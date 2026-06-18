# Skill: evidence-writer

Use this skill to create compact Evidence.

## Required fields

Every evidence summary must state:

- case id
- environment and company
- work type
- what was checked
- what was proved
- what was not proved
- screenshots and their status
- safety result
- book impact
- next step

## Compactness

- Prefer one JSON result and one short Markdown summary.
- Do not commit raw page dumps, traces, reports or console logs.
- Keep paths repo-relative.
- Use `labor`, `read-only`, `setup-proof`, `rejected`, `not-final` and `de-final-open` labels when relevant.
