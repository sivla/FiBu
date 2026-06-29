# Universaarl Data Richness Plan

Aktive Zielwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- Status: `planned`, `needs-universaarl-evidence`
- Shopify / Online Store: `excluded-shopify`

## Ziel

Das Buch braucht realistische Business-Central-Daten, damit Listen, Filter, Suchen, Reports, Posten und Kontrollfragen nicht an leeren Demoansichten erklaert werden. Universaarl-Daten werden deshalb nicht zufaellig erzeugt, sondern aus fachlich sinnvollen Prozessen aufgebaut.

Die Datenbasis soll klein genug fuer ein Schulungsbuch bleiben, aber reich genug sein, um typische Business-Central-Arbeit zu zeigen:

- mehrere Kunden und Lieferanten,
- mehrere Artikelarten,
- offene und gebuchte Belege,
- bezahlte, offene und teilweise ausgeglichene Posten,
- mehrere Monate und Buchungsperioden,
- Dimensionen fuer Auswertungen,
- Korrekturen, Gutschriften und typische Fehlerbilder,
- Ledger Entries, die Filter und Summen sinnvoll machen.

## Grundregeln

1. Keine zufaellige Massendatenanlage.
2. Keine API-Massenbefuellung als Standardweg.
3. Keine CRONUS- oder Legacy-Demodaten als aktive Universaarl-Zielbasis.
4. Daten entstehen zuerst aus nachvollziehbaren UI-Prozessen.
5. Jeder Datensatz braucht einen Buchzweck: Stammdaten, Beleg, Posting, Auswertung, Fehlerdiagnose oder Uebung.
6. Datenvielfalt wird stufenweise aufgebaut, damit Fehler isoliert bleiben.
7. Jeder spaetere deutsche Finalnachweis muss in `playthru` / `UNIVERSAARL-DE` neu entstehen.

## Datenfamilien

| Datenfamilie | Zweck im Buch | Mindestvielfalt | Entsteht durch |
| --- | --- | --- | --- |
| Debitoren | O2C, OP-Liste, Zahlungen, Filter nach Kunde/Status | mindestens 5 Kunden mit unterschiedlichen Zahlungsbedingungen, Regionen oder Dimensionen | Customer Cards, Sales-Prozesse |
| Kreditoren | P2P, offene Posten, Zahlungsvorschlaege, Skonto/Fristen | mindestens 5 Lieferanten mit unterschiedlichen Kontengruppen oder Zahlungsbedingungen | Vendor Cards, Purchase-Prozesse |
| Artikel | Verkauf, Einkauf, Lager, Fertigung, Bewertung | Verkaufsartikel, Einkaufsartikel, Rohmaterial, Dienstleistung/Non-Inventory falls sinnvoll | Item Cards, Item Templates |
| Belege | Listenarbeit, Status, Korrektur, Postenspur | Draft, released/posted, partial, corrected | Sales Orders/Invoices, Purchase Orders/Invoices, Journals |
| Posten | Buchwahrheit, Filter, Reports, Abstimmung | Customer/Vendor/G/L/VAT/Item/Value/Bank/FA Entries | kontrollierte Preview-/Posting-Cases |
| Zeitraeume | Datumssuche, Perioden, Reporting | mehrere Monate, mindestens ein Monatswechsel | Buchungsdaten in Prozesscases |
| Dimensionen | Filter totals by, Reporting, Kosten-/Erloesstruktur | `PRODUCTLINE`, `CHANNEL`, ggf. `COSTCENTER` | Dimension Setup, Default Dimensions, Belegdimensionen |

## Datenreichtum-Stufen

| Stufe | Name | Ziel | Voraussetzung | Status |
| ---: | --- | --- | --- | --- |
| 0 | Company Foundation | `UNIVERSAARL-DE` existiert und Grundsetup ist sichtbar | TARGET-006 und Foundation-Cases | `blocked-by-company-creation` |
| 1 | Stammdatenbasis | Kunden, Lieferanten, Artikel, Dimensionen sind angelegt | Company und Nummernserien | `planned` |
| 2 | Prozessbasis | O2C, P2P, Inventory und Payments erzeugen erste echte Posten | Posting Groups, VAT, Nummernserien | `planned` |
| 3 | Filterbasis | Listen enthalten genug Zeilen fuer Suchen, Sortieren, Filter und gespeicherte Ansichten | mehrere Stammdaten und Belege | `planned` |
| 4 | Reportingbasis | Dimensionen, Perioden und Posten reichen fuer Financial Reports und Analysis Mode | gebuchte Posten mit Dimensionen | `planned` |
| 5 | UAT-/Uebungsbasis | Fehler, Korrekturen, Gutschriften, Ausgleich und Abstimmung sind erklaerbar | mehrere kontrollierte Prozessstrecken | `planned` |

