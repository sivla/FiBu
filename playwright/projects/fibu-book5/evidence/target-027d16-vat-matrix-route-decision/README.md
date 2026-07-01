# TARGET-027D16 VAT Matrix Route Decision

Status: `observed`

This is a local/source/UI decision case. Business Central and Playwright were not opened in this case.

## Decision

The next non-repeating route is `TARGET-027D17-VAT-MATRIX-FIRST-FIELDS-LOOKUP-DISCOVERY`.

The route focuses on the first two mandatory fields of Page 472:

- VAT Bus. Posting Group
- VAT Prod. Posting Group

The next case must prove whether these cells expose safe lookup/detail/select controls before any setup values are written. If lookup controls are not visible and selectable, the run must stop without typing `INLAND`, `VAT19`, `19`, `3806` or `1406`.

## Why Not Repeat The Old Routes

- Blind grid typing is blocked because D14 showed a transient row without a true active editor for the first mandatory field.
- The `Bearbeiten` probe is blocked because D15 kept the surface in list/grid mode and did not open a safe card route.
- Page Inspection is useful for Page/Table/Field truth, but it is not itself a write route.

## Source And Evidence Basis

- Microsoft Learn describes VAT setup as VAT business posting groups, VAT product posting groups and VAT posting setup with VAT rates and G/L accounts.
- D15 Page Inspection confirmed Page `VAT Posting Setup (472, List)`, table `VAT Posting Setup (325)`, and the relevant empty fields on the transient row.
- D15 reopen proof showed no `INLAND`/`VAT19` row persisted.

## Boundaries

- No BC execution.
- No Playwright execution.
- No setup write.
- No master data.
- No document draft.
- No Preview Posting.
- No Posting.
- No API shortcut.
- No final German VAT claim.
