# UAT-001 Readiness fuer Kapitel 32

| Feld | Wert |
|---|---|
| Status | labor, read-only, book-sync, no-posting, no-setup-change, not-final |
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Buchkapitel | 32 UAT-Testbibliothek |
| BC-Ausfuehrung | nein |
| Buchung | nein |
| Setup-/Stammdatenaenderung | nein |

## Zweck

Kapitel 32 enthaelt eine Master-UAT-Bibliothek. Dieser Lauf prueft nicht neu in Business Central, sondern ordnet den aktuellen Evidence-Stand in diese Bibliothek ein. Dadurch wird sichtbar, welche UAT-Faelle bereits Laborbausteine haben und welche nur Zielpfade oder Gate-Folgearbeit sind.

Microsofts Dynamics-365-Teststrategie beschreibt UAT als Business-User-Test in einer Testumgebung mit Testplan, Scope, Ergebnistracking und Sign-off. Daraus folgt fuer das Buchprojekt: Labor-Evidence ist ein belastbarer UAT-Baustein, aber noch kein bestandener Gesamt-UAT und kein deutscher Finalnachweis.

## UAT-Mapping aus vorhandener Evidence

| UAT-ID | Buchfall | Aktueller Evidence-Stand | Status |
|---|---|---|---|
| `UAT-001` | Foundation / Pflichtdimension | Dimensionen, Default Dimensions und mehrere Setup-Gates sind belegt; kein aktueller Pflichtdimensions-Blocker neu ausgefuehrt | teilweise laborbelegt |
| `UAT-002` | Sales / B2B-Verkauf Maschine | O2C `S-ORD101068` -> `PS-INV103297` ist als CRONUS-USA-Laborbuchung mit Postenspur belegt; `PRODUCTLINE=MACHINE`/`CHANNEL=B2B` am Artikelposten sichtbar; deutsche 19-%-USt offen | laborbelegt, de-final-open |
| `UAT-006`/`UAT-007` | Purchasing/P2P | P2P `106049` -> `108219` ist als CRONUS-USA-Laborbuchung mit Kreditoren-, Sach-, Wert- und Artikelposten belegt; E-Rechnung/XML und deutsche Vorsteuer offen | laborbelegt, fachlich teilweise |
| `UAT-009` | Inventory | `INV008-899959` belegt positiven RM-M100-Laborzugang, Artikelposten, Wertposten, Sachposten und Inventory Valuation | laborbelegt |
| `UAT-016` | Bank / Teilzahlung | `PAYMENTS-001` bis `PAYMENTS-010` belegen offene Posten, Journal-Draft, Apply Entries und Post-Dialog mit Abbruch; keine Zahlung und kein Ausgleich | readiness, gate-locked |
| `UAT-017` | Fixed Assets | Kapitel 21 ist als Readiness/Setup-Reihenfolge synchronisiert; `HGB` ist seit `FIXEDASSETS-014` sichtbar, aber `FA-CNC-01`, `MACHINES`, `K30000`, Zugang und AfA fehlen | readiness, gate-locked |
| `UAT-020` | Reporting | Financial Reports und mehrere Reportingpfade sind read-only geprueft; keine belastbare Summenwirkung nach `PRODUCTLINE`/`CHANNEL` | partial-negativ, gate-locked fuer Analysis-View-Fit |

## Was dieser Lauf beweist

- Die UAT-Testbibliothek ist jetzt an vorhandene Evidence angebunden.
- O2C, P2P und Inventory sind als CRONUS-USA-Laborbausteine fuer UAT verwendbar.
- Payments, Fixed Assets, Warehouse, Manufacturing, Service, Projects, Dropshipping, Intercompany, Tax/VAT, Compliance, Security, Migration, Integrationen, Operations und Solution Architecture sind nicht als bestandene UATs zu lesen, wenn bisher nur Readiness oder Buch-Sync vorliegt.
- Kapitel 32 trennt nun Zielbibliothek, Laborbelege und Finalnachweise.

## Was dieser Lauf nicht beweist

- Kein Gesamt-UAT wurde ausgefuehrt oder bestanden.
- Kein Fachbereich hat Sign-off gegeben.
- Keine deutsche 19-%-USt, kein deutscher Kontenplan und keine deutsche Finalcompany wurden nachgewiesen.
- Keine Zahlung, kein OP-Ausgleich, keine Bankabstimmung, kein E-Rechnungsversand, kein Security-Setup, keine Migration, keine Integration und keine Architekturentscheidung wurden umgesetzt.

## Buchwirkung

Kapitel 32 darf die Master-UAT-Tabelle weiterhin als Zielbibliothek zeigen. Es muss aber erkennbar sein, dass vorhandene Laborbelege nur einzelne UAT-Bausteine abdecken. Fuer Anfaenger ist wichtig: Ein UAT-Fall ist erst dann abnahmefaehig, wenn Prozess, Stammdaten, Setup, Buchung/Read-only-Ziel, Postenspur, Fehlerfall, Ergebnis und fachlicher Sign-off zusammenpassen.

## Naechster Schritt

Ohne Gate ist `TRAINING-001-READINESS` sinnvoll: Kapitel 33 Uebungen und Loesungen gegen vorhandene Evidence und die UAT-Matrix einordnen, keine neue BC-Ausfuehrung, keine Setup-Aenderung und keine Buchung.
