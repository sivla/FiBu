# Current State fuer FiBu Buch 5

Stand: 09.06.2026

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
6. `playwright/projects/fibu-book5/AUTOPILOT-STATE.json`
7. `playwright/projects/fibu-book5/POSTING-AND-SETUP-GATES.md`
8. `playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md`
9. `playwright/FINDINGS.md`
10. relevante Buchstelle in `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md`

## Aktueller fachlicher Stand

| Bereich | Stand |
|---|---|
| Company | `RM-DEMO` existiert als CRONUS-basierte Trainingscompany |
| Dimensionen | `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` fehlt im Labor und bleibt Folgearbeit |
| Dimensionswerte | O2C-Kernwerte `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES`, `LOCATION-GROUP=DIRECTED` und P1-Werte `DEPARTMENT=PURCH`, `DEPARTMENT=WHSE`, `PRODUCTLINE=SPARE`, `LOCATION-GROUP=SIMPLE` existieren; Service/Project/IC-/Dropshipping-Werte bleiben spaeter |
| Lagerort | `FRA-ZL` existiert als einfacher Lagerort |
| Debitor | `D10000` / `Mueller Maschinenbau GmbH` existiert |
| Artikel | `RM-M100` / `Standardmaschine M100` existiert |
| Preis | Zielpreis `68.000` im Labor sichtbar |
| Waehrung | `EUR` ist am Debitor `D10000` gesetzt und im aktuellen `UAT-O2C-001`-Auftrag nachgewiesen |
| Steuer | deutsche `19 %` USt ist in dieser CRONUS-USA-Spielwiese nicht nachgewiesen; `TAX-001` trennt CRONUS-USA-Sales-Tax und deutsches VAT-Ziel als Readiness-/Buch-Sync |
| Dimension im Auftrag | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind im Zeilen-Dimensionsdialog nachgewiesen |
| Standarddimensionen-UI | Page `540` zeigt `PRODUCTLINE=MACHINE` am Artikel und `CHANNEL=B2B` am Debitor als UI-Laborbild |
| Buchungsvorschau und Laborbuchung | `Preview Posting` wurde nach `MASTERDATA-009` erneut erreicht und zeigt echte Vorschauzeilen: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`; danach wurde genau eine CRONUS-USA-Laborbuchung mit `Ship and Invoice` ausgefuehrt: Auftrag `S-ORD101068`, gebuchte Verkaufsrechnung `PS-INV103297` |
| Procure-to-Pay | `UAT-P2P-001` wurde als CRONUS-USA-Laborprozess gebucht: Bestellung `106049`, Option `Receive and Invoice`, gebuchte Einkaufsrechnung `108219`; Preview zeigte `G/L Entry = 4`, `Vendor Ledger Entry = 1`, `Detailed Vendor Ledg. Entry = 1`, `Item Ledger Entry = 1`, `Value Entry = 1`; Postenspur zeigt Kreditorenposten, Sachposten, Wertposten und Artikelposten `793` |
| Reporting / Financial Reports | `REPORTING-001` oeffnet `Financial Reports` read-only; `REPORTING-002` zeigt `PRODUCTLINE=MACHINE`/`CHANNEL=B2B` am Artikelposten `792`, aber keine sichtbare Financial-Reports-Summenwirkung; `REPORTING-003` prueft `Definitions -> Dimension Perspective`, landet aber im Role Center; `REPORTING-004` oeffnet `Analysis Views`, waehlt `REVENUE` und zeigt, dass diese Analysis View `AREA`, `DEPARTMENT`, `CUSTOMERGROUP` nutzt, aber nicht `PRODUCTLINE`/`CHANNEL`; `REPORTING-005` versucht `Dimensions - Detail` read-only und erreicht den Zielbericht ueber Tell-Me nicht sichtbar; `REPORTING-006` prueft gefilterte `G/L Entries` zur Rechnung `PS-INV103297` und findet dort keinen sichtbaren Data-Analysis-/Analysemodus-Hebel fuer `PRODUCTLINE`/`CHANNEL`; `REPORTING-007` sucht `Analysis by Dimensions` read-only: Tell-Me zeigt den Suchpfad, aber der Ziel-/Request-/Analysezustand wurde nicht belastbar erreicht; `REPORTING-009` prueft `G/L Entries` in breiter Ansicht: `Department Code`/`Customergroup Code` sind sichtbar, aber `PRODUCTLINE`/`CHANNEL` und `Entry` -> `Dimensions` bleiben im Sachpostenkontext unsichtbar |
| Inventory Trace | `INVENTORY-001` fuehrt O2C `RM-M100` und P2P `RAW-STEEL` read-only zusammen: Item Ledger Entries `792`/`793`, Value Entries, G/L Entries, Artikelkarten und Lagerort `FRA-ZL`; alle Tabellenbilder wurden mit breiter Layoutansicht erzeugt. `INVENTORY-002` belegt `Inventory Valuation` als Zahlenbericht, `INVENTORY-003` erklaert den negativen `RM-M100`-Wert als Laborfolge, `INVENTORY-004` plant `RM-M100 +2` als positiven Trainings-/Opening-Balance-Zugang, `INVENTORY-005` belegt Page `40`/`Item Journals` als read-only Einstieg, `INVENTORY-006` belegt den kontrollierten Journal-Draft mit Zielwerten und `PRODUCTLINE=MACHINE`, `INVENTORY-007` belegt `Journal Check` als Preflight, `INVENTORY-008` bucht genau einmal `INV008-899959` als `RM-M100 +2` in `FRA-ZL` und belegt Artikelposten, Wertposten, Sachposten `14140` sowie Inventory Valuation mit `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00`, `Total Inventory Value = 67.000,00` |
| Manufacturing / Assembly | `MANUFACTURING-001` prueft read-only die Kapitel-14-Vorstufe: Tell-Me zeigt `Planning Worksheet`, `Production BOMs`, `Routings`, `Released Production Orders`, `Consumption Journal` und `Output Journal`; `Assembly Orders` wurde nicht belastbar sichtbar. `RM-M100` und `RAW-STEEL` sind als Artikel sichtbar, `COMP-CTRL` und `KIT-MAINT` nicht; auf den Artikelkarten sind keine sichtbaren BOM-/Routing-/Manufacturing-Marker nachgewiesen. `MANUFACTURING-002` synchronisiert Kapitel 14 mit dieser Wahrheit: sichtbare Seiten sind nur Readiness, `INV008-899959` ist kein Manufacturing-Output, keine Einrichtung, kein Fertigungsauftrag, kein Verbrauch, kein Output, keine Buchung |
| Service | `SERVICE-001` prueft read-only die Kapitel-15-Vorstufe: Tell-Me zeigt `Service Orders`, `Service Items`, `Resources`, `Service Management Setup`, `Service Contracts` und `Service Ledger Entries`; `D10000` ist als Kunde sichtbar. Die konkreten Zielobjekte `RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH` und `VAN-SERV` sind im gefilterten Laborlauf nicht als Nummern sichtbar. `SERVICE-002` synchronisiert Kapitel 15 damit: sichtbare Service-Seiten sind Readiness, die Schrittfolge `SERV-4001` bleibt Zielpfad. Keine Einrichtung, kein Serviceauftrag, kein Ersatzteilverbrauch, keine Ressourcenerfassung, keine Rechnung, keine Buchung |
| Projects | `PROJECTS-001` prueft read-only die Kapitel-16-Vorstufe: Tell-Me zeigt `Projects`, `Project Planning Lines`, `Project Journals`, `Project Ledger Entries`, `Project Statistics` und `Project WIP`; `D10000` ist als Projektkunde sichtbar. Die konkreten Zielobjekte `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02` und `PROJ-LAG` sind im gefilterten Laborlauf nicht als Nummern sichtbar. `PROJECTS-002` synchronisiert Kapitel 16 damit: sichtbare Project-/Job-Seiten sind Readiness, die Schrittfolge `PROJ-5001` bleibt Zielpfad. Keine Einrichtung, kein Projekt, keine Projektaufgaben, keine Planzeilen, kein Projektjournal, keine WIP-Berechnung, keine Rechnung, keine Buchung |
| Dropshipping / Sonderverkauf | `DROPSHIPPING-001` prueft read-only Kapitel 17 ohne Shopify-Scope: Tell-Me zeigt `Sales Orders`, `Purchase Orders`, `Requisition Worksheets` und `Purchasing Codes`; `Drop Shipments` ist in diesem Lauf kein stabiler Tell-Me-Treffer. Die Zielobjekte `D11000`, `K20000` und `SP-PUMP-01` sind in gefilterten Listen nicht sichtbar. `DROPSHIPPING-002` synchronisiert Kapitel 17 damit: sichtbare Einstiege sind Readiness, `DS-24001` bleibt Zielpfad nach Setup-Fit und Gate. Keine Einrichtung, kein Verkaufsauftrag, keine Einkaufsbestellung, keine Requisition-Worksheet-Aktion, keine Preview, keine Buchung |
| Intercompany / Ausland | `INTERCOMPANY-001` prueft read-only Kapitel 18: Tell-Me zeigt `Intercompany Setup`, `IC Partners`, `IC Inbox Transactions`, `IC Outbox Transactions` und `VAT Entries`; `Currencies` ist in diesem Lauf kein stabiler Tell-Me-Treffer. Die Zieldebitoren `D20000`, `D30000` und `D90000` sind in gefilterten Customer-Listen nicht sichtbar. `INTERCOMPANY-002` synchronisiert Kapitel 18 damit: `IC-7001` ist Zielpfad, kein RM-DEMO-Endstand. Keine neue Company, kein Company-Wechsel, kein IC-Partner-Setup, kein IC-Beleg `IC-7001`, keine IC Inbox/Outbox-Aktion, keine VAT-/Waehrungs-Aenderung, keine Preview, keine Buchung |
| Bank / Payments | `PAYMENTS-001` prueft read-only die offenen Posten: Debitorenposten zur gebuchten Verkaufsrechnung `PS-INV103297` und Kreditorenposten zur gebuchten Einkaufsrechnung `108219` sind sichtbar; Restbetrag/Open-Logik und Payment-/Apply-Aktionen sind erkennbar. Keine Zahlung, kein Ausgleich, kein Journal und keine Bankabstimmung wurden ausgefuehrt |
| Bank-/Journal-Readiness | `PAYMENTS-002` prueft Bankkonten, Cash Receipt Journal, Payment Journal und Apply-Entries-Pfade kontrolliert ohne Buchung. `PAYMENTS-003` legt `BANK-RM-01` als Laborbankkonto an und zeigt es in Bank Accounts; dieser API-Fit ist Laborhistorie, keine Buch-Klickanleitung. `PAYMENTS-004` bestaetigt live `BANK-RM-01` und zeigt im Cash Receipt Journal Pflichtfelder und Journal Check. `PAYMENTS-005` bereitet eine Zahlungsjournal-Entwurfszeile vollstaendig ueber die UI vor und loescht sie wieder. `PAYMENTS-006` klaert Amount-Format und zeigt danach den fehlenden Bank-Posting-Group-Blocker. `PAYMENTS-007` fittet `BANK-RM-01` per UI auf `CHECKING`. `PAYMENTS-008` zeigt den Draft mit `Journal Check = 0 Issues`. `PAYMENTS-009` oeffnet Apply Entries read-only aus dem Cash-Receipt-Draft, weist den Rechnungsbezug `PS-INV103297` nach und dokumentiert: `Preview Posting` ist nicht direkt sichtbar. `PAYMENTS-010` oeffnet den Post-Bestaetigungsdialog nur bis `Ja/Nein`, bricht mit `Nein` ab und bereinigt den Draft. Keine Zahlung, kein Ausgleich, keine Bankabstimmung |
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
- Fuer Buch-Klickanleitungen gilt UI-first: Wenn fachlich etwas angelegt, geaendert, vorbereitet oder gebucht werden muss, braucht das Projekt einen UI-Klickpfad. API darf technische Zusatzdiagnose, Cleanup oder historischen Laborfit liefern, ersetzt aber keine bebilderte Anleitung.
- Shopify/Online Store ist aus dem aktiven Buch-5-Lernscope gestrichen. Kapitel 17 bleibt als Dropshipping/Sonderverkauf ohne Shopify-Connector erhalten; zukuenftige Laeufe sollen keine Shopify-Klickpfade, `WEB-24001`, `CHANNEL=SHOP` oder Shopify-Testdaten planen. Historische BC-Oberflaechentexte duerfen weiterhin Shopify enthalten, wenn sie nur alte Evidence oder Standard-UI-Funde sind.

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
- `AUTOPILOT-STATE.json` als maschinenlesbarer Autopilot-Status fuer Sandbox, Company, letzte Laborbuchungen, Hard Locks und naechsten Schritt
- `POSTING-AND-SETUP-GATES.md` als ausdrueckliche Gate-Liste fuer Zahlungen, Analysis View, DE-VAT, Fixed Assets, Warehouse, Manufacturing, Service, Projects, neue Company und Wiederholungsbuchungen
- `SERVICE-001` als read-only Evidence fuer Kapitel 15 und `SERVICE-002` als Buch-Sync: Service-Einstiege sichtbar, Zielobjekte fuer den Buchfall noch nicht tragfaehig belegt, Schrittfolge `SERV-4001` im Buch als Zielpfad markiert
- `PROJECTS-001` als read-only Evidence fuer Kapitel 16: Project-/Job-Einstiege sichtbar, `D10000` sichtbar, Zielobjekte `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02` und `PROJ-LAG` noch nicht tragfaehig belegt; `PROJECTS-002` als Buch-Sync: Kapitel 16 markiert die Schrittfolge als Zielpfad nach Setup-Fit; Setup, WIP, Faktura und Buchung bleiben gate-gesperrt
- `DROPSHIPPING-001` als read-only Evidence fuer Kapitel 17: BC-Standard-Einstiege fuer Sales Orders, Purchase Orders, Requisition Worksheets und Purchasing Codes sind sichtbar; `Drop Shipments` ist kein stabiler Treffer; Zielobjekte `D11000`, `K20000`, `SP-PUMP-01` fehlen; `DROPSHIPPING-002` als Buch-Sync: Kapitel 17 markiert `DS-24001` als Zielpfad nach UI-first Setup-Fit; Shopify bleibt out of scope
- `INTERCOMPANY-001` als read-only Evidence fuer Kapitel 18: IC-/Intercompany-Einstiege und `VAT Entries` sind sichtbar, `Currencies` nicht stabil; Zieldebitoren `D20000`, `D30000`, `D90000` fehlen; kein Company-Wechsel, kein IC-Setup, kein IC-Beleg, keine Buchung
- `INTERCOMPANY-002` als Buch-/Evidence-Sync fuer Kapitel 18: sichtbare IC-/VAT-Seiten sind Readiness, `IC-7001` ist Zielpfad, fehlende Zieldebitoren und Mehr-Company-/IC-/VAT-Fit sind Setup-Luecken; praktischer IC-/Auslandprozess bleibt gate-gesperrt

Der aktuelle fachliche O2C-/Screenshot-Nachweis ist:

```text
UAT-O2C-001 nach MASTERDATA-009: Posting Preview zeigt echte Vorschauzeilen; genau eine CRONUS-USA-Laborbuchung erzeugt PS-INV103297 und Postenspur
```

Letzter echter Fortschritt:

- `INTERCOMPANY-002` ist als Buch-/Evidence-Sync ohne BC-Lauf dokumentiert: Kapitel 18 trennt jetzt Intercompany-/Ausland-Zielpfad von RM-DEMO-Readiness. `IC-7001` ist kein gebuchter Laborfall. Sichtbare Einstiegspfade und fehlende Debitoren aus `INTERCOMPANY-001` werden im Buch als Vorbereitungs- und Setupbefund erklaert. Keine Einrichtung, kein Company-Wechsel, keine VAT-/Waehrungs-Aenderung und keine Buchung.
- `INTERCOMPANY-001` ist als read-only Evidence fuer Kapitel 18 dokumentiert: `Intercompany Setup`, `IC Partners`, `IC Inbox Transactions`, `IC Outbox Transactions` und `VAT Entries` sind als Einstiegspfade sichtbar; `Currencies` ist nicht stabil sichtbar. Die Zieldebitoren `D20000`, `D30000` und `D90000` fehlen in `RM-DEMO`. Keine neue Company, kein Company-Wechsel, kein IC-Partner-Setup, kein Beleg `IC-7001`, keine VAT-/Waehrungs-Aenderung und keine Buchung.
- `DROPSHIPPING-002` ist als Buch-/Evidence-Sync ohne BC-Lauf dokumentiert: Kapitel 17 trennt jetzt sichtbare Dropshipping-/Sonderverkaufs-Einstiege von echter Prozessfaehigkeit. `DROPSHIPPING-001` bleibt der praktische Readiness-Nachweis: `Sales Orders`, `Purchase Orders`, `Requisition Worksheets`, `Purchasing Codes` sichtbar; `Drop Shipments` nicht stabil; `D11000`, `K20000`, `SP-PUMP-01` fehlen. Keine Einrichtung, kein Auftrag, keine Bestellung, keine Requisition-Worksheet-Aktion, kein Shopify-Setup und keine Buchung.
- `PROJECTS-002` ist als Buch-/Evidence-Sync ohne BC-Lauf dokumentiert: Kapitel 16 trennt Project-/Job-Einstiege von echter Projektfaehigkeit. `PROJECTS-001` bleibt der praktische Readiness-Nachweis: Einstiege sichtbar, `D10000` sichtbar, `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02` und `PROJ-LAG` fehlen. Keine Einrichtung, keine Projektplanzeile, kein Projektjournal, keine WIP-Berechnung, keine Rechnung und keine Buchung.
- `MASTERDATA-BACKLOG.md` uebersetzt die Buchkapitel 3, 6 bis 18 und 19 bis 25 jetzt in einen priorisierten Stammdaten-/Setup-Backlog fuer `RM-DEMO`; `testdata/README.md` erklaert Struktur, Laborgrenzen und welche Daten bereits praktisch belegt sind.
- `MASTERDATA-DIMENSIONS` prueft die Buchdimensionen read-only gegen `RM-DEMO`: `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` sowie mehrere Erweiterungswerte fehlen. Die Standard-API erlaubt fuer `dimensions` und `dimensionValues` keinen Insert, daher bleibt die fehlende Buchmatrix ein gezielter UI-Setup-Folgeschritt.
- `MASTERDATA-010` hat die ersten P1-Dimensionswerte per UI angelegt: `PURCH`, `WHSE`, `SPARE`, `SIMPLE`. Der Lauf hat nicht gebucht und keine Pflichtdimensionen provoziert.
- `REPORTING-003` hat `Financial Reports` read-only im breiten Viewport geoeffnet, `Income Statement` fokussiert und `Definitions -> Dimension Perspective` versucht. Ergebnis: kein sichtbarer Dimension-Perspective-Kontext, kein `PRODUCTLINE`/`CHANNEL`; der Ergebniszustand ist ein rejected Role-Center-Bild.
- `REPORTING-004` hat `Analysis Views` read-only geoeffnet und `REVENUE` als vorhandene Analysis View geprueft. Ergebnis: Die Card zeigt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, aber nicht `PRODUCTLINE` oder `CHANNEL`; keine Buchung und keine Analysis-View-Aktualisierung.
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
- `INVENTORY-005` ist als read-only Pfadnachweis gelaufen: Page `40` oeffnet `Item Journals`, Tell-Me zeigt `Item Journals`, zentrale Felder fuer eine spaetere Journalzeile sind sichtbar (`Posting Date`, `Entry Type`, `Document No.`, `Item No.`, `Location Code`, `Quantity`, `Unit Cost`) und `Post` ist sichtbar. FactBox wurde eingeklappt und breite Layoutansicht aktiviert. Keine Ziel-Journalzeile fuer `RM-M100`, keine Preview-Wirkung, keine Dimension und keine Buchung wurden erzeugt.
- `INVENTORY-006` ist als kontrollierter Labor-Draft gelaufen: Page `40`/`Item Journals` wurde mit breiter Layoutansicht genutzt, Zielzeile `Positive Adjmt.`, `RM-M100`, `FRA-ZL`, Menge `2`, `PCS`, Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00` wurde sichtbar vorbereitet, `Line` -> `Dimensions` zeigt `PRODUCTLINE=MACHINE`, `Post` ist sichtbar. `Preview Posting` wurde nicht als stabil nutzbare Vorabkontrolle nachgewiesen; deshalb keine Buchung. Der Draft wurde ueber `Weitere Optionen anzeigen` -> `Zeile loeschen` bereinigt. Ein frueher Fehlgriff in `Applies-to Entry` wurde als Tool-/Anfaenger-Lernfall erkannt: rechts liegende Journalspalten duerfen nicht per blindem Index beschrieben werden.
- `INVENTORY-007` ist als nicht buchender Journal-Check-Preflight gelaufen: Die Zielzeile `RM-M100 +2` in `FRA-ZL` wurde temporaer erneut vorbereitet, die rechte FactBox blieb fuer den Screenshot bewusst sichtbar, und `Journal Check` meldete `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` sowie `Current line: No issues found`. `Preview Posting` ist im Item Journal weiter nicht sichtbar nachgewiesen. Es wurde nicht gebucht; der temporaere Draft wurde bereinigt. Der Lauf dokumentiert auch den Cleanup-Lernfall: Bei sichtbarer FactBox darf Cleanup nicht allein von globalen Tastaturpfaden abhaengen.
- `INVENTORY-008` ist als kontrollierte CRONUS-USA-Laborbuchung gelaufen: Der Test bereinigte alte `INV008-*`-Drafts, bereitete `INV008-899959` mit `Positive Adjmt.`, `RM-M100`, `FRA-ZL`, Menge `2`, Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00` vor, pruefte `PRODUCTLINE=MACHINE` vor der Buchung und buchte danach genau einmal ueber `Post`. Danach sind Artikelposten, Wertposten und Sachposten sichtbar; G/L Entry zeigt `Inventory Account = 14140`. `Inventory Valuation` zeigt nach der Buchung `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00` und `Total Inventory Value = 67.000,00`. Kein deutscher Finalnachweis, keine deutsche USt, keine Warehouse-Aktivierung, kein Manufacturing und keine Kostenregulierung.
- `PAYMENTS-001` ist als read-only OP-Readiness gelaufen: Debitorenposten zur Verkaufsrechnung `PS-INV103297` und Kreditorenposten zur Einkaufsrechnung `108219` sind in `RM-DEMO` sichtbar; offene Restbetragslogik sowie Payment-/Apply-Aktionen sind erkennbar. Der Lauf hat nicht gebucht, nicht ausgeglichen, kein Zahlungsjournal und keine Bankabstimmung geoeffnet. Teaching Tips werden vor den Tabellenbildern gezielt geschlossen.
- `PAYMENTS-002` ist als kontrollierter Readiness-Lauf gelaufen: Bank Accounts, Cash Receipt Journal, Payment Journal sowie Apply Entries aus Debitoren- und Kreditorenposten sind praktisch geprueft. Der Lauf erzeugt keine Journalzeile, bucht nicht und gleicht nicht aus. Der dabei sichtbare Blocker `BANK-RM-01` fehlte.
- `PAYMENTS-003` hat diesen Bankkonto-Blocker als idempotenten Setup-Fit geloest: `BANK-RM-01` / `Hausbank Rhein-Main` wurde per BC-Standard-API angelegt und ist in Bank Accounts sichtbar. Das ist nur ein CRONUS-USA-Laborbankkonto ohne echte Bankdaten; Zahlungsjournal-Fit, Bank Account Posting Group, Ausgleich und Bankabstimmung bleiben offen.
- `PAYMENTS-004` ist als read-only Zahlungsjournal-Readiness gelaufen: `BANK-RM-01` ist live in Bank Accounts sichtbar; Cash Receipt Journal ist erreichbar und zeigt Posting Date, Document Type/No., Account Type/No., Amount, Bal. Account, Apply Entries, Journal Check und `Post`. `Preview Posting` ist in diesem Lauf nicht sichtbar. Der Lauf hat keine Journalzeile erstellt, keine Zahlung gebucht, keinen OP ausgeglichen und keine Bankabstimmung geoeffnet.
- `PAYMENTS-005` ist als UI-only Draft-Lauf gelaufen: Cash Receipt Journal wurde in der UI gefuellt mit `D10000`, `PAY005-*`, Betrag `-68.000`, Gegenkonto `BANK-RM-01`, Applies-to Doc. Type `Invoice` und Applies-to Doc. No. `PS-INV103297`; der Entwurf wurde ueber UI wieder geloescht. Journal Check meldete `1 Issue`: `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten...`; deshalb keine Zahlungsfreigabe.
- `PAYMENTS-006` ist als UI-only Amount-Validierung gelaufen: derselbe Draft wurde ueber UI wiederholt, erst mit Rohzahl `-68000`, dann mit lokalem Format `-68.000,00`. Das lokale Format loest den Amount-Fehler zwischenzeitlich und zeigt vor Refresh `0 Issues`; nach Refresh meldet BC aber den naechsten Setup-Blocker: `'Bank Account Posting Group' ist nicht vorhanden. Identifizierende Felder und Werte: Code=''`. Draft wurde bereinigt; keine Zahlung, kein OP-Ausgleich.
- `PAYMENTS-007` ist als UI-only Bankkonto-Posting-Fit gelaufen: Bankkarte `BANK-RM-01` ist ueber die UI geoeffnet, `Bank Acc. Posting Group = CHECKING` ist persistiert und der alte Bank-Posting-Group-Fehler ist im Cash Receipt Journal verschwunden. Der nicht buchende Draft fuer `D10000`/`PS-INV103297` zeigt danach aber weiter `1 Issue`: `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten...`. Draft wurde bereinigt; keine Zahlung, kein OP-Ausgleich, keine Bankabstimmung.
- `PAYMENTS-008` ist als UI-only Amount-/Journal-Check-Diagnose in breiter Ansicht gelaufen: derselbe Cash-Receipt-Draft fuer `D10000`/`PS-INV103297` mit `BANK-RM-01` wurde vorbereitet, Amount-Feld und `Amount ($)` wurden getrennt dokumentiert. Nach erneutem Amount-Fokus und `Refresh` zeigt `Journal Check` `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` und `Current line: No issues found`. Der Entwurf wurde bereinigt; keine Zahlung, kein OP-Ausgleich, keine Bankabstimmung.
- `PAYMENTS-009` ist als UI-only Apply-/Preview-Readiness gelaufen: derselbe Cash-Receipt-Draft `D10000`/`PS-INV103297`/`BANK-RM-01` wurde mit Betrag `-68.000,00` vorbereitet, `Journal Check = 0 Issues` bestaetigt, `Applies-to Doc. No. = PS-INV103297` dokumentiert und `Apply Entries` read-only geoeffnet. Der Apply-Kontext zeigt `D10000`, `EUR`, `Remaining Amount` und `Amount to Apply`; sichtbare riskante Aktionen wie `Post`/`OK` wurden nicht geklickt. `Preview Posting` war im Journal nicht direkt sichtbar. Der Entwurf wurde bereinigt; keine Zahlung, kein OP-Ausgleich, keine Bankabstimmung.
- Queue-Hinweis: Aeltere Prompts, die `PAYMENTS-008` noch als offenen Amount-Blocker behandeln, sind ueberholt. `evidence/payments-008/PAYMENTS-008-AMOUNT-DIAGNOSTIC.md` fasst den geloesten Blocker zusammen; `PAYMENTS-010` bleibt der naechste sinnvolle Payments-Schritt.
- `PAYMENTS-010` ist als UI-only Posting-Readiness gelaufen: derselbe Cash-Receipt-Draft wurde erneut mit `Journal Check = 0 Issues` vorbereitet, Apply Entries read-only geoeffnet, `Preview Posting` blieb direkt nicht sichtbar, und `Post` oeffnete einen Bestaetigungsdialog mit `Ja`/`Nein`. Der Test klickte `Nein`, bestaetigte keine Buchung und bereinigte den Draft. Keine Zahlung, kein OP-Ausgleich, keine Bankposten, keine Bankabstimmung.
- `PAYMENTS-010` wurde danach als Buch-/Evidence-Sync nachgezogen: Kapitel 19/20 markiert die Zahlungsuebung jetzt explizit als deutsches Zielbild, waehrend der aktuelle `RM-DEMO`-Laborstand nur bis Journalzeile, Apply-Readiness, `Journal Check = 0 Issues` und Post-Dialog mit Abbruch reicht. `PAYMENTS-010-BOOK-SYNC.md` dokumentiert diese Trennung.
- `PAYMENTS-EVIDENCE-PACK-SYNC.md` ordnet `PAYMENTS-001` bis `PAYMENTS-010` als zusammenhaengende Lernkette: offener Posten, Zahlungsjournal-Draft, lokales Amount-Format, Bankgegenkonto, Journal Check, Apply Entries, Post-Dialog und bewusster Abbruch. Das ist ein Buch-/Evidence-Sync ohne neuen BC-Lauf und ohne Zahlung.
- `POSTING-TRACE-001` ordnet die bereits gebuchten Laborbelege `PS-INV103297`, `108219` und `INV008-899959` als gemeinsame Anfaenger-Lernkette: Debitoren-/Kreditorenposten beantworten OP-Fragen, Sachposten die Kontenwirkung, Artikelposten die Menge, Wertposten Kosten/Wert und Berichte die Auswertung. Keine neue BC-Ausfuehrung und keine neue Buchung.
- `REPORTING-005` ist als read-only Reporting-Probe gelaufen: `Dimensions - Detail` wurde ueber Tell-Me in `RM-DEMO` nicht sichtbar erreicht. Der Lauf bucht nichts, aendert kein Setup und erzeugt einen Labor-Negativbefund mit Screenshot-/Text-Evidence. Damit ist der einfache `Dimensions - Detail`-Suchpfad kein belastbarer Buchbildpfad; naechster Hebel ist ein alternativer UI-Einstieg ueber Berichtssuche/`Analysis by Dimensions` oder Data Analysis Mode auf `G/L Entries`.
- `REPORTING-006` ist als read-only Reporting-Probe gelaufen: `G/L Entries` zur gebuchten Verkaufsrechnung `PS-INV103297` sind sichtbar und zeigen die Hauptbuchspur; ein belastbarer Data-Analysis-/Analysemodus-Hebel wurde in diesem G/L-Entries-Kontext aber nicht sichtbar erreicht. `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` bleiben in Sachposten/Data-Analysis nicht sichtbar. Keine Buchung, kein Setup, kein deutscher Finalnachweis.
- `REPORTING-007` ist als read-only Reporting-Probe gelaufen: Tell-Me findet `Analysis by Dimensions`, aber der Ziel-/Request-/Analysezustand wurde in `RM-DEMO` nicht belastbar geoeffnet. `PRODUCTLINE`, `CHANNEL`, `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, Matrix-/Show-Matrix- oder Datumsfilter-Kontext sind nicht sichtbar. Keine Buchung, kein Setup, kein deutscher Finalnachweis.
- `REPORTING-008` ist als Readiness-/Buch-Sync ohne BC-Lauf dokumentiert: Die einfachen read-only Reportingpfade sind ausgeschoepft; vorhandene `REVENUE` Analysis View nutzt nicht `PRODUCTLINE`/`CHANNEL`; naechster echter Reporting-Hebel ist ein freigegebener idempotenter Analysis-View-Fit. Keine Setup-Aenderung und keine Buchung.
- `REPORTING-009` ist als read-only Sachposten-Dimensionsprobe gelaufen: `G/L Entries` zur `PS-INV103297` sind in breiter Ansicht sichtbar, FactBox wurde eingeklappt, und die Liste zeigt `Department Code` sowie `Customergroup Code`. `Entry` -> `Dimensions` wurde trotz `Weitere Optionen` nicht sichtbar erreicht; `PRODUCTLINE`/`CHANNEL` bleiben im Sachposten-/Reportingkontext unsichtbar. Keine Buchung, kein Setup, kein deutscher Finalnachweis.
- `REPORTING-010` ist als Buch-/Evidence-Sync ohne BC-Lauf dokumentiert: `BOOK-EVIDENCE-WORKPLAN.md`, `BOOK-TO-EVIDENCE-AUDIT.md`, `MASTERDATA-BACKLOG.md`, `UI-INVENTORY.md` und die relevante Buchstelle fuehren `REPORTING-009` jetzt nicht mehr als offene Suchaufgabe, sondern als Labor-Teil-/Negativbefund. Naechster Reporting-Hebel bleibt nur mit ausdruecklicher Freigabe ein Analysis-View-Fit fuer `PRODUCTLINE`/`CHANNEL`; ohne Freigabe keinen gleichen read-only Reportingpfad wiederholen.
- `TAX-001` ist als Buch-/Evidence-Sync ohne BC-Lauf dokumentiert: O2C `PS-INV103297` und P2P `108219` bleiben CRONUS-USA-Laborbelege mit `0 %` Tax; `Tax Group Code = FURNITURE` ist kein deutscher VAT19-Code. Der naechste Steuerhebel ist nur mit Setup-/Umgebungsfreigabe ein UI-first DE-VAT-Ziellauf mit VAT Business/Product Posting Groups, VAT Posting Setup, Preview und VAT Entries.
- `POSTING-TRACE-002` ist als Buch-/Evidence-Sync ohne BC-Lauf dokumentiert: Kapitel 11 nutzt jetzt vorhandene O2C-Screenshotdateien, beschreibt `Preview Posting` als nach `MASTERDATA-009` erfolgreichen Laborzustand, trennt `68.000 EUR` Laborbetrag von deutschem `80.920 EUR` Zielbild und erklaert Debitorenposten, Sachposten, Wertposten, Artikelposten und Reportinggrenze als Kontrollfragen fuer Anfaenger. Keine neue Buchung, keine Zahlung, kein Setup.
- `FIXEDASSETS-001` ist als read-only Anlagen-Readiness gelaufen: Tell-Me zeigt `Fixed Assets` und `FA Ledger Entries` als Einstiegskontexte; `Depreciation Books` und `FA Posting Groups` wurden mit den englischen Suchbegriffen nicht belastbar sichtbar erreicht. Keine Anlage `FA-CNC-01`, kein AfA-Buch `HGB`, keine FA Posting Group `MACHINES`, keine Aktivierung, keine AfA und keine Anlagenposten.
- `FIXEDASSETS-002` ist als read-only Zielwert-/Suchpfadlauf gelaufen: deutsche/BC-nahe Suchbegriffe `Anlagen`, `AfA`, `Anlagenbuchungsgruppen`, `Einkaufsrechnungen` und `Anlagenposten` liefern Tell-Me-/Suchkontext-Evidence. Der Lauf fand den alten Widerspruch `120.000 EUR` im Buch vs. `250.000` in `resources-assets-projects.json`; danach wurde die Testdatendatei auf das mehrfach konsistente Buchziel `120000` harmonisiert. Keine BC-Einrichtung und keine Buchung.
- `FIXEDASSETS-003` ist als wiederholter read-only Seitenoeffnungslauf gelaufen: direkte Page-ID-Kandidaten fuer `Fixed Assets`/Anlagenliste `5601`, `Depreciation Books`/AfA-Buecher `5611`, `Purchase Invoices`/Einkaufsrechnungen `9308` und `FA Ledger Entries`/Anlagenposten `5604` sind labor-candidate. Der direkte Page-ID-Kandidat `5606` fuer `FA Posting Groups` ist rejected, weil der sichtbare Kontext `FA Ledger Entries Preview` zeigt. Keine Anlage, kein Setup, keine Einkaufsrechnung, keine AfA, keine Buchung.
- `FIXEDASSETS-004` ist als read-only Setup-Readiness gelaufen: gefilterte Zielseiten zeigen, dass `FA-CNC-01`, AfA-Buch `HGB`, Anlagenbuchungsgruppe `MACHINES` und Kreditor `K30000` in `RM-DEMO` nicht sichtbar sind; `Purchase Invoices` ist als Zugangspfad erreichbar. Tell-Me zeigt zwar `FA Posting Groups`, der Klickversuch erreichte aber keinen belastbaren Zielkontext. Keine Anlage, kein Setup, keine Einkaufsrechnung, keine AfA und keine Buchung.
- `FIXEDASSETS-005` hat den wackligen Pfad aus `FIXEDASSETS-004` read-only geklaert: Tell-Me zeigt `FA Posting Groups`, der UI-Klick erreicht jetzt die Seite `FA Posting Groups` mit vorhandenen CRONUS-Gruppen wie `GOODWILL`, `PLANT`, `PROPERTY`, `VEHICLES` sowie sichtbaren Aktionen `Neu`/`Liste bearbeiten`. `MACHINES` ist weiterhin nicht sichtbar. Keine Anlagenbuchungsgruppe wurde angelegt oder bearbeitet; keine Anlage, keine Einkaufsrechnung, keine AfA und keine Buchung.
- `FIXEDASSETS-006` liest die vorhandenen CRONUS-Konten in `FA Posting Groups` read-only: `EQUIPMENT = 12210/82000`, `GOODWILL = 11300`, `PLANT = 12110/81000`, `PROPERTY = 12130/81000`, `VEHICLES = 12230/82000`. Das ist Setup-Vorbereitung, kein deutscher Kontenplan-Endstand und kein `MACHINES`-Fit.
- `GOVERNANCE-003` synchronisiert die nach `FIXEDASSETS-006` noch veralteten naechsten Schritte in Gate-, Backlog- und Findings-Doku: Ohne Freigabe ist jetzt ueberall `FIXEDASSETS-007` als read-only-Lauf fuer AfA-Buecher/Depreciation Books und Anlagenklassen gesetzt. Keine BC-Ausfuehrung, keine Setup-Aenderung, keine Buchung.
- `FIXEDASSETS-007` liest AfA-Buecher/Depreciation Books und Anlagenklassen read-only: `Depreciation Books` Page `5611` zeigt `COMPANY = Company Book`, aber kein `HGB`; `FA Classes` Page `5615` zeigt `FINANCIAL`, `INTANGIBLE`, `TANGIBLE`. Kein AfA-Buch, keine Anlagenklasse, keine Anlage, keine Einkaufsrechnung, keine AfA und keine Buchung wurden angelegt oder geaendert.
- `FIXEDASSETS-008` synchronisiert Kapitel 21 ohne neuen BC-Lauf mit dieser Readiness-Kette. Die Buchstelle trennt jetzt Buchziel (`FA-CNC-01`, `HGB`, `MACHINES`, `K30000`, Zugang, AfA) vom aktuellen `RM-DEMO`-Laborbefund (`COMPANY`, FA Classes `FINANCIAL`/`INTANGIBLE`/`TANGIBLE`, vorhandene CRONUS-FA-Posting-Groups). Kein Setup, keine Anlage, keine Einkaufsrechnung, keine AfA und keine Anlagenposten.
- `WAREHOUSE-001` ist als read-only Warehouse-Readiness gelaufen: `FRA-ZL` ist als Location sichtbar; Warehouse-Aktivierungsmarker wie `Bin Mandatory`, `Require Receive`, `Require Shipment`, `Require Put-away`, `Require Pick` und `Directed Put-away and Pick` sind im Laborbild nicht sichtbar. Tell-Me zeigt `Warehouse Receipts`, `Warehouse Put-aways`, `Warehouse Picks` und `Bins` als Einstiegspfade; `Warehouse Shipments` wurde nicht belastbar sichtbar. Keine Warehouse-Aktivierung, keine Bins, keine Lageraktivitaet und keine Buchung.
- `WAREHOUSE-002` ist als Buch-/Evidence-Sync erledigt: Kapitel 13 enthaelt jetzt eine Statusbox, die Buchziel, RM-DEMO-Laborbefund, Warehouse-Readiness, Nichtbehauptungen, Gate und deutschen Finalnachweis trennt. Kein BC-Lauf, kein Setup und keine Buchung in diesem Sync.
- `MANUFACTURING-001` ist als read-only Manufacturing-/Assembly-Readiness gelaufen: `Planning Worksheet`, `Production BOMs`, `Routings`, `Released Production Orders`, `Consumption Journal` und `Output Journal` sind ueber Tell-Me sichtbar; `Assembly Orders` ist in diesem Lauf kein belastbarer Suchtreffer. Die Artikel `RM-M100` und `RAW-STEEL` sind sichtbar, `COMP-CTRL` und `KIT-MAINT` nicht. Der Lauf hat keine Production BOM, kein Routing, keinen Fertigungsauftrag, keinen Montageauftrag, keinen Verbrauch, keinen Output und keine Buchung angelegt.
- `MANUFACTURING-002` ist als Buch-/Evidence-Sync erledigt: Kapitel 14 trennt jetzt Buchziel `PROD-3001` von der aktuellen `RM-DEMO`-Readiness. Das Buch erklaert, dass sichtbare Manufacturing-Seiten noch keine Produktionsfaehigkeit beweisen, dass `COMP-CTRL`/`KIT-MAINT`, BOM/Routing und Auftrag fehlen, und dass `INV008-899959` nur Trainingsbestand statt Manufacturing-Output ist. Kein BC-Lauf, kein Setup und keine Buchung in diesem Sync.
- `SCOPE-001` streicht Shopify/Online Store als aktives Buch-5-Thema: Kapitel 17, Testdaten, Backlog und Datenluecken zeigen jetzt Dropshipping/Sonderverkauf statt Shopify-Connector, Shopauftrag `WEB-24001` oder `CHANNEL=SHOP`. Keine BC-Ausfuehrung und keine Buchung.

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

