# Current State fuer FiBu Buch 5

Stand: 08.06.2026

Diese Datei ist die erste Orientierung fuer neue Codex-Agents. Sie fasst zusammen, wo das Projekt steht, was entschieden ist, was nicht erneut diskutiert werden muss und was als naechster sinnvoller Schritt gilt.

## Kurzfassung

Das Projekt erweitert ein Business-Central-Buch um bebilderte Klickanleitungen. Es nutzt Playwright und MCP-Exploration, um Business-Central-Prozesse praktisch durchzuspielen, Screenshots zu erzeugen, Stammdaten aufzubauen und Buchluecken zu korrigieren.

FiBu Buch 5 ist dabei nicht nur ein Screenshot-Ziel. Es ist der fachliche Lernpfad fuer Business Central. Jede Buchanleitung wird als pruefbare These behandelt: Funktioniert sie in BC, welche Voraussetzungen fehlen, welche Felder und Buttons sieht der Anwender, was macht BC fachlich daraus und was muss im Buch ergaenzt werden?

Aktiver Fokus:

- Projekt `fibu-book5`
- Trainingscompany `RM-DEMO`
- Umgebung `MCP_1_20260210`
- Datenbasis CRONUS USA
- Zielprozess zuerst `UAT-O2C-001`
- UI aktuell gemischt Deutsch/Englisch
- finale deutsche Buchscreenshots stehen noch aus

## Projektmission

Das Projekt verfolgt vier gleichrangige Ziele:

1. Buch lernen: vorhandene Kapitel, Anleitungen und Annahmen verstehen.
2. Business Central lernen: Prozesse, Seiten, Buttons, Felder, Einrichtung, Fehler und Folgebelege praktisch kennenlernen.
3. Playwright lernen: robuste BC-Klickpfade, Datenanlage, Screenshots, Cleanup und Evidence automatisieren.
4. Buch verbessern: jede relevante Erkenntnis in Klickanleitung, Screenshot-Erklaerung, Workaround, Finding oder Buchtext zurueckspielen.

Definition: Eine Anleitung ist erst abgesichert, wenn der Klickpfad in BC funktioniert, die benoetigten Daten dokumentiert sind, passende Bilder vorliegen, die sichtbaren BC-Elemente erklaert sind und offene Abweichungen dokumentiert wurden.

## Was ein neuer Agent zuerst lesen muss

1. `HANDOVER.md`
2. `playwright/projects/fibu-book5/CURRENT-STATE.md`
3. `playwright/projects/fibu-book5/README.md`
4. `playwright/projects/fibu-book5/ARTIFACT-GOVERNANCE.md`
5. `playwright/projects/fibu-book5/LAB-FIT-STATUS.md`
6. `playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md`
7. `playwright/FINDINGS.md`
8. relevante Buchstelle in `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md`

## Aktueller fachlicher Stand

