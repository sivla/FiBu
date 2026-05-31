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
| Navigation | Role Center | n/a | Search/Tell-Me | Seiten, Aktionen und Berichte finden | `UAT-START-001` | `img/uat-start-001-050-alt-q-suche.png` | verstanden | Kapitel 4/8 |
| Navigation | Tell-Me | n/a | Suchtrefferliste | richtigen Seitentreffer wählen | `FIND-BC-UI-001` | `playwright/FINDINGS.md` | buch-update | Kapitel 8 |
| Company | Companies | n/a | Copy | Company aus CRONUS kopieren | `FOUNDATION-001` | `img/foundation-001-*` | erledigt | Kapitel 6 |
| Company | Company Information | n/a | Textfelder | Unternehmensdaten pflegen | `FOUNDATION-002` | `img/foundation-002-*` | erledigt | Kapitel 6 |

## Masterdata-Audit

| Bereich | Seite | Page-ID | UI-Element | Funktion | Testfall | Screenshot/Evidence | Status | Buchstelle |
|---|---|---:|---|---|---|---|---|---|
| Debitoren | Customers | 22 | Liste, New, Customer, FactBoxes | Debitoren verwalten und Verkaufsinformationen prüfen | `MASTERDATA-001` | `img/masterdata-001-customers.png` | gesehen | Kapitel 7/11 |
| Artikel | Items | 31 | Liste, New, Item | Artikel verwalten | `MASTERDATA-001` | `img/masterdata-001-items.png` | gesehen | Kapitel 7/13 |
| Lager | Locations | 15 | Liste, New, Location | Lagerorte verwalten | `MASTERDATA-001` | `img/masterdata-001-locations.png` | gesehen | Kapitel 7/13 |
| Dimensionen | Dimensions | 536 | Liste, New, Dimension Values | Dimensionen und Werte verwalten | `MASTERDATA-001` | `img/masterdata-001-dimensions.png` | gesehen | Kapitel 10 |
| Dimensionen | Dimensions | 536 | Neu, `Neu - Dimensions`, Code, Name | Dimensionen `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP` anlegen; `DEPARTMENT` als bestehend erkennen | `MASTERDATA-002` | `img/masterdata-002-dimensions-rhein-main.png`; `playwright/projects/fibu-book5/evidence/masterdata-002/` | erledigt | Kapitel 10 |
| Posting | General Posting Setup | 314 | Liste bearbeiten, Suggest Accounts, Copy | Erlös-/Aufwandskonten für Gruppenmatrix | `MASTERDATA-001` | `img/masterdata-001-general-posting-setup.png` | gesehen | Kapitel 9 |
| Steuer | VAT/Tax Posting Setup | 472 | Liste bearbeiten, Suggest Accounts, Copy | USt-/Tax-Konten und Steuersätze | `MASTERDATA-001` | `img/masterdata-001-vat-posting-setup.png` | gesehen | Kapitel 9/22 |
| Lagerbewertung | Inventory Posting Setup | 5826 | Liste bearbeiten, Suggest Accounts | Bestandskonten je Lagerort/Posting Group | `MASTERDATA-001` | `img/masterdata-001-inventory-posting-setup.png` | gesehen | Kapitel 9/13/23 |

## Nächste Inventarziele

| Reihenfolge | Ziel |
|---:|---|
| 1 | `Dimensions`: `Dimension Values` für `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT`, `LOCATION-GROUP` wirklich klicken und Werte anlegen |
| 2 | `Locations`: `New`, Lagerort `FRA-ZL` anlegen, relevante Lager-/Warehouse-Felder verstehen |
| 3 | `Customers`: `New`, Debitor `D10000` anlegen, Customer Templates prüfen |
| 4 | `Items`: `New`, Artikel `RM-M100` anlegen, Item Templates, Costing, Posting Groups verstehen |
| 5 | `Sales Orders`: `New`, Debitor und Zeile erfassen, Actions `Release`, `Preview Posting`, `Post` verstehen |

## Definition of Done für eine Funktion

Eine Funktion gilt erst als erledigt, wenn:

1. sie in BC sichtbar war
2. ihr UI-Ort dokumentiert ist
3. sie geklickt oder bewusst nicht ausgeführt wurde
4. das Ergebnis geprüft wurde
5. ein Screenshot oder Evidence existiert
6. die fachliche Bedeutung im Buch oder Projekt dokumentiert ist
7. offene Fragen in `playwright/FINDINGS.md` geklärt sind
