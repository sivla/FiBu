# Current State fuer FiBu Buch 5

Stand: 07.06.2026

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
5. `playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md`
6. `playwright/FINDINGS.md`
7. relevante Buchstelle in `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md`

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
| Waehrung | `EUR` ist am Debitor `D10000` gesetzt und per MCP nachgewiesen |
| Steuer | deutsche `19 %` USt ist in dieser CRONUS-USA-Spielwiese nicht nachgewiesen |
| Dimension im Auftrag | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind im Zeilen-Dimensionsdialog nachgewiesen |
| Standarddimensionen-UI | Page `540` zeigt `PRODUCTLINE=MACHINE` am Artikel und `CHANNEL=B2B` am Debitor als UI-Laborbild |
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

Der vorherige fachliche O2C-Nachweis ist:

```text
7faa0d4 Document BC screenshot workflow and O2C evidence
```

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
PRODUCTLINE = MACHINE ist im Zeilen-Dimensionsdialog sichtbar.
19 % deutsche USt ist noch nicht erreicht.
```

Warum USt offen ist:

- Aktuelle Umgebung basiert auf CRONUS USA.
- Verkaufszeile zeigt `Tax Group Code = FURNITURE`.
- Debitor zeigt `Tax Liable = checked` und `Tax Area Code = leer`.
- `Tax Details` zeigt US-Sales-Tax-Werte wie GA/FURNITURE.
- Page 472/473 zeigt `VAT Posting Setup` / `Tax Posting Setup`, aber `VAT Calculation Type = Sales Tax`.

Folge:

Der aktuelle Lauf darf nicht gebucht oder als deutscher Steuer-Endstand verkauft werden.

## Naechster sinnvoller Schritt

Governance, Encoding, Mac-Kompatibilitaet und Lean-Evidence sind committed und gepusht. Nicht erneut mit Aufraeumen beginnen, solange keine neue Rohmasse entsteht.

Als naechstes den fachlichen Block waehlen:

1. deutschen VAT-Zielmandanten vorbereiten,
2. oder im aktuellen Labor ein besseres O2C-Zeilen-/Detailbild erzeugen,
3. oder P2P/weitere Stammdaten erst aufbauen.

Empfohlene Richtung:

Empfohlen: `UAT-O2C-001` in einem deutschen oder explizit deutsch konfigurierten VAT-Setup erneut laufen lassen.

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
| `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md` | harter Soll-Ist-Abgleich |
| `playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md` | bekannte Fehler und Loesungen |
| `playwright/projects/fibu-book5/MICROSOFT-DOC-VALIDATION.md` | offizieller Doku-Abgleich |
| `playwright/projects/fibu-book5/PLAYWRIGHT-MCP-WORKFLOW.md` | MCP-Regeln und bisherige MCP-Erkenntnisse |

## Nicht wiederholen

- Nicht versuchen, `19 %` durch irgendein US-Tax-Area-Feld zu erzwingen.
- Nicht MCP-Rohsnapshots wie `console-*.log` oder `page-*.yml` committen; Erkenntnisse in kompakte Evidence ueberfuehren.
- Nicht mit blindem `Enter` den ersten Tell-Me-Treffer waehlen.
- Nicht globale `Escape`-Workarounds nutzen, um Popups zu schliessen.
- Nicht aus freiem Seitentext ungescopte Belegnummern fuer Cleanup ableiten.
- Nicht `.env`, `playwright/.auth/`, Playwright-Reports oder Test-Traces committen.
