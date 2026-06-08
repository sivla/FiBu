# Screenshot-QA fuer Buch 5

Diese Datei bewertet, ob erzeugte Business-Central-Screenshots bereits als Buchbilder taugen oder nur Labor-/Evidence-Material sind.

## Bewertungsregel

Ein Screenshot ist erst buchfaehig, wenn er:

1. den fachlich richtigen Datensatz zeigt
2. die im Buch behaupteten Felder sichtbar macht
3. keine irrefuehrenden CRONUS- oder Altdaten als Prozessnachweis zeigt
4. Stoerer wie Popover, Touren, Resize-Hinweise oder Copilot-Karten bewusst enthaelt oder gezielt entfernt
5. Sprache, Company, Waehrung, Steuerlogik und Testdaten zum erklaerten Ziel passen
6. durch Evidence ergaenzt wird, die denselben Zustand prueft

Laborbilder duerfen abweichen. Dann muessen Abweichung, Ursache und Buchwirkung dokumentiert sein.

Zu jedem automatisiert erzeugten O2C-Screenshot schreibt der Screenshot-Helper eine Metadatendatei unter `evidence/<testfall>/...screenshot.json`. Diese Datei enthaelt Status, Buchnutzung, Zweck, erwartete Werte im BC-Seitentext und bekannte Grenzen. Die PNG-Datei allein ist deshalb nicht mehr die ganze Wahrheit.

Fuer `UAT-O2C-001` fasst `playwright/projects/fibu-book5/evidence/uat-o2c-001/README.md` die Screenshot-Metadaten, Rohtexte, API-Nachweise, Preview-Evidence und Cleanup-Evidence zusammen. Vor Buchverwendung zuerst diesen Index lesen.

## `MASTERDATA-007` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png` | guter Labor-Kandidat | Page `540` zeigt `Default Dimensions` mit `PRODUCTLINE`, `MACHINE` und `Same Code`. Die Teaching-Tip-Karte `About default dimensions` wurde gezielt geschlossen. | Als Buchkandidat fuer Standarddimensionen geeignet; final in deutscher Umgebung neu erzeugen. |
| `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-customer-d10000.png` | guter Labor-Kandidat | Page `540` zeigt `CHANNEL`, `B2B`, `Business-to-Business` und `Same Code`. Parent `D10000` ist ueber Filter/Test/Evidence belegt, aber nicht im sichtbaren Seitentext. | Als Laborbild geeignet; Buchtext muss erklaeren, dass Page 540 auf den Debitorenkontext gefiltert wurde. |
| `playwright/projects/fibu-book5/img/masterdata-dimensions-010-book-standard-dimensions.png` | Labor-Kandidat mit Grenze | Dimensionsliste zeigt zentrale RM-DEMO-Dimensionen wie `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP`. | Als Uebersichtsbild fuer den O2C-Kern geeignet. Nicht als Nachweis fuer alle Buchstandard-Werte nutzen; fehlende Werte stehen in `evidence/masterdata-dimensions/011-dimension-foundation-summary.md`. |
| `playwright/projects/fibu-book5/img/masterdata-010-p1-location-group-simple.png` | guter Labor-Kandidat | Dimension Values fuer `LOCATION-GROUP` zeigen `DIRECTED` und `SIMPLE`. | Als Laborbild fuer einfache Lagerlogik geeignet; weitere P1-Werte sind in JSON/Markdown-Evidence belegt. |

## `MASTERDATA-008` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/masterdata-008-inventory-posting-setup-fra-zl-resale.png` | gutes Fehler-/Lernbild | Breite Listenansicht zeigt `Inventory Posting Setup` mit gefilterter Zielzeile `FRA-ZL` + `RESALE`. Die Spalten `Inventory Account` und `Inventory Account (Interim)` sind sichtbar und leer. | Als Laborbild fuer den O2C-Blocker geeignet. Nicht als finaler Setup-Endstand verwenden, weil noch keine fachliche Kontenentscheidung getroffen wurde. |

## `MASTERDATA-009` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/masterdata-009-inventory-posting-setup-fra-zl-resale-14140.png` | guter Labor-Fit-Nachweis | Gefilterte Zielzeile `FRA-ZL` + `RESALE` zeigt jetzt `Inventory Account = 14140`. Das Konto wurde aus vorhandenen CRONUS-RESALE-Zeilen abgeleitet. | Als Laborbild fuer den geschlossenen Inventory-Posting-Setup-Blocker geeignet. Nicht als deutscher Kontenplan-Endstand verwenden; O2C-Preview muss danach separat neu erzeugt werden. |

