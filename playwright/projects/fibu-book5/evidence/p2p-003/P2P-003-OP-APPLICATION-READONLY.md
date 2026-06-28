# P2P-003 OP-/Application-Klaerung nach Kreditorenzahlung

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Rechnung | `108219` |
| Zahlung | `PAYP2P-108219` |
| Modus | read-only, no-payment, no-post, no-preview, no-setup-change |
| Rechnung Restbetrag 0,00 sichtbar | ja |
| Application-Zeilen sichtbar | ja |
| Payment Discount sichtbar | ja |
| Payment Entry Rest 500,00 sichtbar | ja |

## Lernwert

Eine Zahlung allein beweist noch nicht automatisch, dass die Ausgangsrechnung sauber geschlossen ist. Dafuer muss die Rechnung im Kreditorenposten selbst betrachtet werden: Restbetrag, Open-Status und detaillierte Application-Zeilen sind der eigentliche OP-Nachweis.

Im Labor ist die Einkaufsrechnung `108219` nach `PAYP2P-108219` als geschlossen lesbar: Die Rechnungszeile zeigt Restbetrag `0,00`, und die detaillierten Kreditorenposten zeigen Application-Zeilen zur Zahlung.

Der sichtbare `Payment Discount` ist ein eigener CRONUS-USA-Laborbefund. Er erklaert, warum Zahlung, Rechnung und detaillierte Posten nicht nur aus einer einfachen 1:1-Zahlungszeile bestehen.

## Grenzen

- Keine neue Zahlung, keine Buchung, keine Buchungsvorschau.
- Keine Bankabstimmung.
- Kein deutscher Finalnachweis.
- Deutsche Zielcompany muss denselben Nachweis spaeter mit deutschen Screenshots neu erzeugen.
