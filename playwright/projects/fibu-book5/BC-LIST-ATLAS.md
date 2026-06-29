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
| Companies / Mandanten | 357 | Company / Environment | Vorhandene Companies sehen und sichere Anlageoption fuer `UNIVERSAARL-DE` finden | Name, Display Name, Evaluation Company, ggf. Systemfelder | Neu, Kopieren, Testunternehmen, Menueaktionen | wirksam bei Company-Erstellung; Copy/Testunternehmen nicht Universaarl-Basis | TARGET-001 bis TARGET-004 | `actions-mapped`, `blocked` | TARGET-005 |
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

## Zero-Open-Questions-Regel

Jede nicht verstandene Liste erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Listen, Worksheets und Journals duerfen erst als blockiert gelten, wenn Datenzeile, leere Eingabezeile, Edit-Modus, horizontale Scrollbar, Fokus-/Maximize-Button, versteckte Spalten, FactBox und Command-Bar-Overflow geprueft wurden.

Filter- und Suchbeispiele brauchen genug Zeilen. Eine leere oder einzeilige Universaarl-Liste beweist Navigation, aber keine belastbare Such-, Sortier- oder Filterlogik.
