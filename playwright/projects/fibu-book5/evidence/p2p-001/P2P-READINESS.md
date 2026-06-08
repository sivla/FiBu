# UAT-P2P-001 Readiness fuer K10000 und RAW-STEEL

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, readiness, no-posting |
| Kreditor | K10000 / Stahlwerk Ruhr GmbH |
| Artikel | RAW-STEEL / Stahltraeger |
| Menge / Preis | 10 x 2500 EUR |
| Lagerort | FRA-ZL |
| Zielsteuer | 19 % als deutscher Zielwert, nicht Laborbeweis |

## Kernergebnis

| Pruefpunkt | Ergebnis |
|---|---|
| K10000 existiert | ja |
| K10000 Aktion | updated |
| Vendor Template angewendet | ja |
| Labor-Waehrung am Entwurf | USD |
| RAW-STEEL existiert | ja |
| RAW-STEEL Aktion | updated |
| RAW-STEEL Labor-Posting-Fit | RETAIL/RESALE/FURNITURE |
| FRA-ZL existiert | ja |
| Einkaufsbestell-Entwurfsprobe | erfolgreich, Entwurf geloescht |
| Direct Unit Cost in Entwurfszeile | 2500 |
| Tax Percent in Entwurfszeile | 0 |
| Bereit fuer naechstes Preview Posting | ja, als Labor-Preview-Vorstufe |

## Warum dieser Schritt wichtig ist

Ein P2P-Prozess kann erst sinnvoll geklickt werden, wenn Kreditor, Artikel, Lagerort und grundlegende Einkaufszeile tragfaehig sind. Business Central erzeugt aus diesen Stammdaten spaeter Kreditorenposten, Sachposten, Artikelposten, Wertposten und Steuer-/Tax-Posten. Ohne Readiness wuerde der erste Einkaufsbeleg nur zufaellige Setupfehler produzieren.

## Laborgrenzen

- Keine P2P-Buchung, kein Wareneingang und keine Eingangsrechnung.
- Deutsche 19-%-Vorsteuer bleibt offen.
- Der Laborentwurf laeuft in der aktuellen CRONUS-USA-Basis mit `USD` und `Tax Percent = 0`.
- `RAW-STEEL` nutzt `RETAIL`/`RESALE`/`FURNITURE` nur als CRONUS-Technikfit; das ist kein deutscher Rohmaterial-/Vorsteuer-Endstand.
- Vendor Posting Setup, General Posting Setup und Inventory Posting Setup sind erst mit Preview Posting belastbar fuer die Buchungswirkung.
- `COMP-CTRL` bleibt spaeterer Manufacturing-/P2P-Erweiterungsfall und wurde in diesem Lauf nicht angelegt.

## Naechster Schritt

Historisch war der naechste Schritt der Preview-Posting-Lauf. Dieser wurde inzwischen ausgefuehrt und in `P2P-LAB-POSTING.md`, `100-purchase-posting-result.json` und `160-posting-trace-summary.json` dokumentiert. Diese Datei bleibt der Readiness-Nachweis vor der Buchung.
