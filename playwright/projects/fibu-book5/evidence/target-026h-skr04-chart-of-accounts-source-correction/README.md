# TARGET-026H SKR04 Chart of Accounts Source Correction

Status: `planned-source-correction`

Instance: `playthru`

Company: `UNIVERSAARL-DE`

## Purpose

This evidence folder documents the correction decision before further chart-of-accounts setup. TARGET-026F proved the Business Central UI route for creating and correcting a G/L account, but the created account `1200 Bank Saarland` must not be treated as a SKR04 bank target.

## Decision

- TARGET-026G must not run from the previous mixed account list.
- `1200 Bank Saarland` is UI learning evidence only.
- The SKR04 lookup basis shows `1200` in receivables context and `1800` as bank context.
- No VAT setup, posting groups, master data, documents, Preview Posting or posting may use account `1200` as bank target.
- The next practical setup step needs a source-backed minimal SKR04 account mapping.

Sources:

- DATEV SKR04 product page: https://www.datev.de/web/de/datev-shop/rechnungswesen/skr-04/
- SKR04 2026 reference PDF mirror used for account-number lookup: https://www.collmex.de/skr04.pdf

## Next

Prepare `TARGET-026I-SKR04-MINIMAL-ACCOUNT-MAPPING`, then resume controlled UI setup only for accounts that passed the SKR04 source gate.
