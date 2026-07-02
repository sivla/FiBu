# TARGET-054 Item Product/VAT Posting Fields Controlled Write Gate

Status: observed

Ziel: Artikelkarte `U-ITEM-HW100` in `playthru / UNIVERSAARL-DE` oeffnen und nur `Produktbuchungsgruppe = WAREN` sowie `MwSt.-Produktbuchungsgruppe = VAT19` setzen oder sicher stoppen.

## Sichtbar / bewiesen

- Business Central stayed in playthru / UNIVERSAARL-DE.
- U-ITEM-HW100 item card was visible.
- Product Posting Group WAREN is visible on U-ITEM-HW100 after reopen.
- VAT Product Posting Group VAT19 is visible on U-ITEM-HW100 after reopen.
- No setup, document, Preview Posting, Posting, payment or API shortcut occurred.

## Nicht bewiesen

- No General Posting Setup row INLAND/WAREN with 4400/5400 is proven.
- No VAT Posting Setup row INLAND/VAT19 with 19 percent and VAT accounts is proven.
- No O2C/P2P readiness is proven.
- No document, Preview Posting, Posting, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.

## Nicht gemacht

- No item was created.
- No item number, description or base unit was changed.
- No Item Posting Group / Lagerbuchungsgruppe was changed.
- No Costing Method was changed.
- No Inventory Posting Setup was changed.
- No VAT Posting Setup was changed.
- No General Posting Setup was changed.
- No document or draft was created.
- No Preview Posting was run.
- No Posting was run.
- No payment was run.
- No API shortcut was used.
- No company switch was executed.

Naechster Case: TARGET-027D25-VAT-MATRIX-ROUTE-REOPEN-DECISION