## `UAT-O2C-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/uat-o2c-001-010-suche-verkaufsauftraege.png` | brauchbares Laborbild | Tell-Me zeigt `Sales Orders`, richtige Treffergruppe und mehrere aehnliche Treffer. Das ist didaktisch gut, weil es die Gefahr falscher Suchtreffer sichtbar macht. | Als Labor-/Toolbild behalten. Final mit deutschem Suchbegriff `Verkaufsauftraege` neu erzeugen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png` | nicht als O2C-Prozessnachweis geeignet | Liste zeigt vorhandene CRONUS-Auftraege und markiert `10000`/Adatum, nicht `D10000`. | Nur als Navigationsbild verwenden. Fuer Prozessnachweis nach Anlage auf den erzeugten Auftrag filtern oder direkt die Karte zeigen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` | gutes Laborbild mit Stoerern | Auftragsnummer, `Mueller Maschinenbau GmbH`, Status, Datum und FactBox mit `Customer No. D10000` sind sichtbar. Stoerer: Document-Check-Leiste und Copilot-Zusammenfassung. | Als Laborbild geeignet. Fuer finales Buchbild Stoerer gezielt schliessen oder im Text als Anfaengerbefund erklaeren. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-030-neuer-verkaufsauftrag.png` | entfernt | Datei war identisch zum Kopf-Screenshot nach Debitoranlage. Sie zeigte keinen leeren neuen Auftrag. | Aus dem Lauf entfernt; der Test erzeugt nur noch `030-kopf-debitor-d10000`. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png` | guter Labor-Kandidat | Die FactBox ist gezielt eingeklappt. Sichtbar sind `Item`, `RM-M100`, Beschreibung, `FRA-ZL`, Menge `1`, EUR-Summen und `Total Tax (EUR) = 0,00`. | Als Laborbild fuer Zeile, Menge, Lagerort und EUR-Summen geeignet. Nicht final, weil 0-%-Tax weiter CRONUS-USA-Laborlogik ist und die Dimension separat fotografiert wird. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-041-zeile-betraege-steuer.png` | brauchbares Laborbild | DOM-Scroll des BC-Containers `freeze-pane-scrollbar` zeigt `Unit Price Excl. Tax`, `Tax Group Code = FURNITURE` und `Line Amount Excl. Tax = 68.000,00`. | Als Laborbild fuer Steuer-/Betragsspalten nutzbar. Nicht als finales deutsches Buchbild, weil CRONUS-Steuergruppe `FURNITURE` und 0-%-Tax kein deutscher USt-Nachweis sind. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-042-zeile-spaete-spalten.png` | verworfener Kontrollversuch | Scroll ans rechte Tabellenende zeigt Plan-/Shipment-/Department-Spalten. | Nicht im Buch verwenden; nur Nachweis, dass DOM-Scroll grundsaetzlich funktioniert. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-050-dimension-productline-machine.png` | guter Labor-Kandidat | `Line` -> `Related Information` -> `Dimensions` oeffnet `Edit Dimension Set Entries`. Sichtbar sind `CHANNEL = B2B` und `PRODUCTLINE = MACHINE`. | Als Buchkandidat fuer Dimensionspruefung nutzbar. Final spaeter in deutscher Umgebung neu erzeugen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png` | guter Labor-Preview-Nachweis, kein finales deutsches Buchungsvorschau-Bild | Nach `MASTERDATA-009` oeffnet `Preview Posting` echte Vorschauzeilen: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`. Der alte Fehler `Inventory Account is missing... FRA-ZL, RESALE` ist nicht mehr sichtbar. | Als Laborbild fuer Postenvorschau und Setup-Wirkung nutzbar. Nicht als finaler deutscher Buchnachweis verwenden, weil CRONUS-USA, 0-%-Tax/kein deutscher 19-%-USt-Nachweis und keine echte Buchung. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-061-preview-related-entries-gl-entry.png` | guter Labor-Drilldown-Nachweis, noch kein finales Betragsbild | Maximierter Read-only-Drilldown aus `Posting Preview` in `G/L Entries Preview`. Sichtbar sind G/L-Konten, darunter `14140`, `50110`, `40140`, `15110`; Betragsspalten liegen im aktuellen Screenshot noch rechts ausserhalb des optimalen Bildausschnitts, sind aber im Seitentext nachgewiesen. | Als Laborbild fuer Kontenwirkung und Drilldown-Strategie nutzbar. Naechster Bildschritt: horizontal auf Betragsspalten scrollen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-080-posting-dialog-before-ok.png` | wichtiger Labor-Buchungsnachweis | Zeigt den normalen Buchungsdialog vor OK; `Ship and Invoice` wurde fuer den O2C-Laborfall bewusst gewaehlt. | Als Evidence fuer kontrolliertes Buchen nutzbar. Nicht erneut ausfuehren, nicht als deutsche Finalbuchung verwenden. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-081-posting-result.png` | Labor-Ergebnisbild | Zustand nach der einmaligen Laborbuchung; die Belegnummer wird strukturiert in `080-posting-result.json` nachgewiesen. | Als Kontextbild behalten; fuer Buch besser mit gebuchter Verkaufsrechnung `082` kombinieren. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-082-posted-sales-invoice.png` | guter Laborbeleg | Gebuchte Verkaufsrechnung `PS-INV103297` zeigt Bezug zum Auftrag `S-ORD101068`, Artikel `RM-M100`, Menge `1`, Preis `68.000` und Tax-0-%-Laborgrenze. | Als Laborbild fuer gebuchte Verkaufsrechnung geeignet. Kein deutscher 19-%-USt-Endstand. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-083-customer-ledger-entries.png` | guter Labor-Postennachweis | Gefilterte Debitorenposten zur gebuchten Rechnung; Seitentext zeigt `D10000`, Betrag `68.000` und Konto-/Bezugstexte. | Als Laborbild fuer Debitorenposten geeignet; finale deutsche Posten spaeter neu erzeugen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-084-gl-entries.png` | guter Labor-Postennachweis | Gefilterte Sachposten zur gebuchten Rechnung; Seitentext enthaelt Betrag, Debitor und Konto `14140`. | Als Laborbild fuer Sachposten geeignet; keine deutsche Kontenplan-Evidence. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-085-item-ledger-entries.png` | verworfener direkter Artikelposten-Check | Page `38` blieb mit Filter `Order No. = S-ORD101068` leer. | Nicht als Artikelpostenbeweis verwenden; naechster Read-only-Check ueber `Find entries...` oder gebuchte Lieferung. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-086-value-entries.png` | guter Labor-Postennachweis | Gefilterte Wertposten zur gebuchten Rechnung; Seitentext zeigt `RM-M100` und `D10000`. | Als Laborbild fuer Wertposten geeignet; Dimensionen sind noch nicht sichtbar nachgewiesen. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-087-find-entries-posted-invoice.png` | guter Labor-Negativnachweis | `Find entries...` auf der gebuchten Rechnung zeigt Posted Sales Invoice, G/L Entry, Cust. Ledger Entry, Detailed Cust. Ledg. Entry und Value Entry, aber keinen Item Ledger Entry. | Als Lernbild geeignet: Nicht jede erwartete Postenart erscheint direkt unter `Find entries...`. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-088-item-ledger-entry-by-entry-no.png` | guter Labor-Artikelposten-Nachweis | Page `38` zeigt den Artikelposten `Entry No. 792` mit `Sales Shipment S-SHPT102297`, `RM-M100`, Lagerort `FRA-ZL` und Menge `-1`. Der Schluessel stammt aus dem Wertposten. | Als Laborbild fuer Artikelposten geeignet; keine deutsche USt- oder Dimensions-Evidence. |
| `playwright/projects/fibu-book5/img/uat-o2c-001-089-item-ledger-entry-dimensions.png` | guter Labor-Dimensionsnachweis | `Entry` -> `Dimensions` auf dem Artikelposten `792` zeigt `CHANNEL=B2B` und `PRODUCTLINE=MACHINE`. | Als Laborbild fuer Dimensionswirkung am gebuchten Artikelposten geeignet; Reportingwirkung und deutscher Finalnachweis bleiben offen. |

