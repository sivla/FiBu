# BANK-008 Single-Line Vendor Payment Preflight

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, payment-journal-preflight, cleanup, no-post, needs-german-final-rebuild |
| Zielposten | `108204` / First Up Consultants / Vendor 20000 |
| Journalbeleg | `BANK008-108204` |
| Bankgegenkonto | `BANK-RM-01` |
| Betrag | `2.151,46` |

## Ergebnis

- Zielposten sichtbar: ja.
- Journalzeile sichtbar: ja.
- Journal Check 0 Issues: ja.
- Apply Entries read-only geoeffnet: ja.
- Cleanup erfolgreich: ja.

## Buchungsgrenze

BANK-008 bucht nicht. Der Lauf beweist nur, ob die Einzelzeilenroute fuer eine spaetere Zahlung sauber vorbereitet werden kann.

## Naechster Schritt

BANK-009: controlled single-line vendor payment posting for 108204 with post-dialog screenshot and Vendor/Bank/G-L ledger trace.
