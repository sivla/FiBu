# Codex Superautopilot Prompt V6.2 - FiBu Buch 5

Stand: 2026-06-16

Dieses Dokument ist der state-driven Queue-Prompt fuer autonome Codex-Laeufe im Projekt `FiBu Buch 5`.

Repository: `sivla/FiBu`

Branch: `codex/playwright-bc-screenshot-foundation`

Business-Central-Instanz: `MCP_1_20260210`

Primärer aktueller Mandant: `RM-DEMO`, sofern `AUTOPILOT-STATE.json` nichts anderes sagt.

## Mission

Ziel ist:

```text
Buchwahrheit + Business-Central-Wirklichkeit + Evidence-Wahrheit + Playwright-Wiederverwendbarkeit + Lernfortschritt + Buchqualitaet synchronisieren
```

Nicht das Ziel: Tests blind gruener machen oder moeglichst viel gleichzeitig anfassen.

Jeder Lauf muss echten Fortschritt bringen:

- Buch fachlich richtiger machen
- Klickanleitungen ausfuehrbarer machen
- Business Central praktisch besser verstehen
- Screenshots an echten Kontrollpunkten erzeugen
- Evidence fuer Belege, Posten, Setup, Fehler und Grenzen sichern
- Playwright robuster fuer BC machen
- Stammdaten/Setup tragfaehiger machen
- den naechsten Lauf einfacher machen

## Absolute Instanzgrenze

Die Instanz `MCP_1_20260210` darf nicht verlassen werden.

Niemals:

- Produktivumgebung oeffnen
- fremde Instanz oeffnen
- echte Produktivmandanten anfassen
- echte Kunden-, Bank-, Steuer-, Zahlungs-, Login- oder Produktivdaten verwenden
- Secrets/Auth/`.env`/Reports/Traces/Rohsnapshots committen
- externe Produktivsysteme anbinden
- echte Steuer-/Compliance-Meldungen senden
- echte Bankdateien erzeugen oder uebertragen

Wenn BC unerwartet eine andere Instanz oder Produktivumgebung zeigt: sofort stoppen, nichts aendern, nichts buchen, Evidence sichern, Fehler dokumentieren, `CURRENT-STATE.md` und `AUTOPILOT-STATE.json` aktualisieren.

## Startdisziplin

Zu Beginn jedes Laufs:

```bash
git branch --show-current
git status --short
git pull --ff-only
```

Nur auf `codex/playwright-bc-screenshot-foundation` arbeiten.

Bei falschem Branch, Pull-Problem oder unverstandenem Working Tree: nicht fachlich weiterarbeiten, sondern dokumentieren.

## Pflichtlektüre

Gezielt lesen, nicht blind alles.

Immer zuerst:

1. `AUTOPILOT-STATE.json`
2. `CURRENT-STATE.md`
3. `DOCUMENTATION-MAP.md`
4. `POSTING-AND-SETUP-GATES.md`
5. `COMPANY-REGISTRY.md/json`
6. `SETUP-READINESS-MATRIX.md`
7. `PROCESS-CASE-REGISTRY.json`
8. `BC-PLAYWRIGHT-PATTERNS.md`
9. `BC-BUGFIXING-PLAYBOOK.md`
10. `EVIDENCE-PACK-STANDARD.md`
11. `BC-PAGE-ACTION-MAP.json`
12. `BOOK-TO-EVIDENCE-AUDIT.md`
13. `BOOK-CLICK-GUIDE-COVERAGE.md`
14. `LAB-FIT-STATUS.md`
15. `MASTERDATA-BACKLOG.md`
16. `playwright/FINDINGS.md`
17. relevante Evidence und relevante Buchkapitel

## Laufentscheidung vor Arbeit

Vor fachlicher Arbeit intern festlegen:

```text
Run ID:
Hauptmission:
Warum dieser Schritt:
Betroffene Company:
Betroffene Buchkapitel:
Betroffene Prozessbereiche:
Aenderungstypen:
Erwartete Evidence:
Erwartete Screenshots:
Erwartete Playwright-Aenderung:
Erwartete Buchaenderung:
Risiko:
Definition of Done:
Bewusst nicht betroffen:
```

Nicht starten, bevor klar ist:

- Was ist echter Fortschritt?
- Welche Dateien sind laut Update-Matrix betroffen?
- Welche Dateien bleiben bewusst unberuehrt?

## Änderungstypen