## `REPORTING-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-001-010-financial-reports.png` | erster Labor-Startpunkt fuer Reporting | `Financial Reports` ist ueber Tell-Me in der Gruppe `Berichte und Analysen` geoeffnet. Die Liste zeigt u. a. `Balance Sheet`, `Income Statement` und `Revenue`; unten links liegt noch ein Teaching Tip `About Financial Reports`. | Als Laborbild fuer Seiten-Erreichbarkeit und Anfaenger-Erklaerung geeignet. Noch kein Buchbild fuer `PRODUCTLINE=MACHINE`, weil kein Dimensionsfilter und keine Summenwirkung nachgewiesen sind. |

## `REPORTING-002` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-002-010-gl-entries-ps-inv103297.png` | Labor-Negativnachweis | Gefilterte Sachposten zur gebuchten Rechnung `PS-INV103297` sind sichtbar; `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` erscheinen im aktuellen Seitentext nicht. | Als Lernbild geeignet: Sachposten zeigen Konto/Betrag, aber Dimensionen muessen ggf. ueber Dialog, Dimension Set oder Dimensionsbericht nachgewiesen werden. |
| `playwright/projects/fibu-book5/img/reporting-002-020-gl-entry-dimensions.png` | verworfener Dimensionsdialogversuch | Der Test konnte im aktuellen G/L-Entries-Kontext `Entry` -> `Dimensions` nicht oeffnen; Screenshot entspricht deshalb weiter der Sachpostenliste. | Nicht als Dimensionsnachweis verwenden; naechster Lauf braucht gezielten Sachposten-Dimensionspfad. |
| `playwright/projects/fibu-book5/img/reporting-002-046-item-ledger-entry-792-dimensions.png` | guter Labor-Dimensionsnachweis | `Entry` -> `Dimensions` am Artikelposten `792` zeigt `PRODUCTLINE=MACHINE` und `CHANNEL=B2B`. | Als Laborbild fuer Dimensionsvererbung in Artikelposten geeignet; kein Financial-Reports-Endnachweis. |
| `playwright/projects/fibu-book5/img/reporting-002-055-financial-reports-list.png` | guter Labor-Startpunkt fuer naechsten Reporting-Schritt | Financial Reports ist erreichbar; sichtbar sind u. a. `Income Statement`, `Revenue`, `Balance Sheet`, `Dimension Perspective` und `Column Definition`. `PRODUCTLINE`/`CHANNEL` sind noch nicht als Filter oder Auswertungsachse sichtbar. | Als Laborbild fuer Reporting-Navigation geeignet. Naechster Bildschritt: `Dimension Perspective` oder Dimensionsbericht gezielt oeffnen. |

