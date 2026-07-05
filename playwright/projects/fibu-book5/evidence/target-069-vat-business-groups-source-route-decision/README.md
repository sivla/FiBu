# TARGET-069 - VAT Business Groups Source Route Decision

Status: `observed-local-decision`

Instance: `playthru`

Company: `UNIVERSAARL-DE`

This package closes the local TARGET-069 decision. It does not run Business Central or Playwright and does not write VAT setup.

## Decision

TARGET-027D31B/D31C/D31D/D31E and TARGET-066/TARGET-068 show that the current VAT blocker is not a missing concept, but route parity:

- Microsoft Learn supports the product structure: VAT Business Posting Groups, VAT Product Posting Groups and VAT Posting Setup belong together.
- Page 471 and Page 472 have accepted read-only context from earlier Universaarl evidence.
- Page 470 has older accepted evidence from TARGET-027C4/TARGET-027S/TARGET-020 route references, but newer helper/search routes failed or stayed on Role Center.
- A VAT write gate is therefore still premature.

The next useful case is not another write decision. It is a narrow read-only route parity gate:

`TARGET-070-VAT-PAGE470-DIRECT-ROUTE-PARITY-READONLY-GATE`

## Boundaries

- No VAT Business Posting Group write.
- No VAT Product Posting Group write.
- No VAT Posting Setup write.
- No master data.
- No document or draft.
- No Preview Posting.
- No Posting.
- No API shortcut.

## Next Case

TARGET-070 must prove whether the older valid Page-470 direct/C4 route can be reproduced with current helpers and screenshot QA. Only if that route passes should a later local write-gate decision be considered.
