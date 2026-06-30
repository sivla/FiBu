# Universaarl Usecase Backlog

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Musterfirma: `Universaarl GmbH`

Dieser Backlog sortiert die geplanten Business-Central-Usecases fuer die Universaarl-Welt nach Abhaengigkeit, Buchwert und Evidence-Wert. Er ersetzt keine Business-Central-Evidence. Solange `UNIVERSAARL-DE` nicht sichtbar angelegt ist, bleiben alle wirksamen BC-Aktionen gesperrt.

## Harte Leitplanken

- `playthru` bleibt die aktive Instanz.
- `UNIVERSAARL-DE` ist die geplante Zielcompany, aber noch nicht angelegt.
- RM-DEMO, Rhein-Main und CRONUS bleiben historische Laborquellen, nicht aktive Buchwahrheit.
- Shopify / Online Store bleibt ausgeschlossen.
- Company Creation, Setup, Stammdatenanlage, Preview Posting, Posting und API-Shortcuts starten erst, wenn der aktive Case und die Gates es erlauben.
- Jeder spaetere wirksame Case braucht eine Smart Decision Card, Screenshot-QA und Ergebnis-JSON.

## Kurzfristige PREP-Queue

Diese Schritte duerfen vor SUPER-/Company-Create-Rechten laufen, weil sie keine wirksame BC-Aktion ausfuehren.

| Prioritaet | Case | Status | Zweck | Ergebnis, das der naechste Lauf nutzen soll |
| ---: | --- | --- | --- | --- |
| 1 | `PREP-022-ATLAS-COVERAGE-QUALITY-AUDIT` | `ready-next` | Atlas-Eintraege gegen konkrete Universaarl-Wellen und Usecases pruefen | Nur nutzbare Page-/Action-/Dialog-/Entry-Regeln bleiben aktiv. |
| 2 | `PREP-023-BOOK-CHAPTER-STIMMIGKEIT-AUDIT` | `ready-after-current` | Kapitelreihenfolge und Leserfluss gegen Universaarl-Zielwelt pruefen | Buchkapitel fuehren nicht mehr zur alten RM-Welt zurueck. |
| 3 | `PREP-024-READONLY-PAGE-DISCOVERY-PACK` | `ready-after-current` | Sichere Read-only-Discovery-Packs fuer spaetere Screenshots vorbereiten | Playwright weiss, welche Seiten ohne Datenwirkung geoeffnet werden duerfen. |
| 4 | `PREP-025-NEXT-10-CASES-REPLANNING` | `ready-after-current` | Die naechsten zehn Cases nach Backlog/Atlas/Buchfluss neu pruefen | Queue bleibt Arbeitsplan, kein Dogma. |
| 5 | `PREP-026-MICROSOFT-LEARN-SOURCE-MAPPING` | `ready-after-current` | Quellen zu Company, Setup, Posting, Entries und UAT zuordnen | Buchclaims bekommen Quelle oder Universaarl-Evidence. |

## Erst nach SUPER-/Company-Create-Rechten

| Prioritaet | Case | Wave | Status | Warum genau dieser Schritt |
| ---: | --- | --- | --- | --- |
| 1 | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` | `W0-COMPANY-CONTEXT` | `blocked-until-super-permissions` | Die Company entsteht ueber `Mandanten` -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen`; ohne Rechte darf kein Speicher-/Wizard-Finish-Versuch laufen. |
| 2 | `TARGET-COMPANY-INFO-001` | `W0-COMPANY-CONTEXT` | `planned-after-company` | Nach sichtbarer Company muss die Company Information als Kontext fuer Buch und Screenshots belegt werden. |
| 3 | `TARGET-FOUNDATION-001` | `W1-FINANCE-FOUNDATION` | `planned-after-company` | Erst danach sind Setup-Assistenten, Manual Setup und sichere Vorher/Nachher-Evidence sinnvoll. |
| 4 | `TARGET-NOSERIES-001` | `W1-FINANCE-FOUNDATION` | `planned-after-foundation` | Belegnummern muessen verstanden sein, bevor Kunden-, Einkaufs- oder Lagerbelege entstehen. |
| 5 | `TARGET-POSTINGGROUPS-001` | `W1-FINANCE-FOUNDATION` | `planned-after-foundation` | Kontenfindung ist das Gate vor Preview Posting und Posting. |
| 6 | `TARGET-VAT-001` | `W1-FINANCE-FOUNDATION` | `planned-after-foundation` | Deutsche USt-Claims brauchen Setup, Preview, VAT Entries und Sachposten. |
| 7 | `TARGET-DIMENSIONS-001` | `W1-FINANCE-FOUNDATION` | `planned-after-foundation` | Dimensionen muessen vor Prozessbuchungen stehen, sonst fehlen spaetere Reporting-Beweise. |

## Stammdaten-Welle

Diese Usecases erzeugen spaeter bewusst genug Daten, damit Listen, Filter, Reports und Buchscreenshots nicht leer oder zufaellig wirken.

