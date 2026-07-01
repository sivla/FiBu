# Business Central List Atlas - Universaarl

Aktive Zielwelt: `playthru` / `UNIVERSAARL-DE` / `Universaarl GmbH`.

Der List Atlas beschreibt Business-Central-Listen, die fuer Klickpfade, Suche, Filter, Spalten, Actions und Bucherklaerung relevant sind. Eine Liste ist erst ausreichend verstanden, wenn Zweck, zentrale Spalten, sichere und riskante Actions, Filterlogik, moegliche Dialoge und die Wirkung auf Daten oder Posten erklaert sind.

## Statuswerte

- `planned`
- `ui-observed`
- `columns-mapped`
- `actions-mapped`
- `tested-readonly`
- `tested-effective-action`
- `explained-in-book`
- `blocked`
- `excluded-shopify`
- `complete`

## Listen

| Liste | Page ID | Bereich | Zweck | Zentrale Spalten | Wichtige Actions | Risiko | Evidence | Status | Naechster Case |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Companies / Mandanten | 357 | Company / Environment | Vorhandene Companies sehen und sichere Anlageoption fuer `UNIVERSAARL-DE` finden | Name, Display Name, Evaluation Company, ggf. Systemfelder | Neu, Pfeil neben Neu, Neues Unternehmen erstellen, Kopieren, Testunternehmen, Menueaktionen | wirksam bei Company-Erstellung; Copy/Testunternehmen nicht Universaarl-Basis; neue Zeile ist kein Speicherbeweis | TARGET-001 bis TARGET-009, PREP-003, PREP-031 | `actions-mapped`, `screenshot-qa-mapped`, `tested-readonly`, `blocked-permission` | PREP-032 Buchtext, TARGET-009 nach Rechten |
| Chart of Accounts / Kontenplan | offen | Finance | Sachkonten und Kontenstruktur erklaeren | No., Name, Account Type, Direct Posting | New, Edit List, Indent | Setup-/Stammdatenwirkung | geplant | `planned` | TARGET-009 |
| Customers / Debitoren | offen | O2C | Kundenliste und Kundenvorlagen erklaeren | No., Name, Posting Group, Balance | New, Edit, Dimensions | Stammdatenwirkung | geplant | `planned` | TARGET-010 |
| Vendors / Kreditoren | offen | P2P | Lieferantenliste und Kreditorenbuchung vorbereiten | No., Name, Posting Group, Balance | New, Edit, Dimensions | Stammdatenwirkung | geplant | `planned` | TARGET-013 |
| Items / Artikel | offen | Inventory/O2C/P2P | Artikelstamm und Lager-/Buchungsgruppen sichtbar machen | No., Description, Type, Inventory, Posting Groups | New, Edit, Replenishment | Stammdaten- und spaetere Buchungswirkung | geplant | `planned` | TARGET-010/TARGET-013 |
| Locations / Lagerorte | offen | Inventory/Warehouse | Lagerorte und Warehouse-Schalter unterscheiden | Code, Name, Require Receive/Shipment, Bin Mandatory | New, Edit | Setup-/Prozesswirkung | geplant | `planned` | TARGET-016 |
| G/L Entries / Sachposten | offen | Finance | Hauptbuchwirkung nach Buchungen nachvollziehen | Posting Date, Document No., Account No., Amount, Dimensions | Navigate, Dimensions | read-only fuer Nachweis | geplant | `planned` | nach erstem Universaarl Posting |
| Item Ledger Entries / Artikelposten | offen | Inventory | Mengenfluss nach Artikelbewegungen zeigen | Entry Type, Item No., Quantity, Location | Navigate, Value Entries | read-only fuer Nachweis | geplant | `planned` | TARGET-017 |
| Value Entries / Wertposten | offen | Inventory/Finance | Wertfluss zu Artikelbewegungen zeigen | Item Ledger Entry No., Cost Amount, Valued Quantity | Navigate | read-only fuer Nachweis | geplant | `planned` | TARGET-017 |
| VAT Entries / MwSt.-Posten | offen | VAT/USt | USt-Wirkung belegen | VAT Groups, Base, Amount, VAT % | Navigate | read-only fuer Nachweis | geplant | `planned` | TARGET-008 nach Posting |
| Customer Ledger Entries / Debitorenposten | offen | Look and Feel/O2C | Offene und geschlossene Posten filtern | Customer No., Posting Date, Document No., Open, Amount, Remaining Amount, Dimension fields | Filter list by, Filter pane, Navigate/Find Entries | read-only fuer Nachweis; keine Anwendung/Ausgleich ohne Gate | geplant | `planned`, `needs-data-richness` | TARGET-LOOKFEEL-005 |
| Vendor Ledger Entries / Kreditorenposten | offen | Look and Feel/P2P | Einkaufs- und Zahlungsposten filtern | Vendor No., Posting Date, Document No., Open, Amount, Remaining Amount | Filter list by, Filter pane, Navigate/Find Entries | read-only fuer Nachweis; Apply/Post default-locked | geplant | `planned`, `needs-data-richness` | TARGET-LOOKFEEL-005 |
| G/L Entries / Sachposten mit Dimensionen | offen | Look and Feel/Reporting | Hauptbuchfilter nach Datum, Konto, Beleg und Dimension | Posting Date, Document No., G/L Account No., Amount, Dimension fields | Filter list by, Filter totals by, Analyze | read-only fuer Nachweis; keine Korrektur aus Listen | geplant | `planned`, `needs-ledger-richness` | TARGET-LOOKFEEL-003/TARGET-LOOKFEEL-005 |
| Report Request Page Filter | offen | Reporting | Reportfilter vor Ausfuehrung erklaeren | Date Filter, Account/Customer/Vendor/Item filters, Dimension filters, Options | Preview/Run/OK nur nach Gate; Filter setzen read-only bis Ausfuehrung | Reportausfuehrung kann Daten nur anzeigen, aber einzelne Reports muessen klassifiziert werden | geplant | `planned`, `needs-reporting-foundation` | TARGET-LOOKFEEL-004 |
| Analysis Mode / Analysemodus | offen | Reporting/Listen | Daten gruppieren, filtern und summieren, ohne zu buchen | columns depend on source list | Analyze, group, filter, pivot/summarize | read-only; keine Buchung | geplant | `planned`, `needs-data-richness` | TARGET-LOOKFEEL-001 |
| Shopify / Online Store Listen | keine | excluded | Nicht Teil des Buchprojekts | keine | keine | ausgeschlossen | Scope-Entscheidung | `excluded-shopify` | keiner |

