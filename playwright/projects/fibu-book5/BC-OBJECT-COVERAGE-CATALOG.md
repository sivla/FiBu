# Business Central Object Coverage Catalog - Universaarl

Aktive Zielwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- Legacy: `MCP_1_20260210`, `RM-DEMO`, Rhein-Main, RM-* und CRONUS nur als historische Laborquelle
- Shopify / Online Store: `excluded-shopify`

Dieser Katalog ergaenzt den Full-Playthrough-Katalog. Er betrachtet Business Central nicht nur als Prozessfolge, sondern als Objektlandschaft: Pages, Karten, Listen, Worksheets, Felder, Actions, Dialoge, Request Pages, Reports, Tabellen, Entries und Setup-Schalter.

## Statuswerte

| Status | Bedeutung |
| --- | --- |
| `planned` | Objekt ist im Buchscope, aber noch nicht in Universaarl belegt. |
| `discovered` | Objekt wurde als relevant identifiziert. |
| `ui-observed` | Objekt wurde in der UI beobachtet. |
| `fields-mapped` | Wichtige Felder wurden erfasst. |
| `actions-mapped` | Wichtige Actions wurden erfasst. |
| `tested-readonly` | Read-only geprueft. |
| `tested-effective-action` | Wirksame Aktion kontrolliert ausgefuehrt. |
| `posted-or-traced` | Buchungs-/Entry-Wirkung wurde getraced. |
| `explained-in-book` | Anfaengerfreundlich im Buch erklaert. |
| `not-applicable` | Fuer Universaarl-Hauptcompany nicht passend. |
| `requires-subcompany-usecase` | Braucht Subcompany/Spezialusecase. |
| `excluded-shopify` | Bewusst ausgeschlossen. |
| `complete` | Vollstaendig erklaert, belegt oder final klassifiziert. |

## Objektmatrix