| Bereich | Stand |
|---|---|
| Company | `RM-DEMO` existiert als CRONUS-basierte Trainingscompany |
| Dimensionen | `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` fehlt im Labor und bleibt Folgearbeit |
| Dimensionswerte | O2C-Kernwerte `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES`, `LOCATION-GROUP=DIRECTED` und P1-Werte `DEPARTMENT=PURCH`, `DEPARTMENT=WHSE`, `PRODUCTLINE=SPARE`, `LOCATION-GROUP=SIMPLE` existieren; Service/Project/Shop/IC-Werte bleiben spaeter |
| Lagerort | `FRA-ZL` existiert als einfacher Lagerort |
| Debitor | `D10000` / `Mueller Maschinenbau GmbH` existiert |
| Artikel | `RM-M100` / `Standardmaschine M100` existiert |
| Preis | Zielpreis `68.000` im Labor sichtbar |
| Waehrung | `EUR` ist am Debitor `D10000` gesetzt und im aktuellen `UAT-O2C-001`-Auftrag nachgewiesen |
| Steuer | deutsche `19 %` USt ist in dieser CRONUS-USA-Spielwiese nicht nachgewiesen |
| Dimension im Auftrag | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind im Zeilen-Dimensionsdialog nachgewiesen |
| Standarddimensionen-UI | Page `540` zeigt `PRODUCTLINE=MACHINE` am Artikel und `CHANNEL=B2B` am Debitor als UI-Laborbild |
| Buchungsvorschau und Laborbuchung | `Preview Posting` wurde nach `MASTERDATA-009` erneut erreicht und zeigt echte Vorschauzeilen: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`; danach wurde genau eine CRONUS-USA-Laborbuchung mit `Ship and Invoice` ausgefuehrt: Auftrag `S-ORD101068`, gebuchte Verkaufsrechnung `PS-INV103297` |
| Procure-to-Pay | `UAT-P2P-001` wurde als CRONUS-USA-Laborprozess gebucht: Bestellung `106049`, Option `Receive and Invoice`, gebuchte Einkaufsrechnung `108219`; Preview zeigte `G/L Entry = 4`, `Vendor Ledger Entry = 1`, `Detailed Vendor Ledg. Entry = 1`, `Item Ledger Entry = 1`, `Value Entry = 1`; Postenspur zeigt Kreditorenposten, Sachposten, Wertposten und Artikelposten `793` |
| Reporting / Financial Reports | `REPORTING-001` oeffnet `Financial Reports` read-only ueber Tell-Me in der Gruppe `Berichte und Analysen`; Liste zeigt u. a. `Balance Sheet`, `Income Statement` und `Revenue`; `REPORTING-002` zeigt `PRODUCTLINE=MACHINE`/`CHANNEL=B2B` am Artikelposten `792`, aber noch keine sichtbare Financial-Reports-Summenwirkung |
| Inventory Trace | `INVENTORY-001` fuehrt O2C `RM-M100` und P2P `RAW-STEEL` read-only zusammen: Item Ledger Entries `792`/`793`, Value Entries, G/L Entries, Artikelkarten und Lagerort `FRA-ZL`; alle Tabellenbilder wurden mit breiter Layoutansicht erzeugt. `INVENTORY-002` belegt `Inventory Valuation` als Zahlenbericht, `INVENTORY-003` erklaert den negativen `RM-M100`-Wert als Laborfolge, `INVENTORY-004` plant `RM-M100 +2` als positiven Trainings-/Opening-Balance-Zugang |
| Inventory Posting Setup | Page `5826` zeigt die Zielkombination `FRA-ZL` + `RESALE`; `MASTERDATA-009` hat fuer den CRONUS-Laborfit `Inventory Account = 14140` gesetzt |
| Bildablage | Projektbilder liegen unter `playwright/projects/fibu-book5/img/`; Root-`img/` ist keine Sammelstelle mehr |
| Cleanup | Labor-Verkaufsauftraege werden nach Screenshot-Lauf entfernt |

## Wichtigste Entscheidungen

- CRONUS-USA ist aktuell Labor, nicht deutscher Zielmandant.
- Laborbilder sind wertvoll, aber keine finalen Buchbilder.
- `EUR` wurde am Debitor geloest.
- `19 %` deutsche USt wird nicht mit US-Sales-Tax-Feldern simuliert.
- `FURNITURE` ist im Labor ein vorhandener Sales-Tax-Code, nicht die deutsche Steuerlogik fuer Maschinen.
- MCP dient zur Exploration. Belastbare Nachweise gehoeren danach in Test, kompakte Evidence und Markdown.
- Neue Agents arbeiten ausschliesslich mit Codex. Projektdateien enthalten keine Bezuege zu anderen Agentenplattformen.
- Das Projekt muss auf Windows und macOS laufen.
- Alle Textdateien sind UTF-8; pruefen mit `npm run check:encoding`.
- Teaching Tips/Tourkarten werden fuer Tabellen- und Feldnachweise gezielt mit `dismissTours()` geschlossen; kein globales `Escape` verwenden.
- Fuer breite Tabellenbilder kann die rechte Infobox/FactBox mit `hideFactBoxPane()` eingeklappt werden, wenn sie relevante Spalten verdraengt.
- Wenn BC eine breite Layoutansicht oder vergroesserte Detail-/Listenansicht anbietet, darf sie fuer Buchscreenshots genutzt werden; der Lauf muss dann dokumentieren, warum diese Ansicht fachlich besser ist.

## Aktueller Handover-Stand

Branch:

```text
codex/playwright-bc-screenshot-foundation
```

Der aktuelle Handover-Stand enthaelt:

- Lean-Aufraeumung der MCP-Rohsnapshots
- dauerhafte Ignore-Regeln fuer `console-*.log` und `page-*.yml`
- `ARTIFACT-GOVERNANCE.md`
- `CURRENT-STATE.md` als Handover-Startpunkt
- UTF-8-/LF-Regeln und Encoding-Check
- Windows-/macOS-Hinweise fuer neue Agents
- explizite Commit-/Push-Regel: jeder Push muss eine arbeitsfaehige Uebergabe garantieren
- explizite Projektmission: Buch lernen, Business Central lernen, Playwright lernen und Buch erweitern
- allgemeine Screenshot-Helfer fuer Teaching Tips und FactBox/Infobox
- `LAB-FIT-STATUS.md` als blockuebergreifende Prozesslandkarte

Der aktuelle fachliche O2C-/Screenshot-Nachweis ist:

```text
UAT-O2C-001 nach MASTERDATA-009: Posting Preview zeigt echte Vorschauzeilen; genau eine CRONUS-USA-Laborbuchung erzeugt PS-INV103297 und Postenspur
```

Letzter echter Fortschritt:

- `MASTERDATA-BACKLOG.md` uebersetzt die Buchkapitel 3, 6 bis 18 und 19 bis 25 jetzt in einen priorisierten Stammdaten-/Setup-Backlog fuer `RM-DEMO`; `testdata/README.md` erklaert Struktur, Laborgrenzen und welche Daten bereits praktisch belegt sind.
- `MASTERDATA-DIMENSIONS` prueft die Buchdimensionen read-only gegen `RM-DEMO`: `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` sowie mehrere Erweiterungswerte fehlen. Die Standard-API erlaubt fuer `dimensions` und `dimensionValues` keinen Insert, daher bleibt die fehlende Buchmatrix ein gezielter UI-Setup-Folgeschritt.
- `MASTERDATA-010` hat die ersten P1-Dimensionswerte per UI angelegt: `PURCH`, `WHSE`, `SPARE`, `SIMPLE`. Der Lauf hat nicht gebucht und keine Pflichtdimensionen provoziert.
- Projektbilder wurden aus Root-`img/` nach `playwright/projects/fibu-book5/img/` verschoben.
- `UAT-O2C-001` erreicht `Preview Posting` ueber den Dropdown-Teil von `Post...`.
- Nach `MASTERDATA-009` stoppt BC nicht mehr auf dem Inventory-Posting-Setup-Fehler, sondern oeffnet `Posting Preview`.
- Sichtbare Vorschauzeilen: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`.
- Der maximierte Read-only-Drilldown in `G/L Entry` oeffnet direkt `G/L Entries Preview` und zeigt Konten `14140`, `50110`, `40140`, `15110`; Betraege sind im Seitentext nachgewiesen, fuer ein finales Screenshot-Betragsbild muss noch horizontal gescrollt werden.
- Der normale Buchungsdialog wurde danach bewusst fuer genau eine Laborbuchung geoeffnet; Option `Ship and Invoice`, OK einmal bestaetigt.
- Gebuchte Verkaufsrechnung `PS-INV103297` ist entstanden. Read-only-Postenspur zeigt gebuchte Verkaufsrechnung, Debitorenposten, Sachposten, Wertposten und Artikelposten. Wichtig: Die direkte Artikelpostenliste blieb mit Filter `Order No. = S-ORD101068` leer; der Artikelposten wurde ueber den Wertposten-Link `Item Ledger Entry No. = 792` gefunden. Auf diesem Artikelposten zeigt `Entry` -> `Dimensions` die Dimensionen `CHANNEL=B2B` und `PRODUCTLINE=MACHINE`.
- `REPORTING-001` startet den naechsten Block klein und read-only: Tell-Me-Suche nach `Financial Reports`, bewusst Auswahl des Treffers unter `Berichte und Analysen`, Screenshot der Financial-Reports-Liste und JSON-Evidence. Der Lauf bucht nichts und beweist noch keine `PRODUCTLINE=MACHINE`-Auswertung.
- `MASTERDATA-008` hat die blockierende Zeile in `Inventory Posting Setup` praktisch geoeffnet: `FRA-ZL` + `RESALE` ist vorhanden, aber das `Inventory Account` ist leer.
- Die `MASTERDATA-008`-Evidence enthaelt jetzt Company/Sandbox, Status `labor`, fachlichen Sollzustand, sichtbaren Ist-Befund, Limitationen, Buchwirkung und naechsten Schritt.
- Die Buchstelle und `BEGINNER-LEARNING-CHECKLIST.md` erklaeren jetzt fuer Anfaenger: Was man in der leeren `Inventory Account`-Spalte sieht, warum das die Buchungsvorschau stoppt, warum kein beliebiges Konto gesetzt werden darf und woran der naechste Fix erkannt wird.
- `MASTERDATA-009` hat den CRONUS-Laborfit gesetzt: `FRA-ZL` + `RESALE` nutzt jetzt `Inventory Account = 14140`, abgeleitet aus vorhandenen CRONUS-RESALE-Zeilen.
- Der erneute O2C-Lauf bestaetigt den Fit: `oldInventoryPostingErrorPresent = false`, `openedPreview = true`, `openedPostingChoiceDialog = false`, `noPostingCommittedByTest = true`.
- `evidence/masterdata-009/012-o2c-setup-fit-checklist.md` dokumentiert den aktuellen O2C-Setup-Fit fuer Stammdaten, Posting Groups, Tax/VAT, Dimensionen, Waehrung, Lagerort, Nummernserien/API-Anlage, Cleanup und Preview-Status.
- `evidence/uat-o2c-001/O2C-LAB-FINAL-SYNC.md` fasst den finalen aktuellen O2C-Laborstand zusammen: keine neue Buchung, `S-ORD101068` -> `PS-INV103297`, Postenspur, `PRODUCTLINE=MACHINE` am Artikelposten, offene Sachposten-/Reportingdimensionen und offene deutsche 19-%-USt.
- `UAT-P2P-001` hat den ersten Einkaufslaborprozess gebucht: Bestellung `106049` -> gebuchte Einkaufsrechnung `108219`. Vor der Preview musste `Vendor Invoice No.` gesetzt werden; die v2.0-Standard-API kann das Feld nicht patchen, ODataV4 `purchaseDocuments` schon. Preview zeigte echte Vorschauarten, danach wurde genau einmal `Receive and Invoice` bestaetigt. Postenspur: Kreditorenposten sichtbar, Sachposten mit `22100` und `14140`, Wertposten mit `RAW-STEEL` und `Item Ledger Entry No. = 793`, Artikelposten `793` sichtbar. P2P bleibt CRONUS-USA-Labor: `USD`, `Tax Percent = 0`, keine deutsche 19-%-Vorsteuer, `PRODUCTLINE=MACHINE` nicht in P2P-Posten sichtbar.
- `FINDINGS.md`, Coverage, Workarounds, Screenshot-QA und Buchtext sind auf diesen Laborstand synchronisiert.
- `INVENTORY-001` ist als read-only Inventory Trace gelaufen: O2C-Artikelposten `792` zeigt `RM-M100`, `FRA-ZL`, Menge `-1`, Sales Amount `67.673,60` und Cost Amount `-42.000,00`; O2C-Wertposten verknuepfen `PS-INV103297` mit `Item Ledger Entry No. 792`; O2C-Sachposten zeigen u. a. `14140`. P2P-Artikelposten `793` zeigt `RAW-STEEL`, `FRA-ZL`, Menge `10` und Kostenbezug; P2P-Wertposten verknuepfen `108219` mit `Item Ledger Entry No. 793`; P2P-Sachposten zeigen `22100` und `14140` mit `25.000`. Der Test bucht nicht, nutzt die breite Layoutansicht und schliesst Teaching Tips vor den Screenshots.
- `INVENTORY-002` ist als read-only Lagerbewertungsnachweis gelaufen: `Inventory Valuation` wurde ueber Tell-Me geoeffnet, die Request Page mit `As Of Date = 08.06.2026`, `No. = RM-M100|RAW-STEEL` und `Location Filter = FRA-ZL` gefuellt und per `Vorschau` gerendert. Der Bericht zeigt `RAW-STEEL = 25.000,00`, `RM-M100 = -42.000,00` und `Total Inventory Value = -17.000,00`. Keine Buchung, keine Kostenregulierung, keine Warehouse-Aktivierung.
- `INVENTORY-003` erklaert diesen negativen `RM-M100`-Wert ohne neue BC-Ausfuehrung: `RAW-STEEL` hat durch P2P einen belegten positiven Zugang `10` / `25.000`, `RM-M100` hat durch O2C einen belegten Abgang `-1` / `-42.000`; ein passender positiver Zugang oder Anfangsbestand fuer `RM-M100` in `FRA-ZL` ist in der aktuellen Evidence-Kette nicht belegt. Das ist kein Reportfehler, sondern ein Labor-Lernfall fuer Bestand, Stichtag, Filter und Kostenkette.
- `INVENTORY-004` ist als Planungs-/Readiness-Schritt dokumentiert: Fuer stabile finale `RM-M100`-Buchbilder ist ein klar markierter Trainings-/Opening-Balance-Zugang `+2` in `FRA-ZL` der kleinste kontrollierte naechste Schritt. Einkauf von `RM-M100` passt fachlich schlechter, Assembly ist ein anderer Prozess, und Manufacturing/Output bleibt der spaetere echte End-to-End-Nachweis fuer Maschinenfertigung. Keine BC-Ausfuehrung und keine Buchung in diesem Lauf.

