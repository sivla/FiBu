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
| Lagerbewertung | Inventory Valuation | n/a | Request Page, `As Of Date`, Item-Filter `No.`, `Location Filter`, `Vorschau`, Report Viewer | Stichtagsbezogene Lagerbewertung nach Artikel und Lagerort erzeugen | `INVENTORY-002` | `playwright/projects/fibu-book5/img/inventory-002-020-inventory-valuation-request.png`; `playwright/projects/fibu-book5/img/inventory-002-030-inventory-valuation-preview.png`; `playwright/projects/fibu-book5/evidence/inventory-002/` | erledigt als Labor-Zahlenbericht; kein DE-Finalabschluss | Kapitel 13/23 |
| Lagerbestand | Item Journals | 40 | `Post`, Batch Name, Posting Date, Entry Type, Document No., Item No., Location Code, Quantity, Unit Amount, Amount, Unit Cost, `Line` -> `Dimensions`, FactBox `Journal Check`, Zeilenmenue `Weitere Optionen anzeigen` -> `Zeile loeschen`, Buchungsdialog | positiven Trainings-/Opening-Balance-Zugang `RM-M100 +2` kontrolliert vorbereiten, pruefen, genau einmal buchen und Postenspur sichern | `INVENTORY-005`, `INVENTORY-006`, `INVENTORY-007`, `INVENTORY-008` | `playwright/projects/fibu-book5/img/inventory-005-010-item-journal-direct.png`; `playwright/projects/fibu-book5/img/inventory-006-010-target-journal-line-before-post.png`; `playwright/projects/fibu-book5/img/inventory-007-010-journal-check-no-issues.png`; `playwright/projects/fibu-book5/img/inventory-008-*`; `playwright/projects/fibu-book5/evidence/inventory-005/`; `playwright/projects/fibu-book5/evidence/inventory-006/`; `playwright/projects/fibu-book5/evidence/inventory-007/`; `playwright/projects/fibu-book5/evidence/inventory-008/` | erledigt als CRONUS-USA-Labor: Zielzeile, Unit Cost, `PRODUCTLINE=MACHINE`, Journal Check/Current line ohne Issues, bewusster `Post`-Dialog, Buchung `INV008-899959`, Artikelposten/Wertposten/Sachposten und Inventory Valuation sichtbar; keine deutsche Final-Evidence | Kapitel 13/23 |

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
| Reporting | Analysis Views | n/a | `Analysis by Dimensions`, `Update`, `Dimension 1 Code` bis `Dimension 4 Code`, `REVENUE` Card | Dimensionsbasierte Reporting-Sichten pruefen und klaeren, ob Buchdimensionen eingerichtet sind | `REPORTING-004` | `playwright/projects/fibu-book5/img/reporting-004-020-analysis-views-list.png`; `playwright/projects/fibu-book5/img/reporting-004-030-revenue-analysis-view-card.png`; `evidence/reporting-004/` | verstanden als Labor-Negativbefund: `REVENUE` nutzt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, nicht `PRODUCTLINE`/`CHANNEL` | Kapitel 10/25 |

## Payments / OP-Ausgleich

