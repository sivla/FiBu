# TARGET-051 Item Posting Fields Controlled Assignment Gate

Status: observed

Ziel: Artikelkarte `U-ITEM-HW100` in `playthru / UNIVERSAARL-DE` oeffnen und nur die Lagerbuchungsgruppe `WARE` setzen oder vor einer unsicheren Feldroute stoppen.

## Gemacht

- Opened Page 30 Artikelkarte / Item Card directly for U-ITEM-HW100.
- Expanded safe FastTabs and Mehr anzeigen where visible.
- Captured before screenshot QA and field candidates.
- Attempted to set only Item Posting Group / Lagerbuchungsgruppe = WARE through a labelled editable field.
- Reopened the item card and captured proof screenshot QA.

## Nicht gemacht

- No item was created.
- No item number, description or base unit was changed.
- No Gen. Prod. Posting Group was changed.
- No VAT Prod. Posting Group was changed.
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

## Grenzen

- Item posting group assignment is not proven unless WARE is visible after reopen.
- No VAT Product Posting Group assignment is proven.
- No Gen. Product Posting Group assignment is proven.
- No inventory posting readiness is proven.
- No document, Preview Posting, Posting, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.

Naechster Case: TARGET-052-ITEM-POSTING-FIELDS-FOUNDATION-CHECKPOINT