## `REPORTING-003` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/reporting-003-020-financial-reports-wide-layout.png` | brauchbarer Labor-Startpunkt | Financial Reports ist im breiten Viewport sichtbar; die Tabellenansicht zeigt mehr Spalten und eignet sich fuer Erklaerung von `Row Definition`, `Column Definition` und Reportingzeilen. | Als Laborbild fuer breite Layoutansicht und Reporting-Navigation geeignet; noch kein Dimensions- oder Zahlenbeweis. |
| `playwright/projects/fibu-book5/img/reporting-003-030-dimension-perspective-result.png` | rejected Negativbild | Nach dem Versuch `Definitions -> Dimension Perspective` ist kein Dimension-Perspective-Kontext sichtbar; das Bild zeigt das Role Center. | Nicht als Buchbild verwenden. Als Evidence fuer den gescheiterten Schnellpfad behalten; naechster Bildschritt ist `Dimensions - Detail` oder Analysis Views. |

## `P2P-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/p2p-001-010-vendor-k10000.png` | brauchbares Laborbild mit Stoerer | Vendor Card zeigt `K10000`, Name, Adresse, Country/Region Code `DE`, Zahlungsbedingungen und offene Betragswerte. Unten links ist noch der Teaching Tip `About vendor details` sichtbar. | Als Readiness-Laborbild geeignet; fuer finale Buchbilder Teaching Tip schliessen und Invoicing-/Posting-Felder gezielt aufklappen. |
| `playwright/projects/fibu-book5/img/p2p-001-020-item-raw-steel.png` | gutes Labor-Setupbild | Item Card zeigt `RAW-STEEL`, `PCS`, `Inventory`, `Unit Cost = 2.500,00`, `Costing Method = FIFO`, `Gen. Prod. Posting Group = RETAIL`, `Tax Group Code = FURNITURE`, `Inventory Posting Group = RESALE`. | Als Laborbild fuer RAW-STEEL-Readiness geeignet. Nicht als deutscher Rohmaterial-/VAT-Endstand verwenden. |
| `playwright/projects/fibu-book5/img/p2p-001-090-purchase-order-before-preview.png` | gutes Labor-Prozessbild | Purchase Order `106049` zeigt `K10000`, Zeile `RAW-STEEL`, Menge `10`, `Direct Unit Cost = 2.500`, `Tax Group Code = FURNITURE`, Summe `25.000` und `Total Tax = 0`. | Als Laborbild fuer Bestellung vor Preview geeignet. Nicht als deutsches EUR-/Vorsteuerbild verwenden. |
| `playwright/projects/fibu-book5/img/p2p-001-095-preview-posting.png` | guter Labor-Preview-Nachweis | `Posting Preview` zeigt echte Vorschauarten: `G/L Entry`, `Vendor Ledger Entry`, `Detailed Vendor Ledg. Entry`, `Item Ledger Entry`, `Value Entry`. | Als Laborbild fuer sichere Vorabpruefung vor P2P-Buchung geeignet. |
| `playwright/projects/fibu-book5/img/p2p-001-100-posting-dialog-before-ok.png` | wichtiger Labor-Buchungsnachweis | Normaler Buchungsdialog vor OK; `Receive and Invoice` wurde bewusst ausgewaehlt. | Als Evidence fuer kontrolliertes P2P-Buchen geeignet. Nicht erneut ausfuehren. |
| `playwright/projects/fibu-book5/img/p2p-001-110-posted-purchase-invoice.png` | guter Laborbeleg | Gebuchte Einkaufsrechnung `108219` zeigt `K10000`, `RAW-STEEL`, Menge `10`, Kosten/Betrag und Tax-0-%-Laborgrenze. | Als Laborbild fuer gebuchte Einkaufsrechnung geeignet. Kein deutscher Vorsteuer-Endstand. |
| `playwright/projects/fibu-book5/img/p2p-001-120-vendor-ledger-entries.png` | guter Labor-Postennachweis | Gefilterte Kreditorenposten zur Rechnung `108219` sind sichtbar. | Als Laborbild fuer Verbindlichkeit geeignet; Zahlung/Ausgleich fehlen noch. |
| `playwright/projects/fibu-book5/img/p2p-001-130-gl-entries.png` | guter Labor-Postennachweis | Sachposten zeigen `22100 Accounts Payable, Domestic`, `14140 Resale Items` und Betrag `25.000`. | Als Laborbild fuer Kontenwirkung geeignet. Nicht als deutscher Kontenplan-Endstand verwenden. |
| `playwright/projects/fibu-book5/img/p2p-001-140-item-ledger-entries.png` | verworfener direkter Artikelposten-Check | Page `38` blieb mit Filter `Order No. = 106049` leer. | Nicht als Artikelpostenbeweis verwenden; der belastbare Nachweis erfolgt ueber `Value Entry -> Item Ledger Entry No. = 793`. |
| `playwright/projects/fibu-book5/img/p2p-001-150-value-entries.png` | guter Labor-Postennachweis | Wertposten zeigt `RAW-STEEL`, `K10000`, Kosten `25.000` und `Item Ledger Entry No. = 793`. | Als Laborbild fuer Wertposten und Bruecke zum Artikelposten geeignet. |
| `playwright/projects/fibu-book5/img/p2p-001-155-item-ledger-entry-by-entry-no.png` | guter Labor-Artikelposten-Nachweis | Artikelposten `793` zeigt `RAW-STEEL`, Lagerort `FRA-ZL`, Menge `10` und Kostenbezug. | Als Laborbild fuer Artikelzugang geeignet; `PRODUCTLINE=MACHINE` ist in der P2P-Postenspur noch nicht sichtbar. |