## Aktuelle O2C-Wahrheit

Ziel laut Buch:

```text
UAT-O2C-001:
D10000 kauft RM-M100
Menge 1
Preis 68.000 EUR
USt 19 %
Dimension PRODUCTLINE = MACHINE
Brutto 80.920 EUR
```

Laborstand:

```text
Klickpfad funktioniert.
D10000 funktioniert.
RM-M100 funktioniert.
Menge 1 funktioniert.
Preis 68.000 sichtbar.
EUR ist am Debitor gesetzt und in neuen Auftraegen sichtbar.
Zeilenbild klappt die rechte FactBox ein und zeigt Menge 1, FRA-ZL, EUR-Summen und Total Tax 0,00.
PRODUCTLINE = MACHINE ist im Zeilen-Dimensionsdialog sichtbar.
Preview Posting wird ueber den Dropdown-Teil von Post... erreicht.
Inventory Posting Setup Page 5826 zeigte diese Kombination zunaechst mit leerem Inventory Account als Labor-Nachweis; `MASTERDATA-009` setzt jetzt `14140`.
Preview Posting nach diesem Setup-Fit ist erneut gelaufen: Der alte Fehler `Inventory Account is missing... FRA-ZL, RESALE` ist weg.
Die Vorschau zeigt `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1` und `Value Entry = 1`.
Der Drilldown in `G/L Entry` zeigt eine G/L-Preview mit Konto `14140`; `PRODUCTLINE=MACHINE` ist dort noch nicht sichtbar.
Preview-Auftrag `S-ORD101067` wurde nicht gebucht und bereinigt. Laborauftrag `S-ORD101068` wurde genau einmal mit `Ship and Invoice` gebucht; gebuchte Verkaufsrechnung `PS-INV103297` bleibt als Labor-Evidence erhalten.
19 % deutsche USt ist noch nicht erreicht.
```