Als naechstes gezielt `AUTOPILOT-STATE.json` und `POSTING-AND-SETUP-GATES.md` beachten. `FIXEDASSETS-008`, `WAREHOUSE-002`, `MANUFACTURING-002`, `SERVICE-001`, `SERVICE-002`, `PROJECTS-001`, `PROJECTS-002`, `DROPSHIPPING-001`, `DROPSHIPPING-002`, `INTERCOMPANY-001` und `INTERCOMPANY-002` sind erledigt. Ohne ausdrueckliche Gate-Freigabe bleiben Fixed Assets fuer Setup und Buchung, Warehouse-Aktivierung, Manufacturing-/Assembly-Setup oder -Buchung, Service-/Project-Setup oder -Buchung, Dropshipping-Auftrag/Bestellung/Buchung sowie Intercompany-/Ausland-Setup und -Belege gesperrt. Ohne Gate jetzt `COMPLIANCE-001-READINESS` waehlen: Kapitel 22/E-Rechnung/Compliance nur read-only gegen RM-DEMO pruefen, keine Steuer-/E-Rechnungs-Einrichtung aendern und keine Buchung. Payments nur nach Payment-Gate, Reporting nur nach Analysis-View-Gate, Steuer nur nach DE-VAT-Gate, Warehouse-Aktivierung/Manufacturing/Service/Projects/Dropshipping/Intercompany nur nach eigenem Gate. Shopify/Online Store ist kein naechster Prozessblock mehr; Kapitel 17 wird nur als Dropshipping/Sonderverkauf ohne Connector-Scope bearbeitet. `PAYMENTS-010` und `PAYMENTS-EVIDENCE-PACK-SYNC.md` haben den Zahlungsweg bis zur letzten Sicherheitsgrenze didaktisch geschlossen; `POSTING-TRACE-001` und `POSTING-TRACE-002` haben die gebuchten O2C-/P2P-/Inventory-Postenspuren als Anfaenger-Lernatlas und konkrete O2C-Buchstelle verbunden. `REPORTING-009` hat den letzten einfachen Sachposten-Dimensionsversuch read-only abgeschlossen: Shortcut-Spalten ja, `PRODUCTLINE`/`CHANNEL` nein. `TAX-001` hat die deutsche USt-Grenze als Readiness geklaert: ohne Freigabe kein `VAT19`-Setup und keine neue 19-%-Buchung.