## `INVENTORY-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-001-010-o2c-item-ledger-entry-rm-m100.png` | guter Labor-Artikelposten-Nachweis | Breite Layoutansicht zeigt Artikelposten `792` mit `RM-M100`, `FRA-ZL`, Menge `-1`, Sales Amount `67.673,60` und Cost Amount `-42.000,00`; Teaching Tip ist geschlossen. | Als Buchkandidat fuer die Rolle von Artikelposten geeignet. Kein deutscher Steuer-/Kontenplan-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-001-020-o2c-value-entry-rm-m100.png` | guter Labor-Wertposten-Nachweis | Wertposten zur Rechnung `PS-INV103297` zeigen `RM-M100` und die Bruecke zu `Item Ledger Entry No. 792`. | Als Buchkandidat fuer die Bruecke Wertposten -> Artikelposten geeignet. |
| `playwright/projects/fibu-book5/img/inventory-001-030-o2c-gl-entries-inventory-cogs.png` | guter Labor-Sachposten-Nachweis | Sachposten zur O2C-Rechnung zeigen u. a. `14140` und O2C-Kontenwirkung. | Als Laborbild fuer Hauptbuchwirkung geeignet; keine deutsche Kontenplan-Evidence. |
| `playwright/projects/fibu-book5/img/inventory-001-040-p2p-item-ledger-entry-raw-steel.png` | guter Labor-Artikelposten-Nachweis | Breite Layoutansicht zeigt Artikelposten `793` mit `RAW-STEEL`, `FRA-ZL`, Menge `10` und Kostenbezug. | Als Buchkandidat fuer Wareneingang/Artikelzugang geeignet; Warehouse bleibt offen. |
| `playwright/projects/fibu-book5/img/inventory-001-050-p2p-value-entry-raw-steel.png` | guter Labor-Wertposten-Nachweis | Wertposten zur Einkaufsrechnung `108219` zeigen `RAW-STEEL`, Menge/Kosten und die Bruecke zu `Item Ledger Entry No. 793`. | Als Buchkandidat fuer Bewertung der Einkaufsbewegung geeignet. |
| `playwright/projects/fibu-book5/img/inventory-001-060-p2p-gl-entries-inventory-ap.png` | guter Labor-Sachposten-Nachweis | Breite Layoutansicht zeigt Sachposten zur Einkaufsrechnung `108219`, darunter `22100` und `14140` mit `25.000`. | Als Laborbild fuer Bestand/Kreditorenwirkung geeignet; kein deutscher Kontenplan-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-001-070-item-card-rm-m100.png` | brauchbares Labor-Stammdatenbild | Item Card `RM-M100` zeigt Artikelkontext und Werte fuer O2C; breite Layoutansicht ist aktiv, aber Kartenbilder sind weniger tabellenkritisch. | Als Kontextbild nutzbar, falls das Buch Artikelkarte und Bewegungsfolge verbindet. |
| `playwright/projects/fibu-book5/img/inventory-001-080-item-card-raw-steel.png` | brauchbares Labor-Stammdatenbild | Item Card `RAW-STEEL` zeigt Artikelkontext fuer P2P/Inventory. | Als Kontextbild nutzbar; nicht als finaler Rohmaterial-/VAT-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-001-090-location-fra-zl.png` | guter Labor-Lagerortnachweis | Location `FRA-ZL` ist sichtbar; der Lauf aktiviert keine Warehouse-Logik. | Als Nachweis fuer einfachen Lagerort geeignet; gesteuertes Warehouse bleibt eigener Block. |
| `playwright/projects/fibu-book5/img/inventory-001-100-inventory-valuation-tell-me.png` | Einstieg, kein Zahlenbeweis | Tell-Me zeigt `Inventory Valuation` unter `Berichte und Analysen`. | Nur als Navigations-/Einstiegsbild verwenden. Konkrete Lagerbewertungszahlen brauchen `INVENTORY-002`. |

