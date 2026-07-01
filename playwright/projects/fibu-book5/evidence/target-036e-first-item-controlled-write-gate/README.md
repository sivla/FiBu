# TARGET-036E First Item Controlled Write Gate

Status: blocked

Dieser Case prueft den ersten Universaarl-Artikel-Gate. Er darf maximal einen Artikel vorbereiten, bleibt aber vor unsicheren Basiseinheits-, Buchungsgruppen-, Dokument-, Preview- und Posting-Schritten stehen.

## Ergebnis

- Business Central stayed in playthru / UNIVERSAARL-DE.
- Units of Measure and Items were inspected before the item write.
- The first item was not saved because the required Base Unit route was not safe enough.

## Grenzen

- No item master data persistence is proven unless resultStatus is observed.
- No Base Unit is selected on a saved item.
- No Item Posting Group, Gen. Prod. Posting Group or VAT Prod. Posting Group is proven on an item.
- No sales, purchase, inventory, Preview Posting, Posting, item ledger entry, value entry, G/L entry or VAT entry is proven.
- Units of Measure page did not show PCS or STK. The first item was not saved because Base Unit would be unproven.
- No U-ITEM-HW100 item is visible after filtered reopen.

## Screenshots

- playwright/projects/fibu-book5/img/target-036e-005-units-before-item-write.png
- playwright/projects/fibu-book5/img/target-036e-010-items-before.png
- playwright/projects/fibu-book5/img/target-036e-020-after-item-attempt.png
- playwright/projects/fibu-book5/img/target-036e-030-after-reopen-filtered-proof.png
