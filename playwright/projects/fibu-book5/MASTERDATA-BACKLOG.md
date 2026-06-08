# Stammdaten- und Setup-Backlog fuer FiBu Buch 5

Stand: 08.06.2026

Dieser Backlog uebersetzt die Buchanforderungen aus den Kapiteln 3, 6 bis 18 und 19 bis 25 in eine kontrollierte Testdaten- und Setup-Roadmap fuer `RM-DEMO`. Er ist kein produktiver Stammdatenkatalog. Er steuert, welche Daten im CRONUS-USA-Labor praktisch aufgebaut, welche nur als Buchziel beschrieben und welche erst in einem deutschen Zielmandanten final nachgewiesen werden.

## Leitplanken

`RM-DEMO` bleibt der aktuelle Lern- und Labor-Mandant in Sandbox `MCP_1_20260210`. Der Mandant ist CRONUS-USA-basiert und eignet sich fuer Bedienpfade, Playwright-Robustheit, Stammdatenanlage, Screenshots, Posting-Preview, Postenspur und Lernfaelle.

Die Ziel-Companies `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED` und `RM-AT` bleiben ein spaeterer Mehr-Company-/Intercompany-Block. Sie werden nicht als naechste Sofortmassnahme angelegt.

Deutsche `19 %` USt, deutscher Kontenplan, deutsche Steuerreports und finale deutsche Buchscreenshots werden in `RM-DEMO` nicht als erledigt markiert, solange sie nicht in einer passenden deutschen Umgebung oder durch ein explizit freigegebenes deutsches VAT-Setup nachgewiesen sind.

## Status- und Prioritaetslogik

| Status | Bedeutung |
|---|---|
| `done-labor` | In `RM-DEMO` praktisch nachgewiesen und mit Evidence/Screenshot belegt. |
| `partial` | Einstieg oder Teilwirkung ist belegt, aber ein fachlicher Nachweis fehlt. |
| `planned-only` | Im Buch/Testdatenkatalog beschrieben, aber noch nicht praktisch aufgebaut. |
| `missing-setup` | Benoetigte Einrichtung fehlt oder ist nur als Laborabweichung bekannt. |
| `missing-evidence` | Objekt/Setup existiert moeglicherweise, aber es gibt keinen belastbaren Nachweis. |
| `later-multicompany` | Erst im spaeteren Mehr-Company-/Intercompany-Block sinnvoll. |
| `not-now` | Bewusst zurueckgestellt, damit der aktuelle Lernlauf stabil bleibt. |

| Prioritaet | Bedeutung |
|---|---|
| `P0` | Blockiert O2C/P2P-Grundprozesse oder falsche Buchungen. |
| `P1` | Benoetigt fuer Inventory/Warehouse. |
| `P2` | Benoetigt fuer Manufacturing, Service oder Projects. |
| `P3` | Benoetigt fuer Multi-Company/Intercompany/Ausland. |
| `P4` | Reporting, Power BI, Evidence Packs und Finish. |

## Backlog-Matrix