## `INVENTORY-002` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-002-020-inventory-valuation-request.png` | gutes Labor-Request-Page-Bild | Dialog `Inventory Valuation` zeigt `As Of Date = 08.06.2026`, `No. = RM-M100|RAW-STEEL`, `Location Filter = FRA-ZL` und die Aktion `Vorschau`. Der Hintergrund ist das Role Center; das ist fuer Report-Request-Pages normal. | Als Buchkandidat fuer Berichtseinstieg und Filterlogik geeignet. Nicht als Ergebnisbild verwenden. |
| `playwright/projects/fibu-book5/img/inventory-002-030-inventory-valuation-preview.png` | guter Labor-Zahlenbericht | Vorschau zeigt `RAW-STEEL` mit `25.000,00`, `RM-M100` mit `-42.000,00` und `Total Inventory Value = -17.000,00`; Filterkontext und Stichtag sind oben sichtbar. | Als Laborbild fuer Lagerbewertung geeignet. Buchtext muss negative RM-M100-Menge/Wert als Laborbefund erklaeren; kein deutscher Abschluss- oder Kontenplan-Endstand. |

## `INVENTORY-005` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-005-010-item-journal-direct.png` | guter Labor-Readiness-Kandidat | Page `40` zeigt `Item Journals`, Batch Name, `Post` sowie Zeilenfelder wie Posting Date, Entry Type, Document No., Item No., Location Code, Quantity, Unit Cost und Applies-to Entry. FactBox ist eingeklappt, breite Layoutansicht ist aktiv. Eine leere/default Tabellenzeile ist sichtbar, aber kein Zielartikel `RM-M100`. | Als Buch-/Lernbild fuer den kontrollierten Einstieg in positive Bestandsbewegungen geeignet. Nicht als Buchungsnachweis verwenden: keine Zielzeile, keine Preview-Wirkung, keine Postenspur. |
| `playwright/projects/fibu-book5/img/inventory-005-020-item-journals-tell-me.png` | Navigationsbild | Tell-Me wurde mit `Item Journals` genutzt und zeigt den Einstieg ohne Enter-Fallback. | Als Navigationsbild nutzbar, wenn das Buch die Suche erklaert. Der technische Folgeprozess sollte weiterhin die belegte Page-ID oder einen eindeutig gewaehlten Treffer nutzen. |

## `INVENTORY-006` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-006-010-target-journal-line-before-post.png` | guter Labor-Draft-Kandidat | Breite Layoutansicht zeigt `Item Journals` mit Zielzeile `INV006-*`, Posting Date `08.06.2026`, `RM-M100`, `Standardmaschine M100`, `FRA-ZL`, Menge `2` und `PCS`. Unit Amount/Amount/Unit Cost liegen weiter rechts und sind in `010-target-journal-line-controls.json` belegt. | Als Lernbild fuer den kontrollierten Journal-Draft geeignet. Nicht als Buchungs- oder Bestandsnachweis verwenden: keine Preview Posting, keine Postenspur, keine Lagerbewertungskorrektur, Cleanup danach erfolgt. |

## `INVENTORY-007` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-007-010-journal-check-no-issues.png` | guter Labor-Preflight-Kandidat | Item Journals zeigt die Zielzeile `RM-M100`, `FRA-ZL`, Menge `2`; die rechte FactBox bleibt bewusst sichtbar und zeigt `Journal Check` mit `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` und `No issues found`. Unit Amount/Amount/Unit Cost sind zusaetzlich in `010-journal-check-controls.json` belegt. | Als Lernbild fuer den nicht buchenden Preflight vor einer positiven Bestandsbewegung geeignet. Nicht als Buchungs-, Posten- oder Lagerbewertungsnachweis verwenden; keine deutsche Final-Evidence. |