| Usecase | Package | Status | Benoetigtes Setup | Buchwert | Screenshot-/Atlasbedarf |
| --- | --- | --- | --- | --- | --- |
| `TARGET-DATA-CUSTOMERS-001` | `MD-CUSTOMERS-01` | `planned-after-foundation` | Nummernserie, Debitorenbuchungsgruppe, USt-/Gesch. Buchungsgruppe, Zahlungsbedingungen | Debitorenkarte, O2C-Einstieg, OP-Ausgleich | Customer Card, Customer List, Pflichtfelder, Posting Groups, Dimensions |
| `TARGET-DATA-VENDORS-001` | `MD-VENDORS-01` | `planned-after-foundation` | Kreditorenbuchungsgruppe, USt-/Gesch. Buchungsgruppe, Zahlungsbedingungen | P2P, Zahlungen, Kreditorenposten | Vendor Card, Invoicing/FastTabs, Payment Terms |
| `TARGET-DATA-ITEMS-001` | `MD-ITEMS-01` | `planned-after-foundation` | Artikelbuchungsgruppe, Lagerbuchungsgruppe, USt-/Produktbuchungsgruppe | O2C, P2P, Inventory, Manufacturing | Item Card, Replenishment, Costs & Posting, Item List |
| `TARGET-DATA-LOCATIONS-001` | `MD-LOCATIONS-01` | `planned-after-foundation` | Lagerort, Lagerbuchungssetup | Lager, Wareneingang, Versand, Warehouse-Grenze | Location Card, Inventory Posting Setup |
| `TARGET-DATA-DIMENSIONS-001` | `MD-DIMENSIONS-01` | `planned-after-foundation` | Dimensionen und Default Dimensions | Reporting, Filter, Analyseansichten | Dimensions, Dimension Values, Default Dimensions |
| `TARGET-DATA-BANK-001` | `MD-BANK-01` | `planned-after-foundation` | Bankbuchungsgruppe, Bankkonto | Payments und Bankabstimmung | Bank Account Card, Bank Account Ledger Entries |

## Erste Prozesswelle

| Usecase | Package | Status | Muss vorher stehen | Erfolgsnachweis |
| --- | --- | --- | --- | --- |
| `TARGET-O2C-001` | `PROC-O2C-01` | `planned-after-masterdata` | Customer, Item, VAT, Posting Groups, Number Series, Dimensions | Preview Posting, gebuchter Beleg, Customer/G-L/VAT/Item/Value Entries |
| `TARGET-P2P-001` | `PROC-P2P-01` | `planned-after-masterdata` | Vendor, Item, Location, VAT, Posting Groups, Number Series, Dimensions | Preview Posting, Wareneingang/Rechnung oder klar getrennte Teilstrecke, Vendor/G-L/VAT/Item/Value Entries |
| `TARGET-INVENTORY-001` | `PROC-INVENTORY-01` | `planned-after-masterdata` | Item, Location, Inventory Posting Setup | Item Journal oder kontrollierter Bestandspfad, Item/Value/G-L Entries |
| `TARGET-PAYMENT-001` | `PROC-PAYMENT-01` | `planned-after-first-postings` | Offene Debitoren-/Kreditorenposten, Bankkonto | Apply Entries, Payment Posting, Detailed Ledger Entries, Bank/G-L Entries |

## Erweiterungswelle

| Usecase | Status | Warum nicht frueher |
| --- | --- | --- |
| `TARGET-REPORTING-001` | `planned-after-first-postings` | Reports brauchen echte Posten, Dimensionen und mehrere Buchungsdaten. |
| `TARGET-CORRECTION-001` | `planned-after-first-postings` | Korrekturen und Gutschriften brauchen absichtlich erzeugte Fehler-/Ruecknahmefaelle. |
| `TARGET-FA-001` | `planned-after-foundation-and-masterdata` | Anlagen brauchen eigene Buchungsgruppen, AfA-Buch und saubere Zugang/AfA-Trace. |
| `TARGET-WAREHOUSE-001` | `planned-after-inventory-foundation` | Warehouse wird erst sinnvoll, wenn einfache Lagerlogik verstanden ist. |
| `TARGET-MANUFACTURING-001` | `planned-after-item-and-inventory-foundation` | Fertigung braucht Artikel, Komponenten, Kosten-/Wertfluss und Lagerbasis. |
| `TARGET-SERVICE-001` | `planned-after-sales-and-items` | Service braucht Kunden, Artikel/Serviceartikel und Vertrags-/Auftragskontext. |
| `TARGET-PROJECTS-001` | `planned-after-sales-purchase-foundation` | Projekte brauchen Kosten-/Erloslogik, Ressourcen/Artikel und Buchungsspuren. |
| `TARGET-SECURITY-001` | `planned-after-core-flow` | Rollen und Rechte sollen an echten Universaarl-Prozessen erklaert werden. |
| `TARGET-CHANGELOG-001` | `planned-after-core-flow` | Change Log wird nuetzlich, wenn echte Stammdaten- und Setupaenderungen existieren. |
| `TARGET-JOBQUEUE-001` | `planned-after-core-flow` | Hintergrundlaeufe brauchen konkrete Prozessbeispiele. |
| `TARGET-CUTOVER-001` | `planned-after-foundation` | Migration/Opening Balances ist ein eigenes Kapitel und darf nicht mit Demodaten vermischt werden. |

## Nicht ausfuehren

| Bereich | Status | Grund |
| --- | --- | --- |
| Shopify / Online Store | `excluded-shopify` | Aus Projektumfang gestrichen. |
| RM-DEMO Rebuild als aktive Zielwelt | `legacy-only` | RM-DEMO ist historische Laborquelle, nicht Universaarl-Finalwelt. |
| CRONUS-Kopie als Universaarl-Zielbasis | `do-not-use-as-final-basis` | Demodaten nehmen fachliche Entscheidungen vorweg und verwischen den Buchaufbau. |

## Naechster sinnvoller Lauf

`PREP-022-ATLAS-COVERAGE-QUALITY-AUDIT`

Der naechste Lauf soll die Atlas-Dateien gegen diesen Backlog pruefen. Atlas-Eintraege sollen nur aktiv bleiben, wenn sie einen konkreten Universaarl-Usecase, ein UI-Muster, ein Feld-/Action-Risiko oder eine spaetere Screenshot-/Evidence-Frage klaeren.
