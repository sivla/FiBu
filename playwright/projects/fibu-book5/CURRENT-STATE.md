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
| Dimensionen | `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP`; `DEPARTMENT` wiederverwendet |
| Dimensionswerte | `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES`, `LOCATION-GROUP=DIRECTED` |
| Lagerort | `FRA-ZL` existiert als einfacher Lagerort |
| Debitor | `D10000` / `Mueller Maschinenbau GmbH` existiert |
| Artikel | `RM-M100` / `Standardmaschine M100` existiert |
| Preis | Zielpreis `68.000` im Labor sichtbar |
| Waehrung | `EUR` ist am Debitor `D10000` gesetzt und im aktuellen `UAT-O2C-001`-Auftrag nachgewiesen |
| Steuer | deutsche `19 %` USt ist in dieser CRONUS-USA-Spielwiese nicht nachgewiesen |
| Dimension im Auftrag | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind im Zeilen-Dimensionsdialog nachgewiesen |
| Standarddimensionen-UI | Page `540` zeigt `PRODUCTLINE=MACHINE` am Artikel und `CHANNEL=B2B` am Debitor als UI-Laborbild |
| Buchungsvorschau und Laborbuchung | `Preview Posting` wurde nach `MASTERDATA-009` erneut erreicht und zeigt echte Vorschauzeilen: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`; danach wurde genau eine CRONUS-USA-Laborbuchung mit `Ship and Invoice` ausgefuehrt: Auftrag `S-ORD101068`, gebuchte Verkaufsrechnung `PS-INV103297` |
| Reporting / Financial Reports | `REPORTING-001` oeffnet `Financial Reports` read-only ueber Tell-Me in der Gruppe `Berichte und Analysen`; Liste zeigt u. a. `Balance Sheet`, `Income Statement` und `Revenue`; Dimensionsfilter/PRODUCTLINE-Summenwirkung ist noch offen |
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
- `FINDINGS.md`, Coverage, Workarounds, Screenshot-QA und Buchtext sind auf diesen Laborstand synchronisiert.

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
4. Reporting ist jetzt read-only bis zur Seite `Financial Reports` gestartet; als naechstes passenden Report oeffnen, breite/maximierte Ansicht nutzen und Dimensionsfilter fuer `PRODUCTLINE=MACHINE` suchen.
5. Deutsche `19 %`-USt bleibt davon getrennt offen.

Synchronisationsstand nach der letzten Projektwahrheits-Pruefung:

- Praktisch nachgewiesen: O2C-Kopf, Verkaufszeile, EUR, `PRODUCTLINE=MACHINE` im Zeilendimensionsdialog, Preview Posting mit Vorschauzeilen, G/L-Preview-Drilldown mit Konto `14140`, Inventory-Posting-Setup-Zeile `FRA-ZL` + `RESALE`, Laborfit `Inventory Account = 14140`.
- Labor-Nachweis: alle aktuellen O2C-, MASTERDATA-008- und MASTERDATA-009-Bilder/Evidence gelten fuer CRONUS USA / gemischte UI; `MASTERDATA-009` ist ein Labor-Setup-Fit, kein deutscher Kontenplan-Endstand.
- Labor-Buchungsfreigabe: `070-lab-posting-readiness.md` wurde genutzt; genau eine CRONUS-USA-Laborbuchung ist erfolgt (`S-ORD101068` -> `PS-INV103297`). Nicht erneut buchen.
- Finaler DE-Nachweis offen: deutsche Oberflaeche, 19-%-USt, deutsche Buchung und deutsche Postenspur.
- Blockiert/offen: kein Inventory-Posting-Setup-Blocker mehr; direkter Artikelposten-Check ist geloest ueber `Item Ledger Entry No. = 792`; `PRODUCTLINE=MACHINE` ist am Artikelposten nachgewiesen; Reporting-Seite ist erreichbar, aber Dimensionsfilter/Summenwirkung ist offen; offen bleiben Steuer-/VAT-Fit, Reporting-Auswertungsnachweis und finale deutsche Nachweise.
- Nicht geprueft: P2P, Zahlungen, Finanzbericht.

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