## `INVENTORY-008` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/inventory-008-010-journal-line-before-post.png` | guter Labor-Preposting-Kandidat | Item Journals zeigt die Zielzeile `INV008-899959` mit `RM-M100`, `FRA-ZL`, Menge `2`; die Evidence belegt Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00` und Journal Check ohne sichtbare Issues fuer die aktuelle Zeile. | Als Buch-/Lernbild fuer die letzte Kontrolle vor der Laborbuchung geeignet. Nicht als Postenspur oder Bestandsergebnis verwenden. |
| `playwright/projects/fibu-book5/img/inventory-008-030-post-confirm-dialog.png` | wichtiger Labor-Buchungsnachweis | Zeigt den normalen Buchungsdialog vor der genau einmaligen Bestaetigung der Item-Journal-Zeile. | Als Evidence fuer bewusste Laborbuchung geeignet; nicht erneut ausfuehren, kein deutsches Finalbild. |
| `playwright/projects/fibu-book5/img/inventory-008-040-post-result.png` | Labor-Ergebnisbild | Zustand nach der Bestaetigung; die belastbare Buchungswahrheit steht in `INVENTORY-008-POSTING-result.json` und den Postenbildern. | Als Kontextbild behalten; fuer Buchtext mit Artikelposten/Wertposten/Sachposten kombinieren. |
| `playwright/projects/fibu-book5/img/inventory-008-050-item-ledger-entry.png` | guter Labor-Artikelposten-Nachweis | Gefilterte Artikelposten zur Belegnummer `INV008-899959` zeigen `RM-M100`, `FRA-ZL`, Menge `2` und Wertbezug. | Als Buchkandidat fuer Mengenwirkung einer positiven Artikeljournalbuchung geeignet; keine deutsche Final-Evidence. |
| `playwright/projects/fibu-book5/img/inventory-008-060-value-entry.png` | guter Labor-Wertposten-Nachweis | Wertposten zur Belegnummer zeigen `RM-M100`, Menge `2`, Kostenbetrag `84.000` und Unit Cost `42.000`. | Als Buchkandidat fuer Bewertungswirkung geeignet; nicht als Kostenregulierung oder Reporting-Summe ausgeben. |
| `playwright/projects/fibu-book5/img/inventory-008-070-gl-entry.png` | guter Labor-Sachposten-Nachweis | Sachposten zur Belegnummer zeigen Konto `14140` und Betrag `84.000`. | Als Laborbild fuer Hauptbuchwirkung geeignet; kein deutscher Kontenplan-Endstand. |
| `playwright/projects/fibu-book5/img/inventory-008-090-inventory-valuation-request.png` | gutes Labor-Request-Page-Bild | Request Page zeigt Stichtag, Artikelfilter `RM-M100|RAW-STEEL` und Lagerortfilter `FRA-ZL`. | Als Buchbild fuer Reportfilter geeignet; Ergebniswirkung erst mit Preview-Bild. |
| `playwright/projects/fibu-book5/img/inventory-008-091-inventory-valuation-preview.png` | guter Labor-Zahlenbericht nach Korrektur | Vorschau zeigt nach der Laborbuchung `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00` und `Total Inventory Value = 67.000,00`. | Als Laborbild fuer die korrigierte Lagerbewertung geeignet. Nicht als deutscher Abschluss- oder Kostenregulierungsnachweis verwenden. |

## Harte Findings aus dem Review

### QA-O2C-001 Listenbild zeigt nicht den Buchfall

Das Listenbild `020` darf nicht als Beleg fuer den Auftrag `D10000` gelesen werden. Es ist ein Navigationsbild. Fuer den Buchfall muss der erzeugte Auftrag entweder in der Karte oder in einer gefilterten Liste sichtbar sein.

### QA-O2C-002 Zeilenbild zeigt nicht alle behaupteten Pruefpunkte

Das aktuelle Zeilenbild beweist Artikel, Beschreibung, Lagerort, Menge, EUR-Summen und den Laborbefund `Total Tax (EUR) = 0,00`. Es beweist bewusst nicht den deutschen 19-%-USt-Endstand. Die Dimension wurde separat ueber den Zeilendialog `Edit Dimension Set Entries` nachgewiesen.

### QA-O2C-003 Stoerer im Screenshot muessen aktiv entschieden werden

Document Check, Copilot Summary, FactBoxes, Hilfe- und Tourkarten koennen fuer Anfaenger lehrreich sein. Fuer finale Prozessbilder muessen sie aber entweder entfernt oder im Begleittext erklaert werden.

