# UI- und Funktionsinventar Business Central

Dieses Inventar ist der Nachweis, dass wir Business Central nicht nur theoretisch beschreiben, sondern die relevanten Klickpfade, Buttons, Menüs, Felder, FactBoxes, Dialoge und Funktionen mit Playwright tatsächlich durchgespielt haben.

## Ziel

Wenn das Projekt fertig ist, kennen wir Business Central für den Buchumfang nicht aus Behauptungen, sondern aus echter Nutzung:

- Seite wurde geöffnet.
- Button oder Aktion wurde sichtbar gemacht.
- Funktion wurde ausgeführt oder bewusst als nicht auszuführen markiert.
- Ergebnis wurde geprüft.
- Screenshot oder Evidence wurde abgelegt.
- Buchtext wurde ergänzt, wenn das Element fachlich relevant ist.

## Statuswerte

| Status | Bedeutung |
|---|---|
| `offen` | im Buch oder BC sichtbar, aber noch nicht getestet |
| `gesehen` | UI-Element wurde im Screenshot/Evidence sichtbar |
| `geklickt` | Button/Aktion wurde mit Playwright oder manuell im Lauf ausgelöst |
| `verstanden` | fachlicher Zweck ist dokumentiert |
| `buch-update` | muss ins Buch eingearbeitet werden |
| `erledigt` | getestet, verstanden, dokumentiert |
| `nicht-ausführen` | Funktion ist sichtbar, aber im Trainingslauf bewusst nicht auszulösen |

## Inventarspalten

| Spalte | Bedeutung |
|---|---|
| Bereich | Prozessbereich, z. B. O2C, P2P, Lager |
| Seite | Business-Central-Seite |
| Page-ID | technische Page-ID, wenn bekannt |
| UI-Element | Button, Menü, Feld, FactBox, Dialog |
| Funktion | fachlicher Zweck |
| Testfall | Playwright-Test oder UAT-Fall |
| Screenshot/Evidence | Datei oder Ordner |
| Status | Bearbeitungsstand |
| Buchstelle | Kapitel/Abschnitt |

## Foundation und Navigation

| Bereich | Seite | Page-ID | UI-Element | Funktion | Testfall | Screenshot/Evidence | Status | Buchstelle |
|---|---|---:|---|---|---|---|---|---|
| Navigation | Role Center | n/a | Search/Tell-Me | Seiten, Aktionen und Berichte finden | `UAT-START-001` | `playwright/projects/fibu-book5/img/uat-start-001-050-alt-q-suche.png` | verstanden | Kapitel 4/8 |
| Navigation | Tell-Me | n/a | Suchtrefferliste | richtigen Seitentreffer wählen | `FIND-BC-UI-001` | `playwright/FINDINGS.md` | erledigt | Kapitel 8 |
| Company | Companies | n/a | Copy | Company aus CRONUS kopieren | `FOUNDATION-001` | `playwright/projects/fibu-book5/img/foundation-001-*` | erledigt | Kapitel 6 |
| Company | Company Information | n/a | Textfelder | Unternehmensdaten pflegen | `FOUNDATION-002` | `playwright/projects/fibu-book5/img/foundation-002-*` | erledigt | Kapitel 6 |

## Masterdata-Audit