## PREP-024 Read-only Listenpaket

| Discovery-ID | Liste | Prioritaet | Read-only-Aufgabe | Ergebnisstatus |
| --- | --- | ---: | --- | --- |
| `RO-W0-COMPANIES-357` | Companies / Mandanten | 1 | Spalten, `UNIVERSAARL-DE`-Sichtbarkeit, Split-Button-/Dropdown-Kontext, riskante Actions erfassen | `observed-readonly-prep-031` |
| `RO-W1-ASSISTED-SETUP` | Assisted Setup / Unterstuetztes Setup | 2 | Assistenten, Status und gefaehrliche Start-/Finish-Punkte sichtbar machen | `ready-for-readonly-playwright` |
| `RO-W1-NO-SERIES` | No. Series / Nummernserien | 3 | Nummernserien als Listen-/Zeilenkonzept vorbereiten | `requires-universaarl-company` |
| `RO-W1-POSTING-GROUPS` | Posting Groups / Posting Setup | 4 | Buchungsgruppen- und Matrixlisten fuer Kontenfindung vorbereiten | `columns-mapped`; `INLAND` und `WAREN` sind nach Reopen sichtbar, Page 314 zeigt die Zielspalten fuer `4400` und `5400`; naechster Schritt ist TARGET-032D als kontrollierter Schreib-Gate |
| `RO-W1-VAT-SETUP` | VAT Posting Setup | 5 | VAT-Buchungsmatrixfelder fuer spaetere USt-Kette vorbereiten | `requires-universaarl-company` |
| `RO-W1-DIMENSIONS` | Dimensions / Dimension Values | 6 | Dimensionen, Dimensionswerte und spaetere Default-Dimension-Kontexte vorbereiten | `requires-universaarl-company` |

## Zero-Open-Questions-Regel

Jede nicht verstandene Liste erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Listen, Worksheets und Journals duerfen erst als blockiert gelten, wenn Datenzeile, leere Eingabezeile, Edit-Modus, horizontale Scrollbar, Fokus-/Maximize-Button, versteckte Spalten, FactBox und Command-Bar-Overflow geprueft wurden.

Filter- und Suchbeispiele brauchen genug Zeilen. Eine leere oder einzeilige Universaarl-Liste beweist Navigation, aber keine belastbare Such-, Sortier- oder Filterlogik.

PREP-003 ergaenzt: Eine sichtbare Eingabezeile oder ein ListPart mit `Neu - <Liste>` beweist nur den Eingabekontext. Ein Datensatz ist erst belegt, wenn er nach dem Speichern/Zurueckkehren als normale Zeile sichtbar ist und der Folgekontext dazu passt.