Aktuelle technische Regel: Page-Teaching-Tips werden vor Tabellen-/Feldnachweisen mit `dismissTours()` gezielt geschlossen. Fuer breite Tabellen kann `hideFactBoxPane()` verwendet werden, wenn die rechte Infobox/FactBox den relevanten Spaltenraum nimmt. Wenn BC eine breite Layoutansicht oder eine vergroesserte Detail-/Listenansicht anbietet, darf sie fuer Buchscreenshots genutzt werden, sofern Evidence und Buchtext erklaeren, welche Felder dadurch sichtbar werden.

### QA-O2C-004 Evidence-Text enthaelt UI-Resize-/Skriptartefakte

`040-zeile-artikel-rm-m100-page-text.txt` enthaelt nach dem fachlichen Seitentext auch Resize-Hinweise und Skripttext. `pageText()` ist deshalb als Roh-Evidence nuetzlich, aber nicht als sauberer Buchauszug. Fuer Assertions und Evidence braucht das Projekt kuenftig gescopte Extraktion aus Karten-, Listen- oder FactBox-Bereichen.

### QA-O2C-005 Seitentext ist kein Sichtbarkeitsnachweis

Die Scrollversuche zeigen: Werte koennen im BC-DOM beziehungsweise Seitentext vorhanden sein, ohne im Screenshot wirklich sichtbar zu sein. Screenshot-Metadaten verwenden deshalb den Begriff `expectedPageText`, nicht `expectedVisible`. Finale Buchfreigabe braucht visuelle Pruefung oder einen gezielt gescopten Screenshot.

### QA-O2C-006 Horizontaler Grid-Scroll ist moeglich, aber kontrollpflichtig

Business Central nutzt fuer das Verkaufszeilengrid einen horizontal scrollbaren Container `freeze-pane-scrollbar`. DOM-Scroll auf diesen Container funktioniert besser als Mauskoordinaten. Der mittlere Scrollwert liefert ein brauchbares Laborbild fuer Steuer- und Betragsspalten. Fuer finale Buchbilder muss der Zielbereich aber bewusst gewaehlt und visuell geprueft werden.

### QA-O2C-007 Buchungsvorschau zeigt jetzt Labor-Postenvorschau, aber keinen DE-Finalnachweis

`060` zeigt nach `MASTERDATA-009` nicht mehr die BC-Fehlerseite, sondern `Posting Preview` mit echten Vorschauzeilen. Didaktisch ist das Bild wertvoll, weil es zeigt, dass ein Setup-Fix nicht durch eine echte Buchung geprueft werden muss: Die Buchungsvorschau reicht als sicherer Labor-Nachweis. Fuer den finalen O2C-Nachweis bleiben deutsche Sprache, 19-%-USt, bewusste Buchungsfreigabe und Postenspur offen.

### QA-O2C-008 Laborbuchung ist erfolgt, aber bleibt CRONUS-USA-Evidence

`080` bis `089` zeigen die einmalige Laborbuchung `S-ORD101068` -> `PS-INV103297` und die erste Postenspur. Diese Bilder sind fuer das Lernen stark, weil sie die Wirkung von `Ship and Invoice` sichtbar machen. Sie sind aber keine deutschen Finalbilder: Steuer bleibt 0 %, Konten sind CRONUS-USA-Laborfit, und Reporting nach `PRODUCTLINE=MACHINE` ist noch offen.

## Verbesserungsregeln fuer die naechsten Laeufe

- Vor jedem Screenshot muss der Test pruefen, ob der Zielwert im Seitentext vorhanden ist; die visuelle Buchfreigabe erfolgt zusaetzlich ueber Screenshot-QA.
- Screenshots bekommen einen Status: `labor`, `candidate`, `final`, `rejected`.
- Screenshot-Metadaten gehoeren zum Evidence Pack und muessen vor Buchverwendung gelesen werden.
- Redundante Screenshots werden nicht ins Buch referenziert.
- Tabellenbilder brauchen eine definierte Spaltenstrategie: breiter Viewport, breite Layoutansicht, horizontaler Scroll, Zeilendetail, Personalisierung oder mehrere Detailbilder.
- `INVENTORY-001` nutzt `Breites Layout umschalten` fuer gefilterte Tabellenbilder; die JSON-Evidence protokolliert `wideLayoutActivated = true`.
- `INVENTORY-002` zeigt: Bei Report-Request-Pages ist ein grosser Viewport stabiler als ein generischer Maximize-/Breites-Layout-Klick. Globaler Tour-Cleanup darf dort nicht blind laufen, weil Overlays den Reportkontext stoeren koennen.
- Fuer Dimensionen reicht kein Stammdatenbild. Der O2C-Lauf nutzt jetzt `Line` -> `Related Information` -> `Dimensions` als Belegnachweis; spaetere Buchungslaufe muessen die Dimension zusaetzlich in Posten oder Reporting wiederfinden.
- Rohes `pageText()` wird nicht ungefiltert als redaktionelle Wahrheit verwendet.
