# BANK-003 Post Payments Only Trace Gate

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, post-dialog-gate, no-confirm, no-post, not-final |
| Aktion | Post Payments Only Dialog geoeffnet |
| Dialoge erkannt | 1 |
| Schliessmethode | escape |

## Ergebnis

`Post Payments Only...` wurde nur bis zum Dialog-/Request-Page-Gate geoeffnet. Es wurde kein OK, Ja oder Post bestaetigt.

## Warum nicht gebucht wurde

Im Journal sind mehrere Zahlungs-/Abstimmungszeilen sichtbar. Eine echte Buchung braucht vorher einen expliziten Beleg-/Posten-Traceplan: welche Zeile, welche offenen Posten, welche Bankposten, welche Sachposten und wie die Korrektur laeuft.

## Sicherheitsgrenze

- Kein `OK`/`Yes`/`Ja` im Postingdialog.
- Kein `Post Payments Only` bestaetigt.
- Kein Payment-Post.
- Kein Bankabstimmungs-Post.
- Kein Preview Posting.
- Kein Setup Change.
- Kein Company Switch.

## German-Final-Rebuild

In der deutschen Zielcompany den Post-Payments-Only-Dialog erneut mit deutschem Bankkonto, offenen Zielposten und geplantem Bank-/Debitor-/Kreditor-/Sachposten-Trace oeffnen. Erst danach darf eine echte Zahlung gebucht werden.

## Naechster Schritt

BANK-004: Vor echter Zahlung zuerst Zielzeile/offene Posten und erwartete Bank-/Sach-/Detailed-Ledger-Entries als Posting-Fachpruefung definieren.