## Mindest-Gates fuer Filter- und Listen-Kapitel

Das Look-and-Feel-/Filterkapitel wird erst als Universaarl-Buchkapitel finalisiert, wenn mindestens diese Signale vorhanden sind:

- eine Kundenliste mit mehreren Universaarl-Kunden,
- eine Kreditorenliste mit mehreren Universaarl-Lieferanten,
- eine Artikelliste mit mehreren Artikeltypen,
- Customer Ledger Entries mit offenen und geschlossenen Posten,
- Vendor Ledger Entries mit mindestens einem offenen und einem bezahlten Posten,
- G/L Entries ueber mehrere Konten und Buchungsdaten,
- Item Ledger Entries und Value Entries fuer mindestens einen Artikelprozess,
- Dimensionen auf mindestens einem gebuchten Prozess,
- mindestens ein Report oder eine Liste, in der `Filter list by` und `Filter totals by` sinnvoll unterscheidbar sind.

## Geplante Universaarl-Datenfaelle

| Case | Zweck | Abhaengigkeit | Status |
| --- | --- | --- | --- |
| `TARGET-DATA-001-UNIVERSAARL-DATA-RICHNESS-PLAN` | Datenstrategie und Mindest-Gates festlegen | keine BC-Ausfuehrung | `planned-doc-ready` |
| `TARGET-DATA-002-DEBITOR-DATASET` | Kundenfamilie fuer O2C, OP und Filter | Company, Number Series, Posting Groups, VAT | `planned` |
| `TARGET-DATA-003-KREDITOR-DATASET` | Lieferantenfamilie fuer P2P und Zahlungen | Company, Number Series, Posting Groups, VAT | `planned` |
| `TARGET-DATA-004-ITEM-DATASET` | Artikelbasis fuer O2C, P2P, Inventory | Inventory Setup, Posting Groups, VAT | `planned` |
| `TARGET-DATA-005-SALES-HISTORY` | gebuchte Verkaufsbelege ueber mehrere Daten | O2C Preview/Post Gate | `planned` |
| `TARGET-DATA-006-PURCHASE-HISTORY` | gebuchte Einkaufsbelege und Kreditorenposten | P2P Preview/Post Gate | `planned` |
| `TARGET-DATA-007-LEDGER-RICHNESS` | Hauptbuch-, Nebenbuch- und Lagerposten fuer Filter | mehrere Postings | `planned` |
| `TARGET-DATA-008-DIMENSION-RICHNESS` | Dimensionen auf Belegen und Posten | Dimension Foundation | `planned` |
| `TARGET-DATA-009-FILTERING-READY-CHECK` | Pruefen, ob Filterkapitel belastbar geschrieben werden kann | Datenstufen 1-4 | `planned` |

## Geplante Look-and-Feel-Faelle

| Case | Zweck | Abhaengigkeit | Status |
| --- | --- | --- | --- |
| `TARGET-LOOKFEEL-001-LIST-SEARCH-SORT-FILTER` | Suche, Sortierung und Listenfilter an echten Daten zeigen | Data Richness Gate | `planned` |
| `TARGET-LOOKFEEL-002-FILTER-PANE-VIEWS` | Filterbereich, Views und gespeicherte Sichten erklaeren | Data Richness Gate | `planned` |
| `TARGET-LOOKFEEL-003-FILTER-TOTALS-BY-DIMENSIONS` | `Filter totals by` und Dimensionsfilter unterscheiden | Dimension Entries | `planned` |
| `TARGET-LOOKFEEL-004-REPORT-REQUEST-PAGE-FILTERS` | Request Pages von Reports erklaeren | Reporting Foundation | `planned` |
| `TARGET-LOOKFEEL-005-LEDGER-ENTRY-FILTERING` | Sachposten/Nebenbuchposten lesen und filtern | Ledger Richness | `planned` |

## Buchwirkung

Das spaetere Kapitel "Business Central bedienen: Oberflaeche, Listen, Filter, Suchen und Arbeiten mit vielen Daten" wird erst aus Universaarl-Daten final geschrieben. Bis dahin bleibt es ein Buchdraft mit Platzhaltern fuer echte Universaarl-Beispiele.

## Rebuild-Hinweis

Alle Filter-, Listen- und Reportingbeispiele muessen in `playthru` / `UNIVERSAARL-DE` neu erzeugt werden. Legacy-Screenshots aus `RM-DEMO` oder CRONUS duerfen nur als historische Lernquelle fuer UI-Risiken dienen.
