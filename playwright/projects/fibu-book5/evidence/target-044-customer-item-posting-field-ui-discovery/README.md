# TARGET-044 Customer/Item Posting Field UI Discovery

Status: observed

Dieser Lauf untersucht die Debitorenkarte und Artikelkarte read-only. Ziel ist, sichtbare FastTabs, Feldkandidaten, Controls und Page-Inspection-Signale zu erfassen, bevor irgendein Feld geschrieben wird.

Nicht gemacht:
- kein Neu
- kein Bearbeiten
- keine Feld- oder Einrichtungsaenderung
- keine Personalisierung angewendet
- kein Beleg/Draft
- keine Buchungsvorschau
- keine Buchung
- kein API Shortcut

Naechster Case: TARGET-044B-CUSTOMER-ITEM-POSTING-FIELD-SOURCE-OR-PERSONALIZE-DECISION

Wichtige Dateien:
- `TARGET-044-result.json`
- `customer-u-cust-100-ui-map.json`
- `item-u-item-hw100-ui-map.json`
- `target-044-010-customer-baseline.screenshot.json`
- `target-044-020-item-baseline.screenshot.json`

Screenshot-Grenze:
- Die Baseline-Bilder sind UI-/Layout-Evidence fuer den Autopilot.
- Die Page-Inspection-Bilder sind technische Debug-Evidence.
- Kein Bild beweist Buchungsreife, VAT Setup, Inventory Posting Setup, Preview Posting oder Posting.