| Typ | Bedeutung |
|---|---|
| `company` | Company/Mandant angelegt, gewechselt, geprueft oder geplant |
| `setup` | Einrichtung, Matrix, Posting Group, Nummernserie, VAT, Bank, FA, Lager usw. geaendert |
| `masterdata` | Debitor, Kreditor, Artikel, Anlage, Ressource, Projekt, Lagerort usw. angelegt/geaendert |
| `posting` | echte Buchung, Beleg, Journal, Zahlung, Ausgleich, AfA, Lagerbewegung |
| `readiness` | Read-only Pruefung, Feldmapping, Seitenpruefung, Setup-Preflight |
| `book` | Buchtext, Klickanleitung, Kapitel, Statusbox oder Erklaerung geaendert |
| `evidence` | Evidence-README, Result-JSON, Trace, Screenshot-Metadaten erzeugt/geaendert |
| `screenshot` | neue oder bessere Screenshots / Screenshot-QA |
| `playwright` | Helper, Test, Locator, Pattern, Page-/Action-Map geaendert |
| `source` | Microsoft Learn / offizielle Quelle geprueft |
| `governance` | State, Gates, Registry, Matrix, Dokumentationsstruktur geaendert |
| `blocked` | Problem nicht geloest, aber mit Evidence dokumentiert |
| `cleanup` | Doku verdichtet, veraltete Next-Steps korrigiert |

Ein Lauf kann mehrere Typen haben, aber genau eine Hauptmission.

## Update-Matrix

| Wenn Typ... | Muss aktualisiert werden | Optional, wenn betroffen |
|---|---|---|
| `company` | `COMPANY-REGISTRY.md/json`, `AUTOPILOT-STATE.json`, `CURRENT-STATE.md` | `SETUP-READINESS-MATRIX.md`, `PROCESS-CASE-REGISTRY.json`, Buch |
| `setup` | Evidence, `SETUP-READINESS-MATRIX.md`, `AUTOPILOT-STATE.json`, `CURRENT-STATE.md` | `MASTERDATA-BACKLOG.md`, Buch, `BC-PAGE-ACTION-MAP.json` |
| `masterdata` | Evidence, `MASTERDATA-BACKLOG.md`, `AUTOPILOT-STATE.json`, `CURRENT-STATE.md` | `SETUP-READINESS-MATRIX.md`, `PROCESS-CASE-REGISTRY.json`, Buch |
| `posting` | Evidence, `PROCESS-CASE-REGISTRY.json`, `SETUP-READINESS-MATRIX.md`, `AUTOPILOT-STATE.json`, `CURRENT-STATE.md` | Buch, Coverage, Audit |
| `readiness` | Evidence, `SETUP-READINESS-MATRIX.md`, `AUTOPILOT-STATE.json`, `CURRENT-STATE.md` | Action Map, Patterns, Buch |
| `book` | Buch, `BOOK-TO-EVIDENCE-AUDIT.md`, `BOOK-CLICK-GUIDE-COVERAGE.md`, `CURRENT-STATE.md` | Evidence-README, Screenshot-QA |
| `evidence` | lokaler Evidence-Ordner, `PROCESS-CASE-REGISTRY.json`, `CURRENT-STATE.md` | Buch, Coverage, Screenshot-QA |
| `screenshot` | Screenshot-Metadaten/Evidence, `SCREENSHOT-QA.md` falls Status relevant | Buch, Coverage |
| `playwright` | Helper/Tests, `BC-PLAYWRIGHT-PATTERNS.md`, `BC-PAGE-ACTION-MAP.json` | Optimization Audit, Evidence |
| `source` | Quellen-/Buchstelle oder `BOOK-TO-EVIDENCE-AUDIT.md` | Findings, Buch |
| `governance` | `AUTOPILOT-STATE.json`, `CURRENT-STATE.md`, betroffene Governance-Datei | `DOCUMENTATION-MAP.md` |
| `blocked` | Evidence, `WORKAROUNDS-AND-ERRORS.md`, `AUTOPILOT-STATE.json`, `CURRENT-STATE.md` | Patterns, Findings, Buch |
| `cleanup` | betroffene Datei; `CURRENT-STATE.md` nur bei Projektwahrheit | `DOCUMENTATION-MAP.md`, Archiv |

Wenn eine Datei laut Matrix nicht betroffen ist: nicht anfassen.

## Single Source of Truth

| Wahrheit | Primäre Datei |
|---|---|
| aktueller Laufzustand / naechster Schritt | `AUTOPILOT-STATE.json` |
| menschlicher Projektueberblick | `CURRENT-STATE.md` |
| Company-Wahrheit | `COMPANY-REGISTRY.md/json` |
| Prozessfall / Belege / Proof / Grenzen | `PROCESS-CASE-REGISTRY.json` |
| Setup-Reife | `SETUP-READINESS-MATRIX.md` |
| Stammdaten-/Setup-Roadmap | `MASTERDATA-BACKLOG.md` |
| Buchaussage vs. Nachweis | `BOOK-TO-EVIDENCE-AUDIT.md` |
| Klickanleitungs-Coverage | `BOOK-CLICK-GUIDE-COVERAGE.md` |
| BC-Klickmuster | `BC-PLAYWRIGHT-PATTERNS.md` |
| Bugfixing-Denkweise | `BC-BUGFIXING-PLAYBOOK.md` |
| Evidence-Finalitaet | `EVIDENCE-PACK-STANDARD.md` |
| Seiten/Aktionen/Fallen | `BC-PAGE-ACTION-MAP.json` |
| Fehler/Workarounds | `WORKAROUNDS-AND-ERRORS.md` |
| Bildqualitaet | `SCREENSHOT-QA.md` |
| lokaler Beweis | `evidence/<case-id>/README.md` und Result-JSON |

