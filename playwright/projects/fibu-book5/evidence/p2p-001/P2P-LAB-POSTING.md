# UAT-P2P-001 Laborbuchung

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Einkaufsbestellung | 106049 |
| Kreditor | K10000 / Stahlwerk Ruhr GmbH |
| Artikel | RAW-STEEL / Stahltraeger |
| Menge / Preis | 10 x 2500 |
| Lagerort | FRA-ZL |
| Gebucht | ja, kontrollierte CRONUS-USA-Laborbuchung |
| Buchungsoption | Receive and Invoice |
| Gebuchte Einkaufsrechnung | 108219 |
| Blocker | kein Preview-Blocker vor Buchung |

## Preview Posting

| Postenart | Anzahl |
|---|---:|
| G/L Entry | 4 |
| Vendor Ledger Entry | 1 |
| Detailed Vendor Ledg. Entry | 1 |
| Item Ledger Entry | 1 |
| Value Entry | 1 |

## Lernbefund

Der P2P-Fall zeigt, dass eine Einkaufsbestellung nicht erst mit der gebuchten Rechnung fachlich relevant wird. Schon die Buchungsvorschau prueft, ob Kreditor, Artikel, Lagerort, Buchungsgruppen und Steuer-/Tax-Setup zusammenpassen. Erst wenn diese Vorschau tragfaehig ist, darf im Labor bewusst gebucht werden.

## Laborgrenzen

- CRONUS-USA-Labor, kein deutscher Kontenplan-Endstand.
- Deutsche 19-%-Vorsteuer bleibt offen; Tax/VAT aus diesem Lauf ist kein finaler DE-Nachweis.
- Diese Evidence ersetzt keine produktive Freigabe und keine E-Rechnungs-/Zahlungspruefung.

## Naechster Schritt

Gebuchte Einkaufsrechnung, Kreditorenposten, Sachposten, Artikelposten und Wertposten fuer Buchkapitel 12 auswerten; danach Payment/OP-Ausgleich vorbereiten.
