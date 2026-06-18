# Skill: state-compressor

Use this skill at the end of a run.

## Update targets

- `.agent/state/current.json`
- `.agent/state/last_run_summary.json`
- active case file
- `.agent/state/coverage_state.json` if coverage changed

## Compression rule

Do not copy long Markdown history into compact state.

Keep:

- current focus
- latest proof
- latest blocker
- next action
- allowed/forbidden actions
- links to source evidence

Large historical project files remain human-readable references, not the default agent context.
