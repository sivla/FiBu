# FIXEDASSETS-296 - Fresh OK Result Blocker Review

Status: `labor-blocked`, `local-review`, `no-bc-run`, `no-playwright-run`, `no-repeat-ok`

## Reviewed Evidence

- `FIXEDASSETS-291`: Calculate Depreciation request page values were proven and OK was confirmed once for `FADEP-291-OK`; no journal line was visible afterwards.
- `FIXEDASSETS-293`: read-only journal trace showed Fixed Asset G/L Journals and `DEFAULT`, but no `FADEP-291-OK`, `FA-CNC-01`, `HGB` or target date.
- `FIXEDASSETS-295`: fresh document `FADEP-295-OK` repeated the guarded OK once; request page values were proven again; no journal line was visible afterwards.

## Decision

Do not run Calculate Depreciation OK again blindly.

Two controlled attempts with distinct document numbers have now produced the same result: the request page accepts the target values and OK can be confirmed, but no visible Fixed Asset G/L Journal line appears in the checked context.

The next useful step is a read-only cause diagnosis:

`FIXEDASSETS-297-FA-DEPRECIATION-ELIGIBILITY-CAUSE-READONLY`

This should reuse existing read-only diagnostics where possible, especially:

- `fibu:fixedassets:fa-depreciation-eligibility-readonly-diagnosis`
- optionally later: `fibu:fixedassets:fa-depreciation-book-value-pageinspection-readonly`

## Working Hypotheses

- The asset may not be eligible for depreciation for the requested date/book combination.
- The depreciation request may target another batch, filter, or journal state that is not visible on Page 5628 as currently opened.
- The request page may accept values but produce no line when there is no depreciable amount/period left.

## Locked Actions

- No further Calculate Depreciation OK until a non-repeating cause diagnosis exists.
- No Preview Posting until a generated journal line is visible.
- No posting.
- No setup change before evidence explains the cause.

## German Final Rebuild

All RM-DEMO evidence remains laboratory evidence. A German final sandbox must recreate the depreciation calculation path from setup through request page, visible journal line, Preview Posting and posted FA/G/L entries.
