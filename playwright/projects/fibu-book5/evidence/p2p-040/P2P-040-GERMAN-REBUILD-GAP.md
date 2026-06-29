# P2P-040 German Rebuild Gap

Status: `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`.

Decision: RM-DEMO P2P is sufficient for the labor book draft. Do not keep drilling the same Purchase Order cell-edit blockers in this sandbox.

## Labor-Proven In RM-DEMO

- Purchase Order / Receive and Invoice route: `106049` -> posted purchase invoice `108219`.
- Payment/Application follow-up: `PAYP2P-108219`, Remaining Amount `0,00`, Detailed Vendor Ledger application signals.
- Direct Purchase Journal route: `P2P032-682298`, Journal Check, Preview Posting, Post dialog, exactly one posting.
- Readable screenshot anchors from `P2P-038`: Vendor Ledger, Detailed Vendor Ledger and G/L Entries with accounts, amounts and Entry Nos.

## Must Recreate In German Final Sandbox

- German company and language/context proof.
- German vendor setup and Vendor Posting Group.
- German item/material setup if Purchase Order route is used.
- German VAT Posting Setup / 19 percent input VAT proof where applicable.
- German chart of accounts and posting groups.
- Preview Posting with German accounts and VAT entries.
- Controlled posting and posted document evidence.
- Vendor Ledger, Detailed Vendor Ledger, G/L Entries, VAT Entries and, for item route, Item/Value Entries.
- Screenshots that show fields, accounts, amounts and entry types, not only document codes.

## Parked / Not To Repeat Blindly

- Purchase Order partial receipt remains open because known cell-edit routes did not persist `Location FRA-ZL`, `Quantity 4` and `Qty. to Receive 2` reliably.
- Purchase Invoice route in RM-DEMO was polluted by old draft/bookmark context and should not be reused without a new reset hypothesis.
- `82000` in the Purchase Journal lab route is a CRONUS/RM-DEMO balance account, not a German purchase account claim.

## Next Lab Focus

Move to `FIXEDASSETS-298-FA-DEPRECIATION-BLOCKER-BOOK-SYNC`: sync the Fixed Assets depreciation blocker into the book/lab draft so beginners understand what is proven and why depreciation remains blocked before any further OK/Preview/Post attempt.
