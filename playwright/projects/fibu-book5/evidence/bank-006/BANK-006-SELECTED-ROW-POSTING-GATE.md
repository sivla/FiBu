# BANK-006 Selected Row Posting Gate

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Modus | labor, selected-row-gate, no-confirm, no-post, not-final |
| Ziel-Dokument | `108204` |
| Zielzeile selektiert | ja |
| Dialog geoeffnet | ja |
| Payment Posting jetzt freigegeben | nein |

## Ergebnis

Auch nach Zielzeilen-Kontext bleibt `Post Payments Only` ein globaler Dialog ohne eindeutige Ein-Zeilen-Bestaetigung. Deshalb wurde nicht gebucht.

## Sicherheitsgrenze

- Kein `Ja`, `Yes`, `OK` oder `Post` bestaetigt.
- Kein Payment Posting.
- Keine Bankabstimmung gebucht.
- Keine Buchungsvorschau.
- Kein Setup Change.
- Kein Company Switch.

## Naechster Schritt

Do not confirm Post Payments Only as a blind global action. Prefer BANK-007 Single-Line Payment Journal posting route or an explicit all-accepted-lines Payment Reconciliation posting case with ledger trace approval.