| Object Type | Object Name | ID | Deutscher UI-Name | English Term | Bereich | Sichtbar in UNIVERSAARL-DE | UI erreichbar | Rolle/App Area | Zweck | Wichtige Felder | Actions/Dialoge | Tabellen-/Entry-Wirkung | Quellenbasis | Evidencebasis | Buchstatus | Teststatus | Offene Fragen / Register | Finaler Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| page/list | Companies | Page 357 | Mandanten | Companies | Company / Environment | Zielcompany noch nicht sichtbar | ja | Admin/Business Manager | Companies im Environment sehen und neue Company starten | Name, Display Name, Evaluation Company | Neu, Kopieren, Testunternehmen; Privacy/Personal-Data-Hinweis | keine Posten; Company-Datensatz nur nach wirksamer Erstellung | Microsoft Learn + Universaarl UI Evidence | TARGET-001 bis TARGET-004 | Buchdraft begonnen | `tested-readonly`, `actions-mapped`, `blocked` | `OQ-0001` | `in-progress` |
| card | Company Information | noch offen | Firmendaten | Company Information | Foundation | nein, Zielcompany fehlt | geplant | Business Manager | Rechtliche und organisatorische Grunddaten der Company pflegen | Name, Address, Country/Region, VAT Registration No. | Edit/Save, ggf. Assisted Setup | Setup-/Stammdatenwirkung, keine Posten | Microsoft Learn + kuenftige Evidence | geplant | geplant | `planned` | nach Company Creation | `planned` |
| setup/list | Assisted Setup | offen | Unterstuetzte Einrichtung | Assisted Setup | Foundation | geplant | geplant | Admin/Business Manager | Setup-Assistenten finden, bewerten und bewusst nutzen/ablehnen | Status, Setupbereich | Start, Finish, Cancel | Setup-Aenderungen je Assistent | Microsoft Learn + Universaarl Evidence | geplant | geplant | `planned` | nach Company Creation | `planned` |
| setup/list | Manual Setup | offen | Manuelle Einrichtung | Manual Setup | Foundation | geplant | geplant | Admin/Business Manager | Setupseiten ohne Assistent finden | Setupbereiche | Open, Edit | Setup-Aenderungen | Microsoft Learn + Universaarl Evidence | geplant | geplant | `planned` | nach Company Creation | `planned` |
| page/list | Chart of Accounts | offen | Kontenplan | Chart of Accounts | Finance | geplant | geplant | Accountant | Sachkonten und Kontenstruktur erklaeren | No., Name, Account Type, Direct Posting, Posting Groups | New, Edit List, Indent | G/L Entries nach Buchungen | Microsoft Learn + Universaarl Evidence | geplant | geplant | `planned` | TARGET-009 | `planned` |
| setup/list | No. Series | offen | Nummernserien | No. Series | Foundation | geplant | geplant | Admin/Accountant | Belegnummern und Nummernlogik erklaeren | Code, Starting No., Ending No., Last No. Used | Lines, Relationships | Dokumentnummern spaeter | Microsoft Learn + Universaarl Evidence | geplant | geplant | `planned` | TARGET-005-NUMBER-SERIES-PREFLIGHT | `planned` |
| setup/matrix | General Posting Setup | offen | Buchungsmatrix | General Posting Setup | Finance | geplant | geplant | Accountant | Kontenfindung zwischen Geschaefts- und Produktgruppen | Sales Account, Purchase Account, COGS, Inventory Adjmt. | New/Edit | G/L Entries, Value Entries | Microsoft Learn + Universaarl Evidence | geplant | geplant | `planned` | TARGET-006 | `planned` |
| setup/list | VAT Posting Setup | offen | MwSt.-Buchungsmatrix | VAT Posting Setup | VAT / USt | geplant | geplant | Accountant | Deutsche USt-Konten und Prozentsaetze steuern | VAT %, Sales VAT Account, Purchase VAT Account | New/Edit | VAT Entries, G/L Entries | Microsoft Learn + amtliche Quellen + Evidence | geplant | geplant | `planned` | TARGET-008 | `planned` |
| page/list | Dimensions | offen | Dimensionen | Dimensions | Reporting | geplant | geplant | Accountant | Auswertung nach Produktlinie/Kanal/Kostenstelle vorbereiten | Code, Name, Value Code, Value Posting | Dimension Values, Default Dimensions | Dimension Set Entries | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-007 | `planned` |
| card/list | Customers | offen | Debitoren | Customers | O2C | geplant | geplant | Sales/Accountant | Kundenstammdaten und Debitorenbuchung | No., Name, Posting Group, VAT Bus. Posting Group | New, Template, Dimensions | Customer Ledger Entries spaeter | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-010 | `planned` |
| card/list | Vendors | offen | Kreditoren | Vendors | P2P | geplant | geplant | Purchase/Accountant | Lieferantenstammdaten und Kreditorenbuchung | No., Name, Posting Group, VAT Bus. Posting Group | New, Template, Dimensions | Vendor Ledger Entries spaeter | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-013 | `planned` |
| card/list | Items | offen | Artikel | Items | Inventory / O2C / P2P | geplant | geplant | Inventory/Sales/Purchase | Verkaufs-, Einkaufs- und Lagerartikel erklaeren | Type, Base Unit, Posting Groups, Costing Method | New, Template, Replenishment | Item Ledger Entries, Value Entries | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-010/TARGET-013 | `planned` |
| card/list | Locations | offen | Lagerorte | Locations | Inventory / Warehouse | geplant | geplant | Inventory | Einfache Lagerorte und Warehouse-Optionen trennen | Code, Require Receive/Shipment, Bin Mandatory | New/Edit | Item/Warehouse Entries je Setup | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-016 | `planned` |
| worksheet | Sales Order | offen | Verkaufsauftrag | Sales Order | O2C | geplant | geplant | Sales | O2C-Belegfluss starten | Sell-to Customer, Item, Quantity, Price, VAT, Dimensions | Release, Preview Posting, Post | Customer, G/L, VAT, Item, Value Entries | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-011/TARGET-012 | `planned` |
| worksheet | Purchase Order | offen | Bestellung | Purchase Order | P2P | geplant | geplant | Purchase | P2P-Belegfluss starten | Buy-from Vendor, Item, Quantity, Direct Unit Cost, Qty. to Receive | Release, Preview Posting, Post Receive/Invoice | Vendor, G/L, VAT, Item, Value Entries | Microsoft Learn + Evidence | Legacy nur Lernmuster | geplant | `planned` | TARGET-014/TARGET-015 | `planned` |
| worksheet | General Journal | offen | Fibu Buch.-Blatt | General Journal | Journals | geplant | geplant | Accountant | Allgemeine Journalbuchungen erklaeren | Account Type, Account No., Amount, Bal. Account, Posting Date | Check, Preview Posting, Post | G/L, Customer, Vendor, Bank Entries je Zeile | Microsoft Learn + Evidence | geplant | geplant | `planned` | Journal-Foundation | `planned` |
| worksheet | Payment Journal | offen | Zahlungsjournal | Payment Journal | Payments | geplant | geplant | Accountant | Zahlung und Ausgleich vorbereiten | Account Type/No., Bal. Account, Amount, Applies-to ID | Apply Entries, Suggest Vendor Payments, Post | Bank, Customer/Vendor, G/L Entries | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-021/TARGET-022 | `planned` |
| worksheet | Item Journal | offen | Artikel Buch.-Blatt | Item Journal | Inventory | geplant | geplant | Inventory | Lagerbewegungen ausserhalb Belegfluss erklaeren | Entry Type, Item No., Location, Quantity, Unit Amount | Post/Preview wenn verfuegbar | Item Ledger Entries, Value Entries, G/L Entries | Microsoft Learn + Evidence | geplant | geplant | `planned` | TARGET-017 | `planned` |
| worksheet | FA G/L Journal | offen | Anlagen Fibu Buch.-Blatt | FA G/L Journal | Fixed Assets | geplant | geplant | Accountant | Anlagenzugang/AfA als Journal erklaeren | FA No., Depreciation Book, FA Posting Type, Amount | Calculate Depreciation, Preview/Post | FA Ledger Entries, G/L Entries | Microsoft Learn + Evidence | Legacy nur Lernmuster | geplant | `planned` | TARGET-018 bis TARGET-020 | `planned` |
| entry/list | G/L Entries | offen | Sachposten | G/L Entries | Finance | geplant | geplant | Accountant | Hauptbuchwirkung aller Buchungen zeigen | Posting Date, Document No., Account No., Amount, Dimensions | Navigate/Find Entries, Dimensions | Hauptbuchposten | Evidence aus Posting-Traces | geplant | geplant | `planned` | nach ersten Postings | `planned` |
| entry/list | VAT Entries | offen | MwSt.-Posten | VAT Entries | VAT / USt | geplant | geplant | Accountant | USt-Wirkung belegen | VAT Bus./Prod. Posting Group, VAT %, Base, Amount | Navigate | VAT Entries | Amtliche Quellen + Evidence | geplant | geplant | `planned` | nach VAT Preview/Posting | `planned` |
| entry/list | Item Ledger Entries | offen | Artikelposten | Item Ledger Entries | Inventory | geplant | geplant | Inventory/Accountant | Mengenfluss zeigen | Entry Type, Quantity, Location, Document No. | Navigate, Value Entries | Artikelposten | Evidence | geplant | geplant | `planned` | Inventory/O2C/P2P | `planned` |
| entry/list | Value Entries | offen | Wertposten | Value Entries | Inventory | geplant | geplant | Inventory/Accountant | Wertfluss zu Artikelposten zeigen | Item Ledger Entry No., Cost Amount, Valued Quantity | Navigate | Wertposten, G/L-Verbindung | Evidence | geplant | geplant | `planned` | Inventory/O2C/P2P | `planned` |
| integration | Shopify Connector | keine | Shopify / Online Store | Shopify / Online Store | Excluded | nein | nein | nicht im Scope | Nicht Teil dieses Buchprojekts | keine | keine | keine | Scope-Entscheidung | keine | ausgeschlossen | `excluded-shopify` | `OQ-0002` | `excluded-shopify` |

## Regel fuer neue Objekte

Wenn ein Case eine neue Page, Liste, Karte, Action, ein Feld, einen Dialog oder eine Entry-Seite beobachtet, muss der passende Atlas oder dieses Catalog-File aktualisiert werden. Unverstandene Punkte erzeugen ein Item in `.agent/state/open_questions_register.json`.
