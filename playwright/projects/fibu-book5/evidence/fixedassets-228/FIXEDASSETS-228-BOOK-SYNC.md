# FIXEDASSETS-228 - FA Acquisition Book Sync

## Status

- Case: `FIXEDASSETS-228-FA-ACQUISITION-BOOK-SYNC`
- Instance: `MCP_1_20260210`
- Company: `RM-DEMO`
- Data basis: CRONUS USA laboratory
- Work type: local book sync
- BC run: no
- Playwright run: no
- Posting: no
- Preview Posting: no
- Setup change: no
- Company switch: no
- API shortcut: no

## What was synced

Chapter 21 now reflects the completed laboratory evidence from FA-226 and FA-227:

- `G05001` posted exactly once as a controlled FA G/L Journal laboratory acquisition.
- `FA-CNC-01`, `HGB`, `Acquisition Cost`, amount `120.000,00` and balancing account `82000` are the documented lab target.
- Posted G/L Entries show account signals `82000` and `12210`.
- Posted FA Ledger Entries are visible through Page `5604` with `FA-CNC-01`, `G05001`, `HGB`, `Acquisition Cost` and amount signals.
- Page `5606` is not the posted-ledger proof; it opened an empty `FA Ledger Entries Preview` path and remains rejected.

## Beginner learning value

A fixed asset acquisition needs two traces:

- G/L Entries explain the accounting accounts.
- FA Ledger Entries explain the asset subledger: fixed asset, depreciation book and FA posting type.

If one page is empty, the correct conclusion is not automatically "no entry exists". First check whether the page is a posted-entry page or only a preview-related page.

## Book boundaries

This is not a German final proof. It does not prove German tax handling, German chart of accounts, depreciation posting, disposal, year-end close or final reporting.

## Next practical step

The next fixed asset block should not repeat acquisition posting. The next useful step is a depreciation readiness gate: inspect whether `FA-CNC-01` has the required depreciation setup and define a safe read-only preflight before any depreciation journal or posting.
