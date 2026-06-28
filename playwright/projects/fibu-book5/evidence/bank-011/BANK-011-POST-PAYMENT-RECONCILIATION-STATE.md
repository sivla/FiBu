# BANK-011 Payment-Reconciliation-Zustand nach BANK-009

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Zahlungsbeleg | `BANK009-108204` |
| bezahlte Rechnung | `108204` |
| Modus | labor, read-only, no-post, no-preview, no-setup-change |

## Ergebnis

BANK-011 bleibt read-only: Nach BANK-009 wird keine Payment-Reconciliation-Buchung aus der alten Reconciliation-Sicht angestossen. Der aktuelle Zustand wird nur gegen Vendor Ledger, Bank Ledger und G/L Entries gegengeprueft.

## Warum das wichtig ist

Nach einer bewusst gebuchten Einzelzahlung darf eine alte Payment-Reconciliation-Zeile nicht mehr blind als Buchungskandidat verwendet werden. Erst muss der aktuelle Reconciliation-Kontext gegen Kreditorenposten, Bankposten und Sachposten gelesen werden.

## Belegt

- Payment Reconciliation Journal wurde nach BANK-009 read-only geoeffnet.
- Vendor Ledger Entry zur Rechnung 108204 wurde read-only geprueft.
- Vendor Ledger, Bank Account Ledger und G/L Entries zur Zahlung BANK009-108204 wurden read-only geprueft.
- Keine Reconciliation-, Apply- oder Post-Aktion wurde geklickt.

## Nicht belegt

- Keine Bankabstimmung wurde gebucht.
- Kein Post Payments Only wurde bestaetigt.
- Kein Preview Posting wurde geoeffnet.
- Kein deutscher Bank-/Compliance-Finalnachweis.

## Naechster Schritt

BANK-012: Entweder Bank Account Reconciliation mit neuem klaren Zielbeleg kontrolliert vorbereiten oder Bankabstimmung als German-Final-Rebuild-Aufgabe parken.