| Objekt | Buchkapitel | Sollwert | aktueller Stand | Testdaten vorhanden | Evidence vorhanden | Status | Prioritaet | naechster Schritt |
|---|---|---|---|---|---|---|---|---|
| Trainingscompany | 6, 8 | `RM-DEMO` als konsolidierte Spielwiese | existiert aus CRONUS USA | ja, `foundation/rm-demo-company.json` | ja, Foundation | `done-labor` | P0 | In deutscher Umgebung neu belegen, aber jetzt nicht neu anlegen. |
| Ziel-Companies | 3, 6, 18 | `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED`, `RM-AT` | nur Buchziel | ja, `masterdata/companies.json` | nein | `later-multicompany` | P3 | Erst nach RM-DEMO-Lernlauf als eigener Block. |
| Dimensionen | 7, 10, 25 | `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT`, `LOCATION-GROUP`, spaeter `COMPANY-GROUP`/`PROJECT` | `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` fehlt im Labor und wurde nicht per API angelegt | ja, `masterdata/dimensions.json` | ja, `masterdata-002/003/007`, `masterdata-dimensions`, O2C | `partial` | P0 | Fehlende Erweiterungsdimension/-werte gezielt per UI-Setup-Lauf planen; Reportingwirkung pruefen. |
| Dimensionswerte Kern | 7, 10, 11 | `MACHINE`, `B2B`, `SALES`, `DIRECTED` | in `RM-DEMO` nachgewiesen | ja | ja | `done-labor` | P0 | Keine Sofortaktion. |
| Dimensionswerte Erweiterung P1 | 7, 10, 12-13 | `PURCH`, `WHSE`, `SPARE`, `SIMPLE` | per UI-Lauf angelegt und nach Neuoeffnen geprueft | ja | ja, `masterdata-010` | `done-labor` | P1 | Fuer P2P/Inventory nutzbar; Default Dimensions an neuen Stammdaten spaeter separat setzen. |
| Dimensionswerte Erweiterung spaeter | 7, 10, 14-18 | `SERV`, `FIN`, `ADMIN`, `SERVICE`, `PROJECT`, `RENTAL`, `SHOP`, `IC`, `VAN`, `DROP` | weiterhin geplant; nicht blind angelegt | ja | teilweise als Delta, `masterdata-dimensions` | `planned-only` | P2-P3 | Erst pro Service/Project/Shop/IC-Prozessbedarf anlegen und fotografieren. |
| Standarddimension Debitor | 10, 11, 19 | `D10000 -> CHANNEL=B2B` | gesetzt und UI/API-geprueft | ja | ja, `masterdata-007`, O2C | `done-labor` | P0 | Fuer weitere Debitoren separat planen. |
| Standarddimension Artikel | 10, 11, 13, 25 | `RM-M100 -> PRODUCTLINE=MACHINE` | gesetzt; in Verkaufszeile und Artikelposten nachgewiesen | ja | ja, `masterdata-007`, O2C `050/089` | `done-labor` | P0 | Sachposten/Financial-Reports-Wirkung read-only pruefen. |
| Debitor O2C | 7, 11, 19, 22 | `D10000 Mueller Maschinenbau GmbH`, EUR, Inland-B2B | existiert; EUR passt; Tax bleibt CRONUS-USA-Labor | ja, `customers.json`, `sales/uat-o2c-001.json` | ja, `masterdata-005`, O2C | `partial` | P0 | Deutsche VAT-Business-Logik nicht als erledigt markieren. |
| Weitere Debitoren | 7, 17, 18, 22 | `D11000`, `D20000`, `D30000`, `D90000` | nur Buch-/Testdatenmodell | ja | nein | `planned-only` | P3 | Erst fuer Shop, EU, Export oder IC als eigener Block. |
| Kreditor P2P | 7, 12, 19, 20 | `K10000 Stahlwerk Ruhr GmbH` | existiert in `RM-DEMO`; Vendor Template angewendet; Laborbuchung `Receive and Invoice` erzeugt Einkaufsrechnung `108219`; Entwurf/Rechnung laufen mit `USD` als CRONUS-Laborgrenze | ja, `vendors.json`, `purchase/uat-p2p-001.json`, `process-cases.json` | ja, `p2p-001` | `partial` | P0 | Nicht erneut buchen; Payment/OP-Ausgleich oder DE-VAT-Fit spaeter pruefen. |
| Weitere Kreditoren | 7, 12, 17, 18 | `K11000`, `K20000`, `K30000`, `K40000` | geplant | ja | nein | `planned-only` | P2-P3 | Nur pro Prozessbedarf anlegen. |
| Artikel O2C | 7, 11, 13, 23 | `RM-M100`, Preis `68.000`, Kosten `42.000`, `PCS`, `RETAIL`, `RESALE`, `FURNITURE` | existiert und gebucht im Labor | ja, `items.json`, `sales/uat-o2c-001.json` | ja, `masterdata-005/006`, O2C | `done-labor` | P0 | Deutscher Product/VAT/Inventory-Fit bleibt Finalthema. |
| Ersatzteilartikel | 7, 13, 15, 17 | `SP-PUMP-01`, `SP-SENSOR-02`, `KIT-MAINT` | nur geplant | ja | nein | `planned-only` | P1-P2 | Erst fuer Ersatzteilverkauf, Service oder Shop aufbauen. |
| Rohmaterial | 7, 12, 14, 23 | `RAW-STEEL`, `COMP-CTRL` | `RAW-STEEL` existiert mit Kosten `2.500`, `PCS`, CRONUS-Technikfit `RETAIL`/`RESALE`/`FURNITURE`; P2P-Wertposten und Artikelposten `793` sind belegt; `COMP-CTRL` bleibt geplant | ja | ja, `p2p-001` | `partial` | P1-P2 | Inventory/Lagerbewertung fuer `RAW-STEEL` read-only pruefen; Manufacturing-Erweiterung separat. |
| Ressourcen | 7, 15, 16 | `RES-TECH` | nur geplant | ja, `resources-assets-projects.json` | nein | `planned-only` | P2 | Erst fuer Service/Project-Block. |
| Anlage | 7, 21 | `FA-CNC-01` | nur geplant | ja | nein | `planned-only` | P2 | Vor Anlagenprozess Nummernserie, FA Posting Group und AfA-Buch pruefen. |
| Projekt | 7, 16 | `PROJ-5001` | nur geplant | ja | nein | `planned-only` | P2 | Erst nach Ressourcen/Kunde/Projektsetup. |
| Bankkonto | 20 | `BANK-RM-01` | nur geplant | ja | nein | `planned-only` | P4 | Nach offener Rechnung und Payment-Readiness. |
| Lagerort O2C | 7, 13 | `FRA-ZL` als erster Lagerort | existiert als einfacher Lagerort | ja, `locations.json` | ja, `masterdata-004`, O2C | `done-labor` | P0 | Warehouse-Funktionen noch nicht aktivieren. |
| Weitere Lagerorte | 7, 13, 15, 16 | `MZ-EINFACH`, `VAN-SERV`, `PROJ-LAG` | geplant | ja | nein | `planned-only` | P1-P2 | Bei Inventory/Service/Project gezielt anlegen. |
| Lagerplaetze/Bins | 13 | Bins fuer gesteuertes Warehouse | nicht aufgebaut | nein | nein | `planned-only` | P1 | Erst nach einfachem P2P/Inventory-Fit. |
| Customer Posting Setup | 9, 11, 19 | Forderungskonto fuer `D10000` | CRONUS-Laborfit funktioniert | teilweise | ja indirekt ueber O2C-Posten | `partial` | P0 | Deutsches Forderungskonto spaeter final pruefen. |
| Vendor Posting Setup | 9, 12, 19 | Verbindlichkeitskonto fuer `K10000` | Vendor Template schliesst den Entwurfsblocker; P2P-Sachposten zeigen im Labor `22100 Accounts Payable, Domestic` | nein | ja indirekt, `p2p-001` | `partial` | P0 | Deutsches Verbindlichkeitskonto spaeter final pruefen; im Labor nicht erneut buchen. |
| General Posting Setup | 9, 11, 12 | Erlos, Aufwand, Wareneinsatz nach Business/Product Groups | O2C laeuft im CRONUS-Fit; deutsche Gruppen offen | teilweise | ja fuer O2C-Labor | `partial` | P0 | Fuer P2P und DE-Finalfit separate Matrix pruefen. |
| VAT/Tax Posting Setup | 9, 11, 12, 22 | deutsche `19 %` USt/Vorsteuer | CRONUS-USA Sales Tax, `0 %` im O2C-Labor | nein fuer DE-Final | ja als Delta | `missing-setup` | P0 | DE-VAT-Readiness separat planen, nicht in US-Sales-Tax erzwingen. |
| Inventory Posting Setup | 9, 11, 13, 23 | Bestandskonto je Lagerort/Inventory Group | `FRA-ZL` + `RESALE -> 14140` gesetzt | teilweise | ja, `masterdata-008/009` | `done-labor` | P0 | Nur CRONUS-Laborfit; kein deutscher Kontenplan-Endstand. |
| Nummernserien | 8, 11, 12, 21 | Sales, Purchase, FA, Project | O2C nutzt BC/API-Nummern; weitere Serien offen | nein | ja indirekt O2C | `partial` | P0-P2 | Vor P2P/FA/Project jeweils pruefen. |
| Zahlungsbedingungen | 7, 11, 12, 19 | `14 Tage 2 %, 30 Tage netto`, `30 Tage netto`, Vorkasse | Buchmodell; O2C nicht vollstaendig als Zahlungsbedingung belegt | ja bei Kunden | nein/teilweise | `missing-evidence` | P0 | Debitor/Kreditor-Karten gezielt pruefen, bevor OP-Ausgleich startet. |
| Waehrungen | 8, 11, 18, 20 | EUR als O2C-Waehrung, spaeter Ausland | `EUR` bei `D10000` und O2C belegt | ja O2C | ja | `done-labor` | P0 | Auslandskurse spaeter. |
| Journale | 19, 20, 21, 24 | Zahlungs-, Fibu-, Anlagen- und Abschlussjournale | nicht gestartet | nein | nein | `planned-only` | P4 | Erst nach Prozessbelegen und Readiness. |
| Workflows/Freigaben | 12, 20, 27, 29 | Einkauf, Zahlungen, AP-Automation, Genehmiger | Buchmodell, nicht Labor | nein | nein | `not-now` | P4 | Nach Standardprozessen, nicht vor P2P-Basis. |
| O2C Evidence Pack | 11, 19, 23, 25 | Auftrag, Preview, gebuchte Rechnung, Posten, Dimension, Reporting | Labor weit belegt; Reporting/DE-USt offen | ja | ja | `partial` | P0/P4 | Keine zweite Buchung; Reporting/G/L-Dimension read-only nachziehen. |
| P2P Evidence Pack | 12, 19, 22 | Bestellung, Wareneingang, Eingangsrechnung, Kreditorenposten, Sachposten, Vorsteuer | Laborprozess gebucht: Bestellung `106049`, gebuchte Einkaufsrechnung `108219`, Kreditorenposten, Sachposten, Wertposten und Artikelposten; Vorsteuer bleibt `0 %` | ja als Prozessfall | ja, `p2p-001` | `partial` | P0 | Keine zweite Buchung; Zahlung/OP-Ausgleich oder DE-VAT-Fit spaeter. |
| Inventory/Warehouse Evidence Pack | 13, 23 | Artikelposten, Wertposten, Lagerbewertung, Bins/Picks | `INVENTORY-001` belegt O2C `RM-M100` und P2P `RAW-STEEL` read-only ueber Item Ledger Entries `792`/`793`, Value Entries, G/L Entries, Artikelkarten und Location `FRA-ZL`; `INVENTORY-002` belegt `Inventory Valuation` mit `As Of Date = 08.06.2026`, `No. = RM-M100|RAW-STEEL`, `Location Filter = FRA-ZL`, Berichtswerten `25.000,00`, `-42.000,00` und `Total Inventory Value = -17.000,00`; `INVENTORY-003` erklaert den negativen `RM-M100`-Wert als Abgang ohne belegten positiven Zugang im aktuellen Filterkontext; Warehouse offen | teilweise | ja, `inventory-001`, `inventory-002`, `inventory-003`, O2C, P2P | `partial` | P1 | Zielbestandsplan fuer `RM-M100` vor finalen Buchbildern formulieren; danach Warehouse getrennt. |
| Manufacturing/Assembly Evidence Pack | 14 | BOM/Routing/Production Order, Verbrauch, Output | nicht gestartet | teilweise | nein | `planned-only` | P2 | Nach P2P/Inventory. |
| Service Evidence Pack | 15 | Serviceartikel, Serviceauftrag, Ressource, Ersatzteilverbrauch | nicht gestartet | teilweise | nein | `planned-only` | P2 | Nach Ersatzteil-/Ressourcenfit. |
| Project Evidence Pack | 16 | Projekt, Aufgaben, Ressource, Material, Faktura, WIP | nicht gestartet | teilweise | nein | `planned-only` | P2 | Nach Ressourcen/Projektsetup. |
| Reporting/Financial Reports | 10, 25 | GuV/Revenue nach `PRODUCTLINE=MACHINE`, `CHANNEL=B2B` | Financial Reports ist read-only erreichbar; `Dimension Perspective` und `Column Definition` sichtbar; `PRODUCTLINE`/`CHANNEL` nicht als sichtbarer Filter/Summenbeweis nachgewiesen | nein | ja, `reporting-001`, `reporting-002` | `partial` | P4 | `Dimension Perspective`, `Dimensions - Detail` oder Analysis Views gezielt fuer `PRODUCTLINE`/`CHANNEL` pruefen. |