Warum USt offen ist:

- Aktuelle Umgebung basiert auf CRONUS USA.
- Verkaufszeile zeigt `Tax Group Code = FURNITURE`.
- Debitor zeigt `Tax Liable = checked` und `Tax Area Code = leer`.
- `Tax Details` zeigt US-Sales-Tax-Werte wie GA/FURNITURE.
- Page 472/473 zeigt `VAT Posting Setup` / `Tax Posting Setup`, aber `VAT Calculation Type = Sales Tax`.

Folge:

Der aktuelle gebuchte Lauf darf nur als CRONUS-USA-Laborbuchung gelesen werden. Er darf nicht als deutscher Steuer-Endstand verkauft werden und nicht erneut gebucht werden.

## Naechster sinnvoller Schritt

Governance, Encoding, Mac-Kompatibilitaet und Lean-Evidence sind committed und gepusht. Nicht erneut mit Aufraeumen beginnen, solange keine neue Rohmasse entsteht.

Als naechstes gezielt den naechsten Lernblock waehlen, ohne erneut zu buchen:

1. `080-posting-result.json` und `082-posting-entry-trace.json` lesen.
2. Die Postenspur nicht erneut buchen; `PS-INV103297` ist der Laborbeleg.
3. O2C ist im CRONUS-Labor bis gebuchte Rechnung, Postenspur, Artikelposten und Artikelposten-Dimension nachgewiesen.
4. Stammdaten- und Setup-Folgearbeit aus `MASTERDATA-BACKLOG.md` ableiten, damit neue Prozesse nicht mit fehlenden Kreditoren, Artikeln, Dimensionswerten, Posting Groups oder Tax/VAT-Annahmen starten.
5. `UAT-P2P-001` ist nach Readiness und Preview genau einmal im Labor gebucht: Bestellung `106049`, gebuchte Einkaufsrechnung `108219`, `Receive and Invoice`; Postenspur ist read-only belegt. Keine zweite P2P-Buchung ohne neuen ausdruecklichen Grund.
6. `INVENTORY-001` hat O2C- und P2P-Inventory-Spuren read-only zusammengefuehrt. `INVENTORY-002` hat danach `Inventory Valuation` mit Datum, Artikel- und Lagerortfilter als Zahlenbericht nachgewiesen. `INVENTORY-003` erklaert den negativen `RM-M100`-Wert als Bestands-/Kostenketten-Lernfall. `INVENTORY-004` legt den Zielbestandsplan fest: naechster praktischer Inventory-Schritt ist ein kontrollierter positiver Trainings-/Opening-Balance-Zugang fuer `RM-M100`, keine zweite O2C-Buchung und keine Warehouse-Aktivierung.
7. `REPORTING-002` hat Financial Reports und O2C-Posten read-only geprueft: `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `Entry No. 792` sichtbar, aber nicht in den aktuellen Sachposten-/Financial-Reports-Texten; Financial Reports zeigt `Dimension Perspective`, `Column Definition` und Reports `Income Statement`, `Revenue`, `Balance Sheet`.
8. Deutsche `19 %`-USt bleibt davon getrennt offen.

Synchronisationsstand nach der letzten Projektwahrheits-Pruefung:

- Praktisch nachgewiesen: O2C-Kopf, Verkaufszeile, EUR, `PRODUCTLINE=MACHINE` im Zeilendimensionsdialog, Preview Posting mit Vorschauzeilen, G/L-Preview-Drilldown mit Konto `14140`, Inventory-Posting-Setup-Zeile `FRA-ZL` + `RESALE`, Laborfit `Inventory Account = 14140`.
- Labor-Nachweis: alle aktuellen O2C-, MASTERDATA-008- und MASTERDATA-009-Bilder/Evidence gelten fuer CRONUS USA / gemischte UI; `MASTERDATA-009` ist ein Labor-Setup-Fit, kein deutscher Kontenplan-Endstand.
- Labor-Buchungsfreigabe: `070-lab-posting-readiness.md` wurde genutzt; genau eine CRONUS-USA-Laborbuchung ist erfolgt (`S-ORD101068` -> `PS-INV103297`). Nicht erneut buchen.
- Finaler DE-Nachweis offen: deutsche Oberflaeche, 19-%-USt, deutsche Buchung und deutsche Postenspur.
- Blockiert/offen: kein Inventory-Posting-Setup-Blocker mehr; direkter Artikelposten-Check ist geloest ueber `Item Ledger Entry No. = 792`; `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten nachgewiesen; `Inventory Valuation` ist als Labor-Zahlenbericht nachgewiesen und der negative `RM-M100`-Wert ist als Laborfolge erklaert; der Zielbestandsplan fuer finale `RM-M100`-Bilder ist dokumentiert, aber noch nicht praktisch gebucht; Reporting-Seite ist erreichbar und zeigt Dimension-/Analyseoptionen, aber `PRODUCTLINE`/`CHANNEL` sind im aktuellen Financial-Reports-Lauf nicht sichtbar nutzbar; offen bleiben Steuer-/VAT-Fit, Sachposten-Dimensionsdialog/Dimension-Set-Nachweis, Reporting-Auswertungsnachweis, positive `RM-M100`-Bestandsbewegung und finale deutsche Nachweise.
- Dimensionen: O2C-Kerndimensionen und Default Dimensions sind praktisch nachgewiesen; vollstaendige Buchstandard-Dimensionsmatrix ist noch nicht fertig.
- Nicht geprueft: P2P-Zahlung/OP-Ausgleich, deutsche P2P-19-%-Vorsteuer, P2P-Dimensionen in Posten, echte Financial-Reports-Zahlenwirkung nach Dimension, praktische positive `RM-M100`-Bestandsbewegung nach `INVENTORY-004`.

