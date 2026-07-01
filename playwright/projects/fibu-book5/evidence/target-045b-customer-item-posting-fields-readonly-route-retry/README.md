# TARGET-045B - Customer/Item Field Route Retry

Status: observed

Dieser Lauf prueft Debitorenkarte und Artikelkarte ohne Personalisieren. Er nutzt nur Standardseiten-FastTabs, Mehr anzeigen und sichtbare Felder.

Screenshot-QA: Die Debitorenkarte zeigt `Fakturierung` und `Zahlungen` als sichtbare FastTabs, aber der Helper hat sie in diesem Lauf nicht zuverlaessig geoeffnet. Das ist kein Beweis, dass die Buchungs-/USt-/Zahlungsfelder nicht existieren. Es beweist nur: die Standardroute war fuer einen sicheren Write noch nicht ausreichend. Die Artikelkarte zeigt `Einstandspreise und Buchung`, `Beschaffung` und `Indirekte Steuer`, aber die gesuchten Posting-/VAT-Feldbegriffe waren nicht sichtbar genug fuer einen Schreibfall.

| Seite | Feldbegriff | Sichtbarkeit | Signale |
|---|---|---|---:|
| customer-u-cust-100 | Debitorenbuchungsgruppe | nicht sichtbar | 0 |
| customer-u-cust-100 | Customer Posting Group | nicht sichtbar | 0 |
| customer-u-cust-100 | Geschaeftsbuchungsgruppe | nicht sichtbar | 0 |
| customer-u-cust-100 | Geschaeftsbuchungsgruppe | nicht sichtbar | 0 |
| customer-u-cust-100 | Gen. Bus. Posting Group | nicht sichtbar | 0 |
| customer-u-cust-100 | MwSt.-Geschaeftsbuchungsgruppe | nicht sichtbar | 0 |
| customer-u-cust-100 | MwSt.-Geschaeftsbuchungsgruppe | nicht sichtbar | 0 |
| customer-u-cust-100 | VAT Bus. Posting Group | nicht sichtbar | 0 |
| customer-u-cust-100 | Zahlungsbedingungscode | nicht sichtbar | 0 |
| customer-u-cust-100 | Payment Terms Code | nicht sichtbar | 0 |
| customer-u-cust-100 | Gesperrt | sichtbar | 2 |
| customer-u-cust-100 | Blocked | nicht sichtbar | 0 |
| item-u-item-hw100 | Basiseinheit | sichtbar | 3 |
| item-u-item-hw100 | Base Unit of Measure | nicht sichtbar | 0 |
| item-u-item-hw100 | Lagerbuchungsgruppe | nicht sichtbar | 0 |
| item-u-item-hw100 | Item Posting Group | nicht sichtbar | 0 |
| item-u-item-hw100 | Produktbuchungsgruppe | nicht sichtbar | 0 |
| item-u-item-hw100 | Gen. Prod. Posting Group | nicht sichtbar | 0 |
| item-u-item-hw100 | MwSt.-Produktbuchungsgruppe | nicht sichtbar | 0 |
| item-u-item-hw100 | VAT Prod. Posting Group | nicht sichtbar | 0 |
| item-u-item-hw100 | Einstandspreismethode | nicht sichtbar | 0 |
| item-u-item-hw100 | Costing Method | nicht sichtbar | 0 |
| item-u-item-hw100 | Lagerabgangsmethode | nicht sichtbar | 0 |
| item-u-item-hw100 | Lagerbestand | sichtbar | 12 |
| item-u-item-hw100 | Inventory | sichtbar | 10 |

## Nicht gemacht

- kein Neu
- kein Bearbeiten
- keine Feld- oder Einrichtungsaenderung
- keine Personalisierung
- kein Beleg/Draft
- keine Buchungsvorschau
- keine Buchung
- kein API Shortcut

Naechster Case: TARGET-046-ITEM-INVENTORY-POSTING-GROUP-SOURCE-MAPPING