| Bereich | Seite | Page-ID | UI-Element | Funktion | Testfall | Screenshot/Evidence | Status | Buchstelle |
|---|---|---:|---|---|---|---|---|---|
| Debitoren | Customers | 22 | Liste, New, Customer, FactBoxes | Debitoren verwalten und Verkaufsinformationen prüfen | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-customers.png` | gesehen | Kapitel 7/11 |
| Artikel | Items | 31 | Liste, New, Item | Artikel verwalten | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-items.png` | gesehen | Kapitel 7/13 |
| Lager | Locations | 15 | Liste, New, Location | Lagerorte verwalten | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-locations.png` | gesehen | Kapitel 7/13 |
| Dimensionen | Dimensions | 536 | Liste, New, Dimension Values | Dimensionen und Werte verwalten | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-dimensions.png` | gesehen | Kapitel 10 |
| Dimensionen | Dimensions | 536 | Neu, `Neu - Dimensions`, Code, Name | Dimensionen `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP` anlegen; `DEPARTMENT` als bestehend erkennen | `MASTERDATA-002` | `playwright/projects/fibu-book5/img/masterdata-002-dimensions-rhein-main.png`; `playwright/projects/fibu-book5/evidence/masterdata-002/` | erledigt | Kapitel 10 |
| Dimensionen | Dimension Values | n/a | Dimension, Dimension Values, Code, Name, Dimension Value Type | Dimensionswerte `MACHINE`, `B2B`, `SALES`, `DIRECTED` anlegen und nach Neuöffnen prüfen | `MASTERDATA-003` | `playwright/projects/fibu-book5/img/masterdata-003-dimension-values-rhein-main.png`; `playwright/projects/fibu-book5/evidence/masterdata-003/` | erledigt | Kapitel 10 |
| Dimensionen | Dimensions / BC API | 536 / API v2.0 | Dimensionsliste, `dimensions`, `dimensionValues` | Buchstandard-Dimensionsmatrix gegen `RM-DEMO` pruefen und API-Anlagegrenze erkennen | `MASTERDATA-DIMENSIONS` | `playwright/projects/fibu-book5/img/masterdata-dimensions-010-book-standard-dimensions.png`; `playwright/projects/fibu-book5/evidence/masterdata-dimensions/` | verstanden als Labor-Delta: O2C-Kern passt, `COMPANY-GROUP` und mehrere Erweiterungswerte fehlen | Kapitel 10 |
| Dimensionen | Dimension Values | n/a | Dimension Values Grid, New Line, Persistenz nach Neuoeffnen | P1-Werte `PURCH`, `WHSE`, `SPARE`, `SIMPLE` fuer Einkauf, Lager und einfache Lagerlogik anlegen | `MASTERDATA-010` | `playwright/projects/fibu-book5/img/masterdata-010-p1-location-group-simple.png`; `playwright/projects/fibu-book5/evidence/masterdata-010/` | erledigt als Labor-Setup fuer P2P/Inventory-Vorbereitung | Kapitel 10/12/13 |
| Lager | Locations / Location Card | 15 | Neu, Code, Name, Warehouse-FastTabs | Lagerort `FRA-ZL` für ersten O2C-Fit anlegen; gesteuerte Warehouse-Logik später separat | `MASTERDATA-004` | `playwright/projects/fibu-book5/img/masterdata-004-locations-rhein-main.png`; `playwright/projects/fibu-book5/evidence/masterdata-004/` | erledigt | Kapitel 7/13 |
| Debitoren | Customers | 22 | Liste, Debitorenzeile, FactBoxes | Debitor `D10000` als Rhein-Main-Stammdatum sichtbar prüfen | `MASTERDATA-005` | `playwright/projects/fibu-book5/img/masterdata-005-customers-after-api.png`; `playwright/projects/fibu-book5/evidence/masterdata-005/api-result.json` | erledigt | Kapitel 7/11 |
| Artikel | Item Card / Items | 30/31 | Details, Costs & Posting, Required Fields | Artikel `RM-M100` mit Kosten/Preis sichtbar prüfen; fehlende Buchungsfelder erkennen | `MASTERDATA-005`; `FIND-BC-API-001` | `playwright/projects/fibu-book5/img/masterdata-005-items-after-api.png`; `playwright/projects/fibu-book5/evidence/masterdata-005/api-result.json` | erledigt | Kapitel 7/13 |
| Posting-Fit | Customer Card / Item Card / Sales Orders API | 21/30/31 | Apply Template, Base Unit, Posting Groups, Sales Order Probe | Debitor- und Artikel-Posting-Fit für ersten CRONUS-O2C-Probelauf herstellen | `MASTERDATA-006` | `playwright/projects/fibu-book5/img/masterdata-006-customer-template-fit.png`; `playwright/projects/fibu-book5/img/masterdata-006-item-posting-fit.png`; `playwright/projects/fibu-book5/evidence/masterdata-006/api-result.json` | erledigt | Kapitel 9/11 |
| Dimensionen | Default Dimensions / Customer Card / Item Card | 540/21/30 | Standarddimension, `Same Code`, Page-540-Filter, Stammdatenkarten | `RM-M100` auf `PRODUCTLINE=MACHINE` und `D10000` auf `CHANNEL=B2B` setzen und im Dialog sichtbar prüfen | `MASTERDATA-007` | `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png`; `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-customer-d10000.png`; `playwright/projects/fibu-book5/evidence/masterdata-007/api-result.json` | erledigt als API- und UI-Labornachweis | Kapitel 10/11 |
| Posting | General Posting Setup | 314 | Liste bearbeiten, Suggest Accounts, Copy | Erlös-/Aufwandskonten für Gruppenmatrix | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-general-posting-setup.png` | gesehen | Kapitel 9 |
| Steuer | VAT/Tax Posting Setup | 472 | Liste bearbeiten, Suggest Accounts, Copy | USt-/Tax-Konten und Steuersätze | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-vat-posting-setup.png` | gesehen | Kapitel 9/22 |
| Lagerbewertung | Inventory Posting Setup | 5826 | Liste bearbeiten, Suggest Accounts | Bestandskonten je Lagerort/Posting Group | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-inventory-posting-setup.png` | gesehen | Kapitel 9/13/23 |

## O2C

| Bereich | Seite | Page-ID | UI-Element | Funktion | Testfall | Screenshot/Evidence | Status | Buchstelle |
|---|---|---:|---|---|---|---|---|---|
| Verkauf | Sales Orders | 9305 | Tell-Me-Suche, Liste, Aktion `Neu` | Einstieg in offene Verkaufsaufträge; richtige Seite statt gebuchte Belege wählen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-010-suche-verkaufsauftraege.png`; `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`; `SCREENSHOT-QA.md` | gesehen als Labor-/Navigationsbild | Kapitel 11 |
| Verkauf | Sales Order | 42 | Auftragskopf, `Customer Name`, FactBox `Sell-to Customer Sales History` | Debitor auswählen und fachliche Nummer `D10000` prüfen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`; `evidence/uat-o2c-001/030-kopf-debitor-d10000-page-text.txt` | erledigt als Laborbild | Kapitel 11 |
| Verkauf | Sales Order Lines | 42 | Zeilengrid, horizontaler Container `freeze-pane-scrollbar`, `Type`, `No.`, `Location Code`, Menge, Preis, `Tax Group Code`, Betrag | Artikel `RM-M100` mit Menge `1`, Lagerort `FRA-ZL`, Preis `68.000`, EUR-Summen und CRONUS-Steuergruppe sichtbar pruefen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png`; `playwright/projects/fibu-book5/img/uat-o2c-001-041-zeile-betraege-steuer.png`; `playwright/projects/fibu-book5/img/uat-o2c-001-042-zeile-spaete-spalten.png`; `evidence/uat-o2c-001/039-factbox-hidden-result.json`; `SCREENSHOT-QA.md` | verstanden als Laborbild/Scrollstrategie; FactBox wird fuer Tabellenbreite eingeklappt; DE-Steuernachweis offen | Kapitel 11 |
| Verkauf/Steuer | Sales Order API / Sales Order Card | n/a/42 | Ziel-vs.-Labor-Abweichung | Erkennen, dass CRONUS-USA-Lauf zwar `EUR`, aber nicht deutsches `19 %`-Setup beweist | `UAT-O2C-001` | `evidence/uat-o2c-001/045-target-vs-labor-delta.md`; `evidence/uat-o2c-001/046-o2c-lab-learning-summary.md`; `WORKAROUNDS-AND-ERRORS.md` | verstanden, Steuer-Setup-Luecke offen | Kapitel 9/11/22 |
| Verkauf | Sales Order | 42 | `Post...` -> `Preview Posting` | Nicht buchende Buchungsvorschau mit erwarteten Postenarten oeffnen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png`; `evidence/uat-o2c-001/060-preview-posting-result.json` | erledigt als Labor-Preview | Kapitel 11 |
| Verkauf | Sales Order | 42 | Buchungsdialog `Ship and Invoice` | Genau eine kontrollierte Laborbuchung ausfuehren | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-080-posting-dialog-before-ok.png`; `evidence/uat-o2c-001/080-posting-result.json` | erledigt als Laborbuchung; nicht erneut ausfuehren | Kapitel 11 |
| Verkauf/Fibu | Posted Sales Invoice | 132 | Gebuchte Verkaufsrechnung | Gebuchten Beleg `PS-INV103297` read-only pruefen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-082-posted-sales-invoice.png`; `evidence/uat-o2c-001/082-posting-entry-trace.json` | erledigt als Laborbeleg | Kapitel 11 |
| Fibu | Customer Ledger Entries / G/L Entries | 25/20 | Postenlisten mit Belegnummerfilter | Forderung und Sachposten zur Laborrechnung pruefen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-083-customer-ledger-entries.png`; `playwright/projects/fibu-book5/img/uat-o2c-001-084-gl-entries.png`; `evidence/uat-o2c-001/082-posting-entry-trace.json` | erledigt als Labor-Postenspur; G/L-Dimensionen offen | Kapitel 9/11/19 |
| Lager/Fibu | Value Entries / Item Ledger Entries | 5802/38 | Wertposten-Link auf `Item Ledger Entry No.`; `Entry` -> `Dimensions` | Artikelposten aus Wertposten finden und Dimensionen am Artikelposten pruefen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-086-value-entries.png`; `playwright/projects/fibu-book5/img/uat-o2c-001-088-item-ledger-entry-by-entry-no.png`; `playwright/projects/fibu-book5/img/uat-o2c-001-089-item-ledger-entry-dimensions.png` | erledigt als Labor-Dimensionsnachweis am Artikelposten | Kapitel 10/11/13 |
| Reporting | Financial Reports | n/a | Tell-Me Treffergruppe `Berichte und Analysen`, Berichtsliste | Einstieg in Finanzberichte fuer spaeteren Dimensionsnachweis | `REPORTING-001` | `playwright/projects/fibu-book5/img/reporting-001-010-financial-reports.png`; `evidence/reporting-001/010-financial-reports-open-result.json` | gesehen/geklickt; Filterwirkung offen | Kapitel 10/25 |

## Naechste Inventarziele

| Reihenfolge | Ziel |
|---:|---|
| 1 | `REPORTING-002`: Financial Reports maximieren, passenden Report waehlen und Dimensions-/Filterfelder fuer `PRODUCTLINE=MACHINE` suchen |
| 2 | G/L Entry Dimensions zu `PS-INV103297` read-only pruefen, ohne neue O2C-Buchung |
| 3 | Steuerfit: CRONUS-USA-Probelauf weiter vom deutschen Ziel-Fall `19 %` trennen |
| 4 | P2P-/Kreditoren-Stammdaten vorbereiten: `K10000`, `RAW-STEEL`, Default Dimensions, Vendor/General Posting Setup, Tax/VAT-Laborgrenze |
| 5 | Warehouse-Block: `FRA-ZL` spaeter mit Bins/Receipts/Picks ausbauen |

## Definition of Done fuer eine Funktion
Eine Funktion gilt erst als erledigt, wenn:

1. sie in BC sichtbar war
2. ihr UI-Ort dokumentiert ist
3. sie geklickt oder bewusst nicht ausgeführt wurde
4. das Ergebnis geprüft wurde
5. ein Screenshot oder Evidence existiert
6. die fachliche Bedeutung im Buch oder Projekt dokumentiert ist
7. offene Fragen in `playwright/FINDINGS.md` geklärt sind