Letzter Payments-Sync ohne BC-Ausfuehrung: Kapitel 19/20 und `evidence/payments-010/` trennen jetzt deutsches Zielbild (`SO-1001`, `80.920 EUR`, final offen) vom Laborbeleg (`PS-INV103297`, `68.000 EUR`, Post-Dialog abgebrochen). Aeltere Prompts, die PAYMENTS-004 bis PAYMENTS-008 als naechsten Schritt nennen, sind ueberholt.

1. `080-posting-result.json` und `082-posting-entry-trace.json` lesen.
2. Die Postenspur nicht erneut buchen; `PS-INV103297` ist der Laborbeleg.
3. O2C ist im CRONUS-Labor bis gebuchte Rechnung, Postenspur, Artikelposten und Artikelposten-Dimension nachgewiesen.
4. Stammdaten- und Setup-Folgearbeit aus `MASTERDATA-BACKLOG.md` ableiten, damit neue Prozesse nicht mit fehlenden Kreditoren, Artikeln, Dimensionswerten, Posting Groups oder Tax/VAT-Annahmen starten.
5. `UAT-P2P-001` ist nach Readiness und Preview genau einmal im Labor gebucht: Bestellung `106049`, gebuchte Einkaufsrechnung `108219`, `Receive and Invoice`; Postenspur ist read-only belegt. Keine zweite P2P-Buchung ohne neuen ausdruecklichen Grund.
6. `INVENTORY-001` hat O2C- und P2P-Inventory-Spuren read-only zusammengefuehrt. `INVENTORY-002` hat danach `Inventory Valuation` mit Datum, Artikel- und Lagerortfilter als Zahlenbericht nachgewiesen. `INVENTORY-003` erklaert den negativen `RM-M100`-Wert als Bestands-/Kostenketten-Lernfall. `INVENTORY-004` legt den Zielbestandsplan fest. `INVENTORY-005` bis `INVENTORY-007` belegen Item-Journal-Einstieg, Draft, Dimension und Journal Check. `INVENTORY-008` hat die positive Laborbuchung genau einmal ausgefuehrt und Postenspur plus korrigierte Inventory Valuation gesichert. Nicht erneut buchen.
7. `REPORTING-002` hat Financial Reports und O2C-Posten read-only geprueft: `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `Entry No. 792` sichtbar, aber nicht in den aktuellen Sachposten-/Financial-Reports-Texten. `REPORTING-003` hat den sichtbaren Hebel `Definitions -> Dimension Perspective` versucht; dieser fuehrte im Labor nicht zu einer sichtbaren Dimensionsperspektive. `REPORTING-004` zeigt: Die vorhandene `REVENUE` Analysis View nutzt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, nicht `PRODUCTLINE`/`CHANNEL`. `REPORTING-005` zeigt: `Dimensions - Detail` wird ueber Tell-Me nicht sichtbar erreicht. `REPORTING-006` zeigt: gefilterte `G/L Entries` zur Rechnung `PS-INV103297` sind sichtbar, aber Data Analysis wird dort nicht belastbar erreicht und `PRODUCTLINE`/`CHANNEL` sind nicht sichtbar. `REPORTING-007` zeigt: `Analysis by Dimensions` ist als Suchpfad sichtbar, aber der Analysezustand mit Ziel-Dimensionen wurde nicht belastbar erreicht. `REPORTING-009` zeigt: die breite Sachpostenliste zeigt einzelne Shortcut-Dimensionsspalten (`Department Code`, `Customergroup Code`), aber keinen sichtbaren `Entry` -> `Dimensions`-Dialog und keine `PRODUCTLINE`-/`CHANNEL`-Werte. Naechster Reporting-Hebel ist deshalb ein kontrollierter Setup-Fit fuer eine passende Analysis View oder ein alternativer offizieller Reporting-Einstieg; beides braucht eigene Freigabe, wenn Setup veraendert wird.
8. `PAYMENTS-001` beweist offene Debitoren-/Kreditorenposten als Startpunkt fuer OP-Ausgleich. `PAYMENTS-002` beweist Bankkonten-, Cash-Receipt-Journal-, Payment-Journal- und Apply-Entries-Readiness. `PAYMENTS-003` beweist `BANK-RM-01` als Laborbankkonto, aber nicht als Buch-Klickpfad. `PAYMENTS-004` beweist Cash Receipt Journal Pflichtfelder, Gegenkonto-/Ausgleichshinweise und Journal Check read-only. `PAYMENTS-005` beweist die UI-Draft-Anlage und UI-Cleanup. `PAYMENTS-006` zeigt Amount-Format und danach den Bank-Posting-Group-Blocker. `PAYMENTS-007` fittet `BANK-RM-01` auf `CHECKING`. `PAYMENTS-008` zeigt den Draft nach Amount-Fokus/Refresh mit `Journal Check = 0 Issues`. `PAYMENTS-009` beweist Apply-Entries-Readiness read-only aus dem Draft und zeigt, dass `Preview Posting` nicht direkt sichtbar ist. `PAYMENTS-010` beweist den Post-Bestaetigungsdialog und Abbruch mit `Nein`. Offen bleiben echte Zahlung, OP-Ausgleich, Bankposten und Bankabstimmung.
9. Deutsche `19 %`-USt bleibt davon getrennt offen.
10. `FIXEDASSETS-001` beweist nur erste Anlagen-Einstiegspfade ueber Tell-Me. `FIXEDASSETS-002` klaert danach deutsche/BC-nahe Suchpfade und harmonisiert den Testdatenbetrag auf das Buchziel `120.000 EUR`. Offen bleiben robuste Seitenoeffnungen, Anlagenkarte, AfA-Buch, FA Posting Group, Einkauf/Aktivierung, AfA und Anlagenpostenspur.

Synchronisationsstand nach der letzten Projektwahrheits-Pruefung:

- Praktisch nachgewiesen: O2C-Kopf, Verkaufszeile, EUR, `PRODUCTLINE=MACHINE` im Zeilendimensionsdialog, Preview Posting mit Vorschauzeilen, G/L-Preview-Drilldown mit Konto `14140`, Inventory-Posting-Setup-Zeile `FRA-ZL` + `RESALE`, Laborfit `Inventory Account = 14140`.
- Labor-Nachweis: alle aktuellen O2C-, MASTERDATA-008- und MASTERDATA-009-Bilder/Evidence gelten fuer CRONUS USA / gemischte UI; `MASTERDATA-009` ist ein Labor-Setup-Fit, kein deutscher Kontenplan-Endstand.
- Labor-Buchungsfreigabe: `070-lab-posting-readiness.md` wurde genutzt; genau eine CRONUS-USA-Laborbuchung ist erfolgt (`S-ORD101068` -> `PS-INV103297`). Nicht erneut buchen.
- Finaler DE-Nachweis offen: deutsche Oberflaeche, 19-%-USt, deutsche Buchung und deutsche Postenspur.
- Blockiert/offen: kein Inventory-Posting-Setup-Blocker mehr; direkter Artikelposten-Check ist geloest ueber `Item Ledger Entry No. = 792`; `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten nachgewiesen; `Inventory Valuation` ist als Labor-Zahlenbericht nachgewiesen, der negative `RM-M100`-Wert ist als Laborfolge erklaert, und `INVENTORY-008` hat den positiven `RM-M100 +2`-Laborzugang mit Postenspur und korrigierter Lagerbewertung gebucht. `WAREHOUSE-001` zeigt, dass `FRA-ZL` aktuell als einfacher Lagerort gelesen werden kann; gesteuerte Warehouse-Logik bleibt nicht aktiviert und gatepflichtig. `MANUFACTURING-001` zeigt Manufacturing-Einstiege und vorhandene Basisartikel, aber keine BOM-/Routing-/Assembly-/Production-Readiness fuer Buchung: `COMP-CTRL` und `KIT-MAINT` fehlen im Labor und `Assembly Orders` ist nicht belastbar sichtbar. Reporting-Seiten und Analysepfade sind erreichbar oder suchbar, aber `REPORTING-003` bis `REPORTING-009` liefern noch keinen belastbaren `PRODUCTLINE`-/`CHANNEL`-Auswertungsnachweis; der einfache Sachposten-Dimensionsdialog ist als UI-Laborpfad ebenfalls negativ/teilweise: Shortcut-Spalten sichtbar, Zielwerte nicht. Offen bleiben Steuer-/VAT-Fit, Reporting-Auswertungsnachweis, finale deutsche Nachweise sowie spaetere Warehouse-Aktivierung-/Manufacturing-Prozesse.
- Dimensionen: O2C-Kerndimensionen und Default Dimensions sind praktisch nachgewiesen; vollstaendige Buchstandard-Dimensionsmatrix ist noch nicht fertig.
- Nicht geprueft: echte Zahlung, OP-Ausgleich, gebuchte Bankwirkung, Bankabstimmung, deutsche P2P-19-%-Vorsteuer, P2P-Dimensionen in Posten und echte Financial-Reports-Zahlenwirkung nach Dimension. Die offenen Debitoren-/Kreditorenposten als Payments-Startpunkt sind seit `PAYMENTS-001` belegt; Cash Receipt Journal, Payment Journal und Apply-Entries-Pfade sind seit `PAYMENTS-002` belegt; `BANK-RM-01` ist seit `PAYMENTS-003` als Laborbankkonto vorhanden; Cash Receipt Journal Pflichtfelder und Journal Check sind seit `PAYMENTS-004` read-only belegt; `PAYMENTS-005` zeigt den UI-Draft; `PAYMENTS-006` zeigt Amount-Format und Bank-Posting-Group-Blocker; `PAYMENTS-007` loest den Bank-Posting-Group-Blocker ueber `BANK-RM-01 = CHECKING`; `PAYMENTS-008` zeigt `Amount = -68.000,00`, `Amount ($) = -67.673,60` und `Journal Check = 0 Issues` nach Refresh; `PAYMENTS-009` zeigt den Apply-Entries-Kontext aus dem zahlungsreifen Draft, aber keine direkte `Preview Posting`-Aktion; `PAYMENTS-010` zeigt den Post-Dialog mit `Ja`/`Nein` und Abbruch. Die praktische positive `RM-M100`-Bestandsbewegung ist seit `INVENTORY-008` als CRONUS-USA-Laborbuchung belegt; offen bleibt nur der finale deutsche Nachweis.
- Anlagen: `FIXEDASSETS-001`/`FIXEDASSETS-002` sind Labor-Readiness; `FIXEDASSETS-003` oeffnet direkte Zielseiten read-only; `FIXEDASSETS-004` prueft die Zielwerte gefiltert; `FIXEDASSETS-005` erreicht `FA Posting Groups` ueber die UI; `FIXEDASSETS-006` liest vorhandene CRONUS-Konten in diesen Gruppen; `FIXEDASSETS-007` liest AfA-Buecher und FA Classes. Praktisch sichtbar sind Anlagenliste `5601`, AfA-Buecher `5611`, FA Classes `5615`, Einkaufsrechnungen `9308`, Anlagenposten `5604` und die Seite `FA Posting Groups`. `Purchase Invoices` bleibt als Zugangspfad erreichbar. Nicht sichtbar sind weiter `FA-CNC-01`, `HGB`, `MACHINES` und `K30000`. Sichtbar sind `COMPANY` als Depreciation Book sowie `FINANCIAL`, `INTANGIBLE`, `TANGIBLE` als FA Classes. Offen bleiben UI-Setup-Fit fuer `MACHINES`, Anlage/Kreditor/AfA-Buch, Aktivierung, AfA-Buchung, Anlagenpostenspur fuer `FA-CNC-01` und deutscher Anlagen-Endstand.

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
| `playwright/projects/fibu-book5/AUTOPILOT-STATE.json` | maschinenlesbarer Autopilot-Status mit Sandbox, Company, letzten Laborbuchungen, Locks und naechstem Schritt |
| `playwright/projects/fibu-book5/POSTING-AND-SETUP-GATES.md` | Freigabe-Gates fuer Setup-Aenderungen, Zahlungen, neue Companies und Wiederholungsbuchungen |
| `playwright/projects/fibu-book5/testdata/sales/uat-o2c-001.json` | Zielwerte fuer O2C |
| `playwright/projects/fibu-book5/tests/uat-o2c-001-sales-order.spec.ts` | aktueller O2C-Test |
| `playwright/projects/fibu-book5/evidence/uat-o2c-001/README.md` | Evidence-Index fuer den aktuellen O2C-Laborlauf |
| `playwright/projects/fibu-book5/evidence/uat-o2c-001/O2C-LAB-FINAL-SYNC.md` | finaler O2C-Labor-Sync ohne neue Buchung |
| `playwright/projects/fibu-book5/evidence/inventory-001/INVENTORY-LAB-TRACE.md` | read-only Inventory Trace fuer O2C/P2P: Artikelposten, Wertposten, Sachposten, Artikelkarten, Lagerort, breite Layoutansicht |
| `playwright/projects/fibu-book5/evidence/inventory-002/INVENTORY-VALUATION.md` | read-only Lagerbewertungsbericht mit Stichtag, Item-/Location-Filter, Laborzahlen und negativem RM-M100-Lernfall |
| `playwright/projects/fibu-book5/evidence/inventory-003/INVENTORY-NEGATIVE-RM-M100.md` | read-only Erklaerung des negativen RM-M100-Laborwerts aus O2C-/P2P-Postenspur |
| `playwright/projects/fibu-book5/evidence/inventory-004/RM-M100-TARGET-STOCK-PLAN.md` | Planungs-/Readiness-Nachweis fuer positiven RM-M100-Zugang vor finalen Buchbildern |
| `playwright/projects/fibu-book5/evidence/inventory-005/INVENTORY-005-TARGET-STOCK-READINESS.md` | read-only Nachweis fuer `Item Journals`/Page `40` als Einstieg in den geplanten positiven RM-M100-Trainingsbestand; keine Buchung |
| `playwright/projects/fibu-book5/evidence/inventory-006/INVENTORY-006-TARGET-STOCK-DRAFT.md` | kontrollierter Item-Journal-Draft `RM-M100 +2` in `FRA-ZL` mit `PRODUCTLINE=MACHINE`; keine Buchung, Cleanup erfolgreich |
| `playwright/projects/fibu-book5/evidence/inventory-008/README.md` | Evidence-Index fuer die kontrollierte positive `RM-M100 +2`-Laborbuchung `INV008-899959`, Postenspur und korrigierte Inventory Valuation |
| `playwright/projects/fibu-book5/evidence/inventory-008/INVENTORY-008-SYNC.md` | Sync-Zusammenfassung fuer Trainings-/Opening-Balance-Zugang, Postenarten, Laborgrenzen und Buchwirkung |
| `playwright/projects/fibu-book5/evidence/warehouse-001/README.md` | Evidence-Index fuer Warehouse-Readiness: `FRA-ZL`, Warehouse-Einstiege, Gate-Grenzen, keine Aktivierung und keine Buchung |
| `playwright/projects/fibu-book5/evidence/warehouse-002/README.md` | Evidence-Index fuer Buch-/Evidence-Sync zu Kapitel 13: einfacher Lagerort vs. gesteuerte Warehouse-Logik, Gate-Grenze und naechster read-only Schritt |
| `playwright/projects/fibu-book5/evidence/payments-001/README.md` | Evidence-Index fuer offene Debitoren-/Kreditorenposten als read-only Startpunkt fuer Payments/OP-Ausgleich; keine Zahlung und kein Ausgleich |
| `playwright/projects/fibu-book5/evidence/payments-002/README.md` | Evidence-Index fuer Bank-/Journal-/Apply-Readiness; `BANK-RM-01` fehlt, keine Zahlung, kein Ausgleich, keine Journalzeile |
| `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-READINESS.md` | Governance-Gate vor Payments/OP: trotz sichtbarer Journale und Apply Entries bleibt Zahlung/Ausgleich gesperrt, bis `BANK-RM-01` gefittet oder ein CRONUS-Bankkonto bewusst freigegeben ist |
| `playwright/projects/fibu-book5/evidence/payments-003/README.md` | Evidence-Index fuer den idempotenten Bankkonto-Fit `BANK-RM-01`; keine Zahlung, kein Ausgleich, keine Bankabstimmung |
| `playwright/projects/fibu-book5/evidence/payments-004/README.md` | Evidence-Index fuer Cash Receipt Journal Readiness mit `BANK-RM-01`; Pflichtfelder, Journal Check und Sicherheitsgrenzen; keine Journalzeile, keine Zahlung, kein Ausgleich |
| `playwright/projects/fibu-book5/evidence/reporting-005/README.md` | Evidence-Index fuer den read-only Negativbefund: `Dimensions - Detail` wurde ueber Tell-Me nicht sichtbar erreicht; keine Reportingwirkung, keine Buchung, kein Setup |
| `playwright/projects/fibu-book5/evidence/reporting-007/README.md` | Evidence-Index fuer den read-only Negativbefund: `Analysis by Dimensions` ist in Tell-Me sichtbar, aber nicht belastbar als Analysezustand mit `PRODUCTLINE`/`CHANNEL` erreicht; keine Buchung, kein Setup |
| `playwright/projects/fibu-book5/evidence/reporting-008/REPORTING-008-ANALYSIS-VIEW-FIT-READINESS.md` | Reporting-Readiness: naechster Hebel ist ein freigegebener Analysis-View-Fit fuer `PRODUCTLINE`/`CHANNEL`; keine Setup-Aenderung |
| `playwright/projects/fibu-book5/evidence/reporting-009/README.md` | Evidence-Index fuer den read-only Sachposten-Dimensionsbefund: breite `G/L Entries` zeigen `Department Code`/`Customergroup Code`, aber keinen sichtbaren `PRODUCTLINE`-/`CHANNEL`-Nachweis und keinen sichtbaren Dimensionsdialog; keine Buchung, kein Setup |
| `playwright/projects/fibu-book5/evidence/reporting-010/REPORTING-010-BOOK-SYNC.md` | Buch-/Evidence-Sync nach `REPORTING-009`: Reporting-read-only-Kette abgeschlossen, Sachposten-Dimensionspfad als Teil-/Negativbefund markiert, naechster echter Hebel nur mit Analysis-View-Freigabe |
| `playwright/projects/fibu-book5/evidence/tax-001/TAX-001-DE-VAT-READINESS.md` | Buch-/Evidence-Sync fuer Steuer: CRONUS-USA-Sales-Tax/`FURNITURE`/`0 %` von deutschem `19 %`-VAT-Ziel trennen; praktischer DE-VAT-Ziellauf bleibt freigabepflichtig |
| `playwright/projects/fibu-book5/evidence/payments-010/PAYMENTS-EVIDENCE-PACK-SYNC.md` | Evidence-Pack-Sync fuer `PAYMENTS-001` bis `PAYMENTS-010`: offener Posten, Journal-Draft, Journal Check, Apply Entries und Post-Dialog mit Abbruch; keine Zahlung |
| `playwright/projects/fibu-book5/evidence/posting-trace-001/POSTING-TRACE-LEARNING-ATLAS.md` | Buchungsspur-Lernatlas fuer O2C `PS-INV103297`, P2P `108219` und Inventory `INV008-899959`; keine neue Buchung |
| `playwright/projects/fibu-book5/evidence/posting-trace-002/POSTING-TRACE-BOOK-SYNC.md` | Buch-Sync fuer Kapitel 11: vorhandene O2C-Screenshotpfade, erfolgreiche Preview nach `MASTERDATA-009`, Laborbuchung `PS-INV103297` und Postenspur-Kontrollfragen; keine neue Buchung |
| `playwright/projects/fibu-book5/evidence/fixedassets-001/FIXEDASSETS-001-READINESS.md` | Anlagen-Readiness fuer Kapitel 21: Tell-Me-Einstiege sichtbar/negativ markiert, keine Anlage, kein Setup, keine Buchung; Zielbetrag wurde in `FIXEDASSETS-002` harmonisiert |
| `playwright/projects/fibu-book5/evidence/fixedassets-002/FIXEDASSETS-002-TARGET-PATHS.md` | Anlagen-Zielwert-/Suchpfad-Readiness: deutsche Suchbegriffe belegt, alter Betragswiderspruch erkannt; keine Anlage, kein Setup, keine Buchung |
| `playwright/projects/fibu-book5/evidence/fixedassets-002/FIXEDASSETS-002-SYNC.md` | Sync nach `FIXEDASSETS-002`: Testdaten fuer `FA-CNC-01` auf das Buchziel `120.000 EUR` harmonisiert; naechster Schritt sind gezielte UI-Seitenoeffnungen |
| `playwright/projects/fibu-book5/evidence/fixedassets-006/README.md` | Evidence-Index fuer read-only gelesene CRONUS-FA-Posting-Group-Konten; kein `MACHINES`-Fit, kein Setup, keine Buchung |
| `playwright/projects/fibu-book5/evidence/fixedassets-007/README.md` | Evidence-Index fuer read-only gelesene AfA-Buecher/Depreciation Books und FA Classes; kein `HGB`-Fit, keine Anlage, kein Setup, keine Buchung |
| `playwright/projects/fibu-book5/evidence/fixedassets-008/README.md` | Evidence-Index fuer Kapitel-21-Buch-Sync: Buchziel, Laborstand und Gate-Grenzen fuer `FA-CNC-01`, `HGB`, `MACHINES` und `K30000` getrennt |
| `playwright/projects/fibu-book5/evidence/manufacturing-002/README.md` | Evidence-Index fuer Kapitel-14-Buch-Sync: Manufacturing-Readiness, Datenluecken, Gate-Grenze und `INV008-899959` als Nicht-Manufacturing-Output |
| `playwright/projects/fibu-book5/evidence/service-001/README.md` | Evidence-Index fuer Kapitel-15-Readiness: Service-Einstiege sichtbar, `D10000` sichtbar, Zielobjekte `RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH`, `VAN-SERV` nicht sichtbar; keine Einrichtung und keine Buchung |
| `playwright/projects/fibu-book5/evidence/service-002/README.md` | Evidence-Index fuer Kapitel-15-Buch-Sync: Service-Seiten als Readiness, fehlende Zielobjekte als Setup-/Stammdatenluecke, `SERV-4001` als Zielpfad statt Labor-Endstand |
| `playwright/projects/fibu-book5/evidence/projects-001/README.md` | Evidence-Index fuer Kapitel-16-Readiness: Project-/Job-Einstiege sichtbar, `D10000` sichtbar, Zielobjekte `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02`, `PROJ-LAG` nicht sichtbar; keine Einrichtung, keine WIP, keine Faktura und keine Buchung |
| `playwright/projects/fibu-book5/evidence/projects-002/README.md` | Evidence-Index fuer Kapitel-16-Buch-Sync: sichtbare Project-/Job-Seiten als Readiness, fehlende Zielobjekte als Setup-/Stammdatenluecke, `PROJ-5001` als Zielpfad statt Labor-Endstand |
| `playwright/projects/fibu-book5/evidence/dropshipping-001/README.md` | Evidence-Index fuer Kapitel-17-Readiness: Sales-/Purchase-/Requisition-/Purchasing-Code-Einstiege sichtbar, `Drop Shipments` nicht stabil sichtbar, Zielobjekte `D11000`, `K20000`, `SP-PUMP-01` fehlen; keine Einrichtung, kein Auftrag, keine Bestellung und keine Buchung |
| `playwright/projects/fibu-book5/evidence/dropshipping-002/README.md` | Evidence-Index fuer Kapitel-17-Buch-Sync: `DS-24001` als Zielpfad, Readiness aus `DROPSHIPPING-001`, fehlende Zielobjekte, Gate-Grenze und Shopify-out-of-scope im Buch synchronisiert |
| `playwright/projects/fibu-book5/evidence/intercompany-001/README.md` | Evidence-Index fuer Kapitel-18-Readiness: IC-/VAT-/Waehrungs-Einstiege, fehlende Zieldebitoren, Mehr-Company-/Gate-Grenzen und keine Buchung |
| `playwright/projects/fibu-book5/evidence/intercompany-002/README.md` | Evidence-Index fuer Kapitel-18-Buch-Sync: `IC-7001` als Zielpfad, Readiness aus `INTERCOMPANY-001`, fehlende Zieldebitoren, Gate-Grenze und keine Buchung |
| `playwright/projects/fibu-book5/evidence/payments-005/README.md` | Evidence-Index fuer UI-only Cash-Receipt-Journal-Draft, UI-Cleanup und Amount-Validierungsfehler; keine Zahlung, kein Ausgleich |
| `playwright/projects/fibu-book5/evidence/payments-006/README.md` | Evidence-Index fuer UI-only Amount-Validierung im Cash Receipt Journal; Amount-Fehler geloest, Bank Account Posting Group als naechster Blocker; keine Zahlung, kein Ausgleich |
| `playwright/projects/fibu-book5/evidence/payments-007/README.md` | Evidence-Index fuer UI-only Bankkonto-Posting-Fit `BANK-RM-01 = CHECKING`; alter Bank-Posting-Group-Blocker weg, aktueller Journal-Check-Blocker ist wieder Amount; keine Zahlung, kein Ausgleich |
| `playwright/projects/fibu-book5/evidence/payments-008/README.md` | Evidence-Index fuer UI-only Amount-/Journal-Check-Diagnose in breiter Ansicht; `Journal Check = 0 Issues` nach Refresh; keine Zahlung, kein Ausgleich |
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
