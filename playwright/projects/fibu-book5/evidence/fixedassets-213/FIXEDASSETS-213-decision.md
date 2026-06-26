# FIXEDASSETS-213 Decision

## Scope

- Case: `FIXEDASSETS-213-FA-GL-JOURNAL-PREVIEW-ENTRY-DETAILS-REVIEW`
- Instance: `MCP_1_20260210`
- Company: `RM-DEMO`
- Work type: local evidence review
- Business Central opened: no
- Playwright executed: no

## Decision

FA-212 is accepted as safe Preview Posting evidence, but rejected as entry-detail proof. It proves that the FA G/L Journal Preview Posting path still opens without the old HGB/FA Posting Type blocker, and it confirms that no posting, setup change, journal edit, company switch or API shortcut happened.

It does not prove the preview entry details. The labels `G/L Entry 1` and `FA Ledger Entry` were visible in compact page text, but the test could not find them as exact clickable/detail targets. Header words such as `Account Type`, `Account No.` and `Amount` are not enough to claim real G/L or FA Ledger line details.

## Classification

`blocked-preview-entry-detail-target-not-clickable`

This is a Playwright/UI inspection blocker, not posting readiness.

## Consequence

Posting remains locked. The next step must learn how the Business Central Preview Posting page renders entry groups before we attempt to inspect details or decide on a controlled posting.

## Next Case

`FIXEDASSETS-214-FA-GL-JOURNAL-PREVIEW-DOM-INVENTORY-AFTER-HGB-FIT`

Goal: open the already proven Preview Posting path again, then capture a focused DOM/accessibility/action inventory around `Posting Preview`, `G/L Entry 1` and `FA Ledger Entry`. Do not click entry groups, do not post, do not edit journal/setup.