| Bereich | Seite | Page-ID | UI-Element | Funktion | Testfall | Screenshot/Evidence | Status | Buchstelle |
|---|---|---:|---|---|---|---|---|---|
| Payments | Customer Ledger Entries | 25 | Filter `Document No.`, Spalten `Customer No.`, `Original Amount`, `Remaining Amount`, `Due Date`, FactBox `Applied Entries`, Aktionen `Apply Entries`/Payment-Kontext | offenen Debitorenposten zur gebuchten Verkaufsrechnung `PS-INV103297` als Startpunkt fuer Zahlungseingang und Ausgleich pruefen | `PAYMENTS-001` | `playwright/projects/fibu-book5/img/payments-001-010-customer-ledger-entry-ps-inv103297.png`; `evidence/payments-001/` | gesehen/verstanden als read-only Labor-Readiness; keine Zahlung und kein Ausgleich | Kapitel 19/20 |
| Payments | Vendor Ledger Entries | 29 | Filter `Document No.`, Spalten `Vendor No.`, `Original Amount`, `Remaining Amount`, `Due Date`, Related G/L Entries, Aktionen `Apply Entries`/Payment-Kontext | offenen Kreditorenposten zur gebuchten Einkaufsrechnung `108219` als Startpunkt fuer Zahlungsausgang und Ausgleich pruefen | `PAYMENTS-001` | `playwright/projects/fibu-book5/img/payments-001-020-vendor-ledger-entry-108219.png`; `evidence/payments-001/` | gesehen/verstanden als read-only Labor-Readiness; keine Zahlung und kein Ausgleich | Kapitel 19/20 |
| Payments | Bank Accounts | 371 | Bankkontenliste, `CHECKING`, `SAVINGS`, Balance, Aktion `Neu` | Bankkonto-Readiness fuer Zahlungen pruefen und erkennen, dass Zielbankkonto `BANK-RM-01` im Labor fehlt | `PAYMENTS-002` | `playwright/projects/fibu-book5/img/payments-002-010-bank-accounts.png`; `evidence/payments-002/` | verstanden als Labor-Blocker: vorhandene CRONUS-Bankkonten sichtbar, `BANK-RM-01` fehlt | Kapitel 20 |
| Payments | Bank Accounts / API v2.0 `bankAccounts` | 371 / API | `BANK-RM-01`, `displayName`, Bankkontenliste | Zielbankkonto als Laborbankkonto idempotent anlegen und sichtbar pruefen | `PAYMENTS-003` | `playwright/projects/fibu-book5/img/payments-003-010-bank-accounts-bank-rm-01-fit.png`; `evidence/payments-003/` | erledigt als Labor-Setup; keine Zahlung, kein Ausgleich, Bank Account Posting Group/Sachkonto-Fit offen | Kapitel 20 |
| Payments | Cash Receipt Journals | 255 | Batch Name `GENERAL`, Felder Posting Date, Document Type/No., Account Type/No., Amount, Bal. Account, `Apply Entries`, `Journal Check`, `Post` | Zahlungseingangspfad und Zahlungsjournal-Readiness mit Laborbankkonto pruefen | `PAYMENTS-002`, `PAYMENTS-004` | `playwright/projects/fibu-book5/img/payments-002-020-cash-receipt-journal.png`; `playwright/projects/fibu-book5/img/payments-004-010-cash-receipt-journal-readiness.png`; `evidence/payments-002/`; `evidence/payments-004/` | gesehen/verstanden als Readiness: `PAYMENTS-004` bestaetigt Pflichtfelder, Gegenkonto-/Ausgleichshinweise und Journal Check read-only mit `BANK-RM-01` als vorhandener Laborbank; keine Journalzeile bewusst gefuellt, keine Zahlung, kein Ausgleich | Kapitel 19/20 |
| Payments | Payment Journals | 256 | Batch Name `CASH`, Felder Posting Date, Document Type Payment, Account Type Vendor, Account No., Recipient Bank Account, Aktion `Post`, `Apply Entries`, FactBox Journal Check | Zahlungsausgangspfad read-only pruefen | `PAYMENTS-002` | `playwright/projects/fibu-book5/img/payments-002-030-payment-journal.png`; `evidence/payments-002/` | gesehen/verstanden als Readiness; keine Journalzeile bewusst gefuellt, keine Buchung | Kapitel 19/20 |
| Payments | Apply Entries | n/a | `Start`/`Entry` -> `Apply Entries`, Warnaktionen wie `Set Applies-to ID`/`Post Application` bewusst nicht geklickt | Ausgleichspfad aus offenen Debitoren-/Kreditorenposten oeffnen, ohne Ausgleich anzuwenden | `PAYMENTS-002` | `playwright/projects/fibu-book5/img/payments-002-050-customer-apply-entries.png`; `playwright/projects/fibu-book5/img/payments-002-070-vendor-apply-entries.png`; `evidence/payments-002/` | geklickt/verstanden als Pfadnachweis; kein Ausgleich | Kapitel 19 |

## Naechste Inventarziele

| Reihenfolge | Ziel |
|---:|---|
| 1 | `PAYMENTS-005`: kontrollierte, bereinigbare Cash-Receipt-Journal-Entwurfszeile fuer `D10000`/`PS-INV103297` mit Gegenkonto `BANK-RM-01`; weiterhin nicht buchen, bis Journal Check, Betragsrichtung, Ausgleichsbezug und Posting-Fit belegt sind |
| 2 | Reporting weiterfuehren: `Dimensions - Detail` read-only pruefen oder Analysis-View-Fit fuer `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` planen |
| 3 | Inventory-Laborblock didaktisch abrunden: Item Journal, Journal Check, Buchungsdialog, Artikelposten, Wertposten, Sachposten und Inventory Valuation fuer Anfaenger erklaeren; keine weitere `INV008`-Buchung |
| 4 | G/L Entry Dimensions zu `PS-INV103297` read-only pruefen, ohne neue O2C-Buchung |
| 5 | Steuerfit: CRONUS-USA-Probelauf weiter vom deutschen Ziel-Fall `19 %` trennen |
| 6 | Warehouse-Block: `FRA-ZL` spaeter mit Bins/Receipts/Picks ausbauen |

## Definition of Done fuer eine Funktion
Eine Funktion gilt erst als erledigt, wenn:

1. sie in BC sichtbar war
2. ihr UI-Ort dokumentiert ist
3. sie geklickt oder bewusst nicht ausgeführt wurde
4. das Ergebnis geprüft wurde
5. ein Screenshot oder Evidence existiert
6. die fachliche Bedeutung im Buch oder Projekt dokumentiert ist
7. offene Fragen in `playwright/FINDINGS.md` geklärt sind
