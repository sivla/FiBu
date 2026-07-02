# TARGET-053 Item Product/VAT Posting Fields Source Decision

TARGET-053 was a local source-decision run. It did not open Business Central and did not run Playwright.

The decision selects `WAREN` for `Produktbuchungsgruppe` and `VAT19` for `MwSt.-Produktbuchungsgruppe` on `U-ITEM-HW100`, but only for the next narrow item-card write gate. This does not prove posting readiness.

Boundaries:

- No setup change.
- No master-data change in TARGET-053.
- No draft.
- No Preview Posting.
- No Posting.
- No API shortcut.
- No book master change.

Important limit: General Posting Setup `INLAND` + `WAREN` and VAT Posting Setup `INLAND` + `VAT19` remain separate gated dependencies.
