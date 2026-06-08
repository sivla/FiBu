# PAYMENTS-001 Open-Entry Readiness

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-payment, no-application |
| O2C-Ausgangspunkt | Gebuchte Verkaufsrechnung `PS-INV103297`, Debitor `D10000` |
| P2P-Ausgangspunkt | Gebuchte Einkaufsrechnung `108219`, Kreditor `K10000` |

## Ergebnis

| Frage | Befund |
|---|---|
| Debitorenposten zur Verkaufsrechnung sichtbar | ja |
| Kreditorenposten zur Einkaufsrechnung sichtbar | ja |
| Offene-/Restbetragslogik im Debitorenposten sichtbar | ja |
| Offene-/Restbetragslogik im Kreditorenposten sichtbar | ja |
| Zahlungs-/Ausgleichsaktionen sichtbar | ja |
| Zahlung gebucht | nein |
| Posten ausgeglichen | nein |

## Anfaenger-Lernwert

Nach O2C und P2P sind Rechnungen nicht einfach erledigt. Business Central fuehrt offene Debitoren- und Kreditorenposten. Erst eine Zahlung oder ein Ausgleich schliesst diese Posten. Ein Zahlungslauf darf deshalb nicht beim Bankkonto anfangen, sondern muss zuerst klaeren: Welche Rechnung ist offen, welcher Restbetrag besteht, welche Waehrung gilt und wie wird die Zahlung dem Posten zugeordnet?

## Buchwirkung

Kapitel 19/20 koennen jetzt an echten Laborbelegen anknuepfen: `PS-INV103297` fuer Zahlungseingang und `108219` fuer Zahlungsausgang. Das Buch darf aber noch keine Zahlung, keinen Ausgleich und keine Bankwirkung behaupten.

## Grenzen

- CRONUS-USA-Labor, kein deutscher Finalnachweis.
- Keine Zahlung, kein Ausgleich, kein Payment Journal, keine Bankabstimmung.
- Deutsche USt/Vorsteuer bleibt offen.

## Naechster Schritt

PAYMENTS-002 als kontrollierter Readiness-Lauf: Bankkonto, Zahlungsjournal/Cash Receipt Journal, Zahlungsbedingungen und Apply-Entries-Pfad pruefen; erst danach eine einzelne Laborzahlung buchen oder bewusst weiter read-only bleiben.