## Abhaengigkeiten

1. Company und Umgebung muessen stabil sein, bevor Stammdaten erzeugt werden.
2. Dimensionen und Dimensionswerte muessen vor Standarddimensionen und Belegen existieren.
3. Debitor, Artikel, Lagerort, Waehrung und Posting Groups muessen vor O2C-Preview passen.
4. Kreditor, Einkaufsartikel/Rohmaterial, Vendor Posting Group, General Posting Setup und Tax/VAT-Grenze muessen vor P2P passen.
5. Inventory Posting Setup muss vor jeder Artikelbewegung passen, sonst bricht Preview/Buchung fachlich korrekt ab.
6. Reporting kann erst sinnvoll beweisen, wenn gebuchte, dimensionierte Posten existieren.
7. Warehouse, Manufacturing, Service und Projects duerfen erst starten, wenn einfache Stammdaten- und Posting-Fits verstanden sind.

## Empfohlene Build-Reihenfolge

1. Aktuellen O2C-Laborbeleg nicht erneut buchen; `REPORTING-002` ist erledigt als Sichtbarkeitsbefund. Naechster Reporting-Schritt ist `Dimension Perspective`, `Dimensions - Detail` oder Analysis Views read-only.
2. P2P-Laborbuchung ist erledigt: `106049` -> `108219`. Nicht erneut buchen; naechster P2P-naher Schritt ist Zahlung/OP-Ausgleich oder Inventory/Lagerbewertung.
3. Deutsche VAT-/EUR-/Kontenplan-Endstaende bleiben getrennte Finalaufgaben.
4. Inventory einfach vertiefen: `INVENTORY-002` ist als read-only Zahlenbericht erledigt und `INVENTORY-003` erklaert den negativen `RM-M100`-Wert; naechster Schritt ist der Zielbestandsplan fuer finale Buchbilder.
5. Warehouse separat: `FRA-ZL` als gesteuertes Lager mit Bins, Receipts, Put-aways, Picks erst nach dem einfachen Inventory-Trace.
6. Danach Manufacturing/Assembly, Service, Projects.
7. Erst danach Multi-Company/Intercompany und Ausland.
8. Reporting/Power BI laeuft begleitend, aber nur mit echten Posten und klarer Labor-/Final-Trennung.

