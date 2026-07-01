# TARGET-036D2F - U-VEND Manual Nos route recovery

Status: `blocked-parked`

This is a local decision case. Business Central and Playwright were not opened in this run. The decision is based on the immediately preceding live evidence from TARGET-036D2E.

## Decision

The U-VEND Manual Nos route stays parked. The earlier list checkbox, DOM checkbox and screenshot-coordinate routes did not prove `Manuelle Anz.` active after reopen. Repeating those routes would not improve the evidence.

## Boundaries

- Instance target remains `playthru`.
- Company target remains `UNIVERSAARL-DE`.
- No setup change was made in this D2F run.
- No customer, vendor or item was created.
- No draft, Preview Posting, Posting, payment or API shortcut occurred.

## Next case

`TARGET-037-MASTERDATA-FOUNDATION-CHECKPOINT`

The checkpoint should classify what is truly ready after `SAAR-HL` and `U-CUST-100`, keep the vendor route blocked, and choose the next write gate only after the readiness picture is clear.
