# FIXEDASSETS-294 - Depreciation Request Page / Repeat Gate

Status: `labor-reference`, `local-review`, `no-bc-run`, `no-playwright-run`, `execution-gate`

## Reviewed Evidence

- `FIXEDASSETS-291`: Calculate Depreciation request page values were visible and OK was confirmed exactly once for `FADEP-291-OK`.
- `FIXEDASSETS-292`: local blocker review concluded that blind OK repetition is unsafe because a generated line could exist outside the checked view.
- `FIXEDASSETS-293`: read-only Fixed Asset G/L Journals trace found `DEFAULT` context but did not find `FADEP-291-OK`, `FA-CNC-01`, `HGB` or `31.01.2027`.

## Decision

The next safe route is a guarded controlled repeat with a fresh document number:

`FIXEDASSETS-295-FA-DEPRECIATION-GUARDED-OK-FRESH-DOC-NO-POST`

This is not a blind repeat of `FADEP-291-OK`. It may only run if:

- instance is `MCP_1_20260210`
- company is `RM-DEMO`
- document number is the fresh value `FADEP-295-OK`
- target values are visible before OK
- OK is confirmed exactly once
- journal search is mandatory after OK
- Preview Posting remains forbidden
- Post remains forbidden

## Why Not Preview/Post Yet?

No generated depreciation journal line is visible yet. For beginners and for the book, the rule is simple: after `Calculate Depreciation`, the generated journal line must be visible before Preview Posting or posting can be discussed.

## German Final Rebuild

This is RM-DEMO laboratory routing only. In a German final sandbox, the whole route must be rebuilt with German fixed asset setup, German accounts, German screenshots, visible depreciation journal line, Preview Posting and posted FA/G/L entries.