Andere Dateien duerfen referenzieren, aber keine widerspruechliche Wahrheit neu erzaehlen.

## Self-Healing und Retry

Wenn BC blockiert, nicht sofort abbrechen und nicht zum naechsten Thema springen.

Zuerst Fehlerklasse aus `BC-BUGFIXING-PLAYBOOK.md` bestimmen:

- UI-/Locator-Fehler
- BC-Setup-Fehler
- Stammdatenfehler
- Prozessfehler
- Berechtigungs-/Systemgrenze
- fachliche Unsicherheit
- Extension-/Integration-/Performance-Kontext

Maximal drei Loesungsversuche:

1. naheliegende Korrektur
2. alternativer BC-Pfad oder Setup-Fit
3. Microsoft-Learn-/offizielle Quelle pruefen und robusteren Weg bauen

Nach jedem Versuch dokumentieren:

- was getestet/geaendert wurde
- Ergebnis
- neue Evidence/Screenshots
- Buch-/Pattern-/Workaround-Folge

Wenn weiter blockiert: `blocked-with-evidence`, Workaround/Finding schreiben, naechsten sinnvollsten Fortschritt waehlen.

## Buchungen und Setup

Innerhalb dokumentierter Companies darf autonom gebucht oder eingerichtet werden, wenn der Gate-/State-Kontext es erlaubt.

Vor jeder Buchung:

- Instanz pruefen
- Company pruefen
- Stammdaten pruefen
- Setup pruefen
- Pflichtfelder pruefen
- Preview Posting oder Journal Check nutzen, wenn verfuegbar
- erwartete Postenarten definieren
- Evidence-Plan schreiben

Nach jeder Buchung:

- Ausgangsbeleg
- gebuchter Beleg
- Nebenbuchposten
- Sachposten
- relevante Steuer-/Artikel-/Wert-/Bank-/FA-/Job-/Service-Entries
- Kontrollbericht oder persistenter Nachweis
- Screenshots/JSON/Buchwirkung/Grenzen

Eine Buchung ohne Postenspur ist unbrauchbar.

## Buchqualität und Evidence

AI-Text ist verdaechtig, bis Evidence ihn bestaetigt.

Grosse Klickanleitungen muessen gegen `EVIDENCE-PACK-STANDARD.md` laufen:

1. UI-Nachweis
2. technischer Page-/Table-Nachweis
3. fachlicher Prozesszustand
4. Posten-/Persistenznachweis

CRONUS-USA bleibt Labor. Deutsche `19 %` USt, deutscher Kontenplan, deutsche Steuerreports und finale deutsche Screenshots nur behaupten, wenn wirklich nachgewiesen.

## Definition of Done

Ein Lauf ist erst fertig, wenn:

- Hauptmission abgeschlossen oder `blocked-with-evidence`
- Evidence lokal beim Fall liegt
- Screenshots Zweck/Status haben, falls erzeugt
- Setup-/Stammdaten-Aenderungen Vorher/Nachher haben
- Buchungen eine Postenspur haben
- Buchaenderungen Evidence oder Quelle nennen
- Playwright-Aenderungen dokumentiert sind
- Update-Matrix angewendet wurde
- `AUTOPILOT-STATE.json` den naechsten Schritt nennt
- `CURRENT-STATE.md` nur bei menschlich relevanter Projektwahrheit aktualisiert wurde
- keine Rohartefakte/Secrets/Traces committet werden
- Validierung ausgefuehrt oder begruendet wurde
- Commit und Push erfolgt sind

Vor Commit intern pruefen:

```text
Aenderungstypen:
Betroffene Dateien laut Matrix:
Tatsaechlich geaendert:
Bewusst nicht geaendert:
Validierung:
Naechster Schritt:
```

Keine Datei nur "zur Sicherheit" anfassen.

## Validierung

Vor Commit:

```bash
npm run check:encoding
git diff --check
```

Wenn JSON geaendert wurde: syntaktisch pruefen.

Wenn TypeScript geaendert wurde:

```bash
npx tsc --noEmit
```

Wenn Tests geaendert oder neu sind: passenden Test laufen lassen, wenn moeglich; sonst Grund dokumentieren.

## Abschlussmeldung

Melde kurz:

- Arbeitstyp
- gewaehlter Schritt und warum
- Aenderungstypen
- Instanz/Company
- ob Company gewechselt/angelegt wurde
- was eingerichtet oder gebucht wurde
- Belege/Posten
- Evidence/Screenshots
- Buch-/Klickanleitungs-Fortschritt
- Playwright-Verbesserungen
- geaenderte Dateien
- bewusst nicht geaenderte Dateien, wenn relevant
- Validierung
- offene Grenzen
- naechster sinnvoller Lauf
- Commit/Push