## Befehle fuer neue Agents

Windows:

```powershell
npm install
npx playwright install chromium
npm run check:encoding
Copy-Item .env.example .env
npm run auth:bc
```

macOS/Linux:

```bash
npm install
npx playwright install chromium
npm run check:encoding
cp .env.example .env
npm run auth:bc
```

Danach `.env` mit der konkreten Business-Central-URL fuellen.

## Wichtige Dateien fuer den naechsten Lauf

| Datei | Zweck |
|---|---|
| `playwright/projects/fibu-book5/testdata/sales/uat-o2c-001.json` | Zielwerte fuer O2C |
| `playwright/projects/fibu-book5/tests/uat-o2c-001-sales-order.spec.ts` | aktueller O2C-Test |
| `playwright/projects/fibu-book5/evidence/uat-o2c-001/README.md` | Evidence-Index fuer den aktuellen O2C-Laborlauf |
| `playwright/projects/fibu-book5/evidence/uat-o2c-001/O2C-LAB-FINAL-SYNC.md` | finaler O2C-Labor-Sync ohne neue Buchung |
| `playwright/projects/fibu-book5/evidence/inventory-001/INVENTORY-LAB-TRACE.md` | read-only Inventory Trace fuer O2C/P2P: Artikelposten, Wertposten, Sachposten, Artikelkarten, Lagerort, breite Layoutansicht |
| `playwright/projects/fibu-book5/evidence/inventory-002/INVENTORY-VALUATION.md` | read-only Lagerbewertungsbericht mit Stichtag, Item-/Location-Filter, Laborzahlen und negativem RM-M100-Lernfall |
| `playwright/projects/fibu-book5/evidence/inventory-003/INVENTORY-NEGATIVE-RM-M100.md` | read-only Erklaerung des negativen RM-M100-Laborwerts aus O2C-/P2P-Postenspur |
| `playwright/projects/fibu-book5/evidence/inventory-004/RM-M100-TARGET-STOCK-PLAN.md` | Planungs-/Readiness-Nachweis fuer positiven RM-M100-Zugang vor finalen Buchbildern |
| `playwright/projects/fibu-book5/BOOK-TO-EVIDENCE-AUDIT.md` | kritischer Buch-vs.-Projekt-vs.-Evidence-Abgleich mit Anforderungsmatrix |
| `playwright/projects/fibu-book5/BOOK-EVIDENCE-WORKPLAN.md` | belastbarer Arbeitsplan aus Buch-vs.-Evidence-Abgleich |
| `playwright/projects/fibu-book5/MASTERDATA-BACKLOG.md` | priorisierter Stammdaten- und Setup-Backlog aus dem Buch fuer `RM-DEMO` |
| `playwright/projects/fibu-book5/testdata/README.md` | Testdatenstruktur, Konventionen und Laborgrenzen |
| `playwright/projects/fibu-book5/evidence/masterdata-dimensions/011-dimension-foundation-summary.md` | aktueller Foundation-/Dimensionsfit inklusive fehlender Erweiterungswerte |
| `playwright/projects/fibu-book5/evidence/masterdata-010/011-p1-dimension-values-summary.md` | P1-Dimensionswerte fuer P2P/Inventory/Warehouse |
| `playwright/projects/fibu-book5/LAB-FIT-STATUS.md` | blockuebergreifende Prozesslandkarte |
| `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md` | harter Soll-Ist-Abgleich |
| `playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md` | bekannte Fehler und Loesungen |
| `playwright/projects/fibu-book5/MICROSOFT-DOC-VALIDATION.md` | offizieller Doku-Abgleich |
| `playwright/projects/fibu-book5/PLAYWRIGHT-MCP-WORKFLOW.md` | MCP-Regeln und bisherige MCP-Erkenntnisse |

## Nicht wiederholen

- Nicht versuchen, `19 %` durch irgendein US-Tax-Area-Feld zu erzwingen.
- Nicht MCP-Rohsnapshots wie `console-*.log` oder `page-*.yml` committen; Erkenntnisse in kompakte Evidence ueberfuehren.
- Nicht mit blindem `Enter` den ersten Tell-Me-Treffer waehlen.
- Nicht globale `Escape`-Workarounds nutzen, um Popups zu schliessen.
- Nicht den Hauptteil von `Post...` klicken, wenn `Preview Posting` gemeint ist; das oeffnet den normalen Buchungsdialog `Ship / Invoice / Ship and Invoice`.
- Nicht aus freiem Seitentext ungescopte Belegnummern fuer Cleanup ableiten.
- Nicht `.env`, `playwright/.auth/`, Playwright-Reports oder Test-Traces committen.
