# Dokumentationskarte FiBu Buch 5

Stand: 15.06.2026

Diese Karte beschreibt, welche Datei welchen Job hat. Sie soll verhindern, dass Laufhistorie, Evidence, Buchtext, Screenshot-QA und Autopilot-Steuerung dieselbe Wahrheit mehrfach und unterschiedlich erzaehlen.

Leitregel: aktuelle Wahrheit kurz halten, Evidence lokal beweisen, wiederverwendbares Wissen zentralisieren, Buch nur evidence-basiert aktualisieren.

| Datei | Rolle | Soll sie lang sein? | Quelle der Wahrheit fuer | Pflege-Regel |
|---|---|---|---|---|
| `AUTOPILOT-STATE.json` | maschinenlesbarer Laufzustand | nein | naechster Autopilot-Schritt, Sperren, letzte belegte Referenzen | nur aktuelle Steuerwahrheit, keine Laufchronik als Prosa |
| `COMPANY-REGISTRY.md` / `COMPANY-REGISTRY.json` | Mandanten-/Company-Steuerregister | nein | welche Companies innerhalb `MCP_1_20260210` bekannt, geplant oder nutzbar sind | vor Company-Wechsel oder neuer Company zwingend lesen und aktualisieren |
| `POSTING-AND-SETUP-GATES.md` | Sicherheitsgates | mittel | erlaubte/gesperrte Setup-, Posting-, Payment- und Company-Aktionen | vor riskanten Aktionen zwingend lesen; Gate nicht durch Coverage ersetzen |
| `CURRENT-STATE.md` | menschlicher Handover | mittel | aktueller Projektstand und naechster sinnvoller Schritt | am Ende jedes Laufs aktualisieren; alte Historie knapp halten |
| `DOCUMENTATION-MAP.md` | Rollenkarte der Dokumentation | nein | welche Datei welchen Zweck hat | nur bei Struktur- oder Governance-Aenderung pflegen |
| `BC-PLAYWRIGHT-PATTERNS.md` | wiederverwendbare UI-/Toolmuster | mittel | robuste BC-Klickpfade und Anti-Patterns | aus belegten Laeufen ergaenzen, keine ungetesteten Tricks behaupten |
| `PLAYWRIGHT-BC-OPTIMIZATION-AUDIT.md` | technischer Playwright-Audit | mittel | aktuelle Helper-/Pattern-Schwaechen und naechste technische Optimierung | nach gezielten Playwright-Foundation-Laeufen pflegen; keine Fachprozess-Evidence ersetzen |
| `BC-PAGE-ACTION-MAP.json` | maschinenlesbare Seiten-/Aktionskarte | mittel | bekannte Seiten, Suchbegriffe, Aktionen, Fallen, Evidence | nur kompakte bewiesene oder klar markierte Kandidaten aufnehmen |
| `playwright/core/bc/` | kleine BC-Helper-Komponenten | mittel | wiederverwendbare Shell-/Action-/Dialog-/Grid-Muster fuer Tests | lieber gezielt erweitern als lokale Force-/Koordinatenhelfer duplizieren; Fachtests erst nach sicherem Zielzustand migrieren |
| `SETUP-READINESS-MATRIX.md` | Prozess-Setup-Ampel | mittel | ob ein Prozess praktisch setup-/buchungsreif ist | pro Lauf betroffene Zeile aktualisieren, Labor/final trennen |
| `PROCESS-CASE-REGISTRY.json` | maschinenlesbares Fallregister | mittel | Case-ID, Status, Belege, Evidence, Grenzen, naechster Schritt | neue Prozessfaelle hier auffindbar machen |
| `LAB-FIT-STATUS.md` | blockuebergreifende Prozesslandkarte | ja, aber strukturiert | Laborfit je Prozessblock | fachliche Matrix pflegen, veraltete Next-Step-Saetze synchronisieren |
| `MASTERDATA-BACKLOG.md` | Stammdaten-/Setup-Roadmap | ja | geplante, fehlende und belegte Zielobjekte | keine Datenanlage ohne Backlog-/Gate-Bezug |
| `BOOK-TO-EVIDENCE-AUDIT.md` | Buch-vs.-Evidence-Kritik | ja | welche Buchaussage praktisch belegt ist | Zielbild, Laborstand und DE-Finalnachweis strikt trennen |
| `BOOK-CLICK-GUIDE-COVERAGE.md` | redaktionelle Klickanleitungs-Ampel | ja | welche Anleitung bebildert und nachgewiesen ist | nur als abgedeckt markieren, wenn Screenshot, Evidence und Buchwirkung passen |
| `UI-INVENTORY.md` | sichtbare BC-Funktionen | ja | Seiten, Buttons, Felder, Dialoge, Status | neue UI-Elemente mit Zweck und Evidence aufnehmen |
| `SCREENSHOT-QA.md` | visuelle Bildfreigabe | ja | ob ein Screenshot Buchbild, Laborbild oder rejected ist | ein Bild ist nur buchfaehig, wenn das sichtbare Lernziel im Bild zu sehen ist |
| `playwright/FINDINGS.md` | Buch-/UI-Fundstellen | ja | sichtbare BC-Elemente oder Buchluecken mit Lernwert | neue Fundstellen nur bei Buch-/Projektwirkung; erledigte Befunde nicht duplizieren |
| `WORKAROUNDS-AND-ERRORS.md` | Fehler- und Workaround-Journal | ja | reproduzierbare Fehler, Ursache, Loesung, Buchwirkung | jeder echte Stolperstein bekommt Situation, Symptom, Ursache, Loesung, Regel |
| `ARTIFACT-GOVERNANCE.md` | Artefaktregeln | mittel | was committet wird und was nicht | Rohdaten verdichten; Screenshots/Evidence mit Zweck behalten |
| `evidence/<case-id>/README.md` | lokaler Evidence-Index | mittel | was dieser Fall beweist und nicht beweist | erster Einstieg in jeden Fall; keine Rohdump-Sammlung |
| `evidence/<case-id>/*-result.json` | strukturierter Laufbefund | nein | maschinenlesbares Ergebnis | gueltiges JSON, kompakt, mit Status/Grenzen |
| `playwright/projects/fibu-book5/img/` | Buch- und Laborbilder | viele Dateien, aber kuratiert | visuelle UI-, Fehler-, Setup-, Posting- und Reportnachweise | nicht loeschen, wenn referenziert oder fachlich relevant; Metadaten/Evidence erklaeren Zweck |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | Buchtext | ja | redaktionelle Anleitung fuer Leser | nur evidence-basiert aendern; CRONUS-Labor nicht als deutschen Finalstand ausgeben |
| `archive/` | historisches Material | nur bei Bedarf | alte Historie, wenn aktuelle Wahrheit anderswo sauber steht | erst archivieren, wenn Links und aktuelle Wahrheit erhalten bleiben |

## Ebenenmodell

1. Autopilot-Steuerung: `AUTOPILOT-STATE.json`, `POSTING-AND-SETUP-GATES.md`, `CURRENT-STATE.md`.
2. Wiederverwendbares Wissen: `BC-PLAYWRIGHT-PATTERNS.md`, `BC-PAGE-ACTION-MAP.json`, `SETUP-READINESS-MATRIX.md`, `PROCESS-CASE-REGISTRY.json`.
3. Buchwahrheit: Buchdatei, `BOOK-TO-EVIDENCE-AUDIT.md`, `BOOK-CLICK-GUIDE-COVERAGE.md`.
4. Fall-Evidence: `evidence/<case-id>/README.md`, Result-JSON, Sync-/Trace-Dateien, kompakte Seitentexte.
5. Archiv: nur fuer ueberholte Historie, nie als Ersatz fuer aktuelle Wahrheit.
