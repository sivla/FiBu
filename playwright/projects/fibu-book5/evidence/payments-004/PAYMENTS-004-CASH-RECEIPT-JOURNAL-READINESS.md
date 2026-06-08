# PAYMENTS-004 Cash Receipt Journal Readiness

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-payment, no-application, no-journal-line |
| Ausgangsposten | `PS-INV103297` / `D10000` |
| Laborbankkonto | `BANK-RM-01` |

## Ergebnis

| Pruefpunkt | Befund |
|---|---|
| BANK-RM-01 in Bank Accounts sichtbar | ja |
| Cash Receipt Journal erreichbar | ja |
| Kontotyp/Kontonummer sichtbar | ja |
| Betrag sichtbar | ja |
| Gegenkonto-/Bal.-Account-Hinweis sichtbar | ja |
| Ausgleichs-/Apply-Hinweis sichtbar | ja |
| Journal Check/Test Report sichtbar | ja |
| Zahlung gebucht | nein |
| OP ausgeglichen | nein |
| Journalzeile erstellt | nein |

## Anfaenger-Lernwert

Das Zahlungseingangsjournal ist der Ort, an dem ein Zahlungseingang als Journalzeile vorbereitet wird. Fuer einen spaeteren sicheren Zahlungsfall muessen drei Dinge zusammenpassen: der offene Debitorenposten, die Journalzeile mit Debitor und Betrag sowie das Bankkonto als Gegenkonto. `BANK-RM-01` ist jetzt als Laborbank vorhanden; dieser Lauf zeigt den Bedienort und die sichtbaren Felder, erzeugt aber noch keine Zahlungswirkung.

## Buchwirkung

Kapitel 19/20 kann den Schritt zwischen OP-Liste und erster Zahlung genauer erklaeren: Vor einer Buchung steht ein Readiness-Check im Zahlungseingangsjournal. Screenshots duerfen als Labor-Evidence fuer Navigation und Feldverstaendnis genutzt werden, nicht als Zahlungsnachweis.

## Grenze

- CRONUS-USA-Labor, kein deutscher Finalnachweis.
- Keine deutsche Steuer-, Bank- oder Compliance-Aussage.
- Keine Betragsrichtung, keine Application und keine Sachpostenwirkung nachgewiesen.

## Naechster Schritt

PAYMENTS-005: eine kontrollierte, bereinigbare Zahlungsjournal-Entwurfszeile fuer D10000/PS-INV103297 mit Gegenkonto BANK-RM-01 vorbereiten; weiterhin nicht buchen, bis Journal Check/Feldfit belegt ist.