## Offene Fragen

| Frage | Warum wichtig | Status |
|---|---|---|
| Welcher deutsche Kontenplan gilt spaeter fuer Maschinen, Bestand, Wareneinsatz, Forderungen und Verbindlichkeiten? | `14140` ist nur CRONUS-Laborfit. | offen fuer DE-Final |
| Wird die deutsche 19-%-USt in neuer deutscher Umgebung oder in `RM-DEMO` mit explizitem VAT-Setup belegt? | CRONUS-USA Sales Tax darf nicht umgedeutet werden. | offen |
| Welche Dimensionen werden globale/Shortcut-Dimensionen? | Entscheidend fuer sichtbare Spalten, Filter und Financial Reports. | offen |
| Welche P2P-Buchung wird zuerst erlaubt: nur Preview oder kontrollierte Laborbuchung? | Verhindert falsche Kreditoren-/Vorsteuerbuchungen. | beantwortet fuer Labor: genau eine Buchung `106049` -> `108219`; weitere Buchungen gesperrt |
| Welche Reporting-Auswertung ist der erste Buchnachweis: `Income Statement`, `Revenue`, Analysis View oder G/L Entries Filter? | Bestimmt Screenshots und Anfaengererklaerung. | offen |
| Welche Lagerbewertung soll der erste Buchnachweis sein: `Inventory Valuation` mit Datum/Artikel/Lagerort oder zuerst Wertposten/Sachposten-Abgleich? | Bestimmt Kapitel 13/23-Screenshots und ob Zahlenwirkung behauptet werden darf. | beantwortet fuer Labor: `INVENTORY-002` nutzt `Inventory Valuation` mit Stichtag, Artikel- und Lagerortfilter; `INVENTORY-003` erklaert den negativen `RM-M100`-Wert; finaler Zielbestand offen |

## Nicht jetzt

- Keine neue Company anlegen.
- Keine zweite O2C-Buchung.
- Keine deutsche `19 %` USt aus CRONUS-USA-Sales-Tax ableiten.
- Keine beliebigen Konten fuer deutsche Zielaussagen setzen.
- Keine Warehouse-, Manufacturing-, Service- oder Project-Prozesse starten, bevor die Basisdaten dafuer gezielt vorbereitet sind.
- Keine Power-BI-/Integrationsthemen starten, bevor BC-Reporting und Sachpostenfilter belegt sind.

## Naechster konkreter Prompt

```text
Arbeite auf Branch codex/playwright-bc-screenshot-foundation.
Lies CURRENT-STATE.md, LAB-FIT-STATUS.md, BOOK-CLICK-GUIDE-COVERAGE.md und evidence/inventory-002/INVENTORY-VALUATION.md.
Fuehre genau einen Planungs-/Readiness-Schritt aus: Formuliere den Zielbestandsplan fuer finale `RM-M100`-Buchbilder. Entscheide evidence-basiert, ob Anfangsbestand, Einkauf, Montage oder Fertigung der naechste saubere positive Zugang sein soll. Keine neue O2C-/P2P-Buchung, keine Warehouse-Aktivierung.
```
