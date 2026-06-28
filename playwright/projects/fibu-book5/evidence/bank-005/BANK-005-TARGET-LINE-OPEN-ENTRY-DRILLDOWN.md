# BANK-005 Zielzeilen-/Open-Entry-Drilldown

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Modus | labor, read-only, no-post, no-preview, no-setup-change |
| Ziel-Dokument | `108204` |
| Ziel-Partei | First Up Consultants |
| Zielbetrag | -2.151,46 |
| Posting jetzt freigegeben | nein |

## Ergebnis

Die Zielzeile und mindestens ein passender offener Ledger-Bezug sind read-only sichtbar. Trotzdem wurde nicht gebucht; ein eigener BANK-006-Postingfall muesste den Trace noch final festlegen.

## Warum das wichtig ist

Der Postingdialog allein ist kein fachlicher Nachweis. Vor einer Zahlungsbuchung muss klar sein, welche Abstimmungszeile welchen offenen Debitor-/Kreditorposten schliesst und welche Bank-/Sachposten danach erwartet werden.

## Grenzen

- Keine Buchung.
- Keine Buchungsvorschau.
- Kein Payment Posting.
- Kein Setup Change.
- Kein Company Switch.
- Kein deutscher Finalnachweis.

## German-Final-Rebuild

In der deutschen Zielcompany vor einer Zahlungsbuchung dieselbe Zielzeile und den offenen Postenbezug read-only nachweisen: Payment Reconciliation Journal, Debitor-/Kreditorposten, Bankposten-Erwartung, danach separater Posting-Trace.

## Naechster Schritt

BANK-006: kontrollierte Payment-Posting-Entscheidung mit explizitem Traceplan; nicht automatisch buchen.
