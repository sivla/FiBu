# Dokumentationskarte FiBu Buch 5

Stand: 30.06.2026

Diese Karte beschreibt, welche Datei welchen Job hat. Sie verhindert, dass Laufhistorie, Evidence, Buchtext, Screenshot-QA und Autopilot-Steuerung dieselbe Wahrheit mehrfach und unterschiedlich erzählen.

Aktive Projektwahrheit ist Universaarl:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- alte RM-DEMO-, Rhein-Main-, CRONUS- und `MCP_1_20260210`-Bezüge: `legacy-labor-reference`

Leitregel: aktuelle Wahrheit kurz halten, Evidence lokal beweisen, wiederverwendbares Wissen zentralisieren, Buchtexte als echte Lesertexte schreiben und alte Laborbelege nicht als Universaarl-Finalnachweis verwenden.

## Aktive Steuerdateien

| Datei | Rolle | Soll sie lang sein? | Quelle der Wahrheit für | Pflege-Regel |
|---|---|---|---|---|
| `.agent/state/current.json` | kompakter maschinenlesbarer Autopilot-Zustand | nein | aktive Instanz, Zielcompany, aktiver Case, nächster Schritt, harte Verbote, aktuelle Policy | am Ende jedes Laufs aktualisieren; keine lange Prosa-Historie |
| `.agent/state/marathon_queue.json` | permission-aware Arbeitsqueue | mittel | PREP-/Read-only-/Repo-/Doku-Reihenfolge, geparkte Target-Cases, Lookahead | vor jedem Lauf prüfen; Queue ist Arbeitsplan, kein Dogma |
| `.agent/state/last_run_summary.json` | letzter Lauf in Kurzform | nein | was wirklich passiert ist, welche Dateien geändert wurden, nächster sinnvoller Case | Ergebnis und Next-Step Decision Card aktuell halten |
| `.agent/state/cases/*.json` | einzelner Case-Zustand | nein | Status, Grenzen, Resultpfade, Case-spezifische Entscheidung | pro Case eine kleine Datei; nicht als Buchtext verwenden |
| `.agent/state/open_questions_register.json` | offene Fragen mit Status | mittel | was noch Quelle, UI-Discovery, Setup, Permission oder Evidence braucht | Fragen schließen oder verschieben, statt sie im Buchfließtext zu verstecken |
| `.agent/state/rm_decommission_inventory.json` | Legacy-Referenzinventar | mittel | welche RM-/Rhein-Main-/CRONUS-Treffer aktiv, Archiv oder später zu ersetzen sind | nicht blind massenersetzen; historische Evidence schützen |
| `.agent/state/book-production-goal.json` | Buchziel und Statuslogik | nein | Labor-/Draft-/Final-Statusbegriffe und Buchpatch-Grenzen | bei Zieldefinitionen aktualisieren |

## Permission, Gates und Entscheidung

| Datei | Rolle | Soll sie lang sein? | Quelle der Wahrheit für | Pflege-Regel |
|---|---|---|---|---|
| `playwright/projects/fibu-book5/PERMISSION-BLOCKERS.md` | aktueller Rechteblocker | nein | warum Company Creation geparkt ist und wann sie wieder aufgenommen wird | nach jedem Rechte-/Company-Creation-Befund aktualisieren |
| `playwright/projects/fibu-book5/READY-FOR-SUPER-PERMISSIONS-CHECKLIST.md` | Resume-Checkliste | mittel | erster sauberer Lauf nach SUPER-/Company-Create-Rechten | vor TARGET-009 lesen; Hauptbutton, Pfeil und Menüeintrag trennen |
| `.agent/SMART-DECISION-GATE.md` | Gate vor wirksamen Aktionen | mittel | wann Setup, Posting, Wizard Finish oder Buchmaster-Änderung eine Decision Card braucht | nicht als Stopp missverstehen; es erzwingt Vorbereitung |
| `.agent/NEXT-STEP-DECISION-GATE.md` | Lookahead-Regel | mittel | Prüfung der nächsten 3-5 Cases | jeder Lauf endet mit begründetem nächsten Case |
| `.agent/BC-OPERATING-MODEL.md` | Agenten-Arbeitsmodell | mittel | lokale Pipeline, Safe Defaults, Single-Agent-Phasen | nur bei Architektur-/Policy-Änderung pflegen |
| `.agent/modes/sandbox-instance-autopilot.md` | aktiver Autopilot-Modus | mittel | was innerhalb der aktiven Instanz erlaubt, geparkt oder verboten ist | an Zielweltwechsel und Rechteblocker anpassen |

## Universaarl-Kataloge, Coverage und Atlanten

| Datei | Rolle | Soll sie lang sein? | Quelle der Wahrheit für | Pflege-Regel |
|---|---|---|---|---|
| `BC-FULL-PLAYTHROUGH-CATALOG.md` | zentrale Prozesslandkarte | ja, aber strukturiert | alle Universaarl-Usecases, Abhängigkeiten, nächster Case je Bereich | bei neuen Cases und Reihenfolgeänderungen aktualisieren |
| `BC-COVERAGE-MATRIX.md` | Prozessabdeckung | ja, aber tabellarisch | Coverage-Level von Legacy-Labor bis Universaarl-Final | Legacy und Universaarl strikt trennen |
| `BC-OBJECT-COVERAGE-CATALOG.md` | Objekt-/Page-Abdeckung | ja | welche Pages, Cards, Listen, Worksheets, Reports und Dialoge noch fehlen | keine leeren Deko-Einträge; jeder Eintrag braucht Zweck |
| `BC-PAGE-ATLAS.md` | Page-Landkarte | mittel | bekannte Seiten, Page-Kontext, sichere Nutzung | nach UI-Discovery oder Page Inspection ergänzen |
| `BC-FIELD-ATLAS.md` | Feld-Landkarte | mittel | wichtige Felder, Pflichtfelder, Buchungswirkung | nur bewiesene oder klar geplante Felder aufnehmen |
| `BC-ACTION-ATLAS.md` | Action-/Button-Landkarte | mittel | Hauptbutton, Dropdown, Menüs, gefährliche Aktionen | Splitbutton-Ziele getrennt dokumentieren |
| `BC-DIALOG-ATLAS.md` | Dialog-Landkarte | mittel | Warnungen, Wizards, Confirm-Dialoge, Stop-Regeln | Dialoge nie pauschal bestätigen |
| `BC-REQUEST-PAGE-ATLAS.md` | Report-/Batch-Request-Pages | mittel | Filter, Optionen, Preview-/Run-Grenzen | relevant für Reports, AfA, VAT, Stapel |
| `BC-TABLE-ENTRY-ATLAS.md` | Entry-/Posten-Landkarte | mittel | welche Entries/Posten je Prozess entstehen | nach Posting-/Trace-Cases ergänzen |
| `BC-SCREENSHOT-INVENTORY.md` | Screenshot-Inventar | ja | welche Bilder final, draft, legacy oder rejected sind | jeder Screenshot braucht Page, Company, Schritt, Lernwert und Nicht-Beweis |
| `BC-ERROR-BLOCKER-ATLAS.md` | Fehler- und Blockerlandkarte | mittel | wiederkehrende UI-, Rechte-, Setup- und Buchungsblocker | Ursache, Korrekturweg und Buchwirkung notieren |
| `BC-ZERO-OPEN-QUESTIONS-POLICY.md` | Qualitätsregel für offene Fragen | mittel | wann ein Bereich als ausreichend geklärt gilt | mit Open-Questions-Register synchron halten |

## Buch und Buchdrafts

| Datei | Rolle | Soll sie lang sein? | Quelle der Wahrheit für | Pflege-Regel |
|---|---|---|---|---|
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | Buchmaster | ja | lesbarer Schulungsbuchtext | keine Agenten-/Evidence-Meta; keine finalen deutschen Claims ohne Universaarl-Evidence |
| `playwright/projects/fibu-book5/book-drafts/*.md` | Arbeitsfassungen für Kapitel | mittel | lesbare Vorstufen aus Evidence und Quellen | als Buchtext schreiben, nicht als interne Notiz |
| `BOOK-TO-EVIDENCE-AUDIT.md` | Buch-vs.-Evidence-Kritik | ja | welche Buchaussage praktisch belegt ist | Zielbild, Laborstand und Finalnachweis strikt trennen |
| `BOOK-CLICK-GUIDE-COVERAGE.md` | Klickanleitungs-Ampel | ja | welche Anleitung bebildert und ausführbar ist | nur als abgedeckt markieren, wenn Screenshot, Evidence und Buchwirkung passen |
| `EVIDENCE-PACK-STANDARD.md` | Standard für buchfähige Klickanleitungen | mittel | Mindestnachweise für UI, Felder, Posten, Persistenz | bei Prozesskapiteln als Checkliste nutzen |

## Evidence und Bilder

| Datei/Ordner | Rolle | Soll sie lang sein? | Quelle der Wahrheit für | Pflege-Regel |
|---|---|---|---|---|
| `playwright/projects/fibu-book5/evidence/<case-id>/README.md` | lokaler Evidence-Index | mittel | was ein Fall beweist und nicht beweist | erster Einstieg in jeden Fall; keine Rohdump-Sammlung |
| `playwright/projects/fibu-book5/evidence/<case-id>/*-result.json` | strukturierter Laufbefund | nein | maschinenlesbares Ergebnis, Flags, Grenzen, Decision Card | gültiges JSON, kompakt, mit Status/Grenzen |
| `playwright/projects/fibu-book5/img/` | Buch- und Laborbilder | viele Dateien, aber kuratiert | visuelle UI-, Fehler-, Setup-, Posting- und Reportnachweise | nicht löschen, wenn referenziert; Metadaten/Evidence erklären Zweck |
| `playwright/FINDINGS.md` | sichtbare Fundstellen | ja | UI-/Buchlücken mit Lernwert | neue Fundstellen nur bei Projektwirkung |
| `WORKAROUNDS-AND-ERRORS.md` | Fehler- und Workaround-Journal | ja | reproduzierbare Stolpersteine und Korrekturwege | Situation, Symptom, Ursache, Lösung, Buchwirkung |

## Playwright und wiederverwendbares Wissen

| Datei/Ordner | Rolle | Soll sie lang sein? | Quelle der Wahrheit für | Pflege-Regel |
|---|---|---|---|---|
| `BC-PLAYWRIGHT-PATTERNS.md` | wiederverwendbare UI-/Toolmuster | mittel | robuste BC-Klickpfade und Anti-Patterns | aus belegten Läufen ergänzen, keine ungetesteten Tricks behaupten |
| `BC-BUGFIXING-PLAYBOOK.md` | Fehleranalyse-Playbook | mittel | Diagnoseablauf, Page Inspection, Personalisierung, Support-Denke | bei wiederkehrenden BC-Fehlern pflegen |
| `PLAYWRIGHT-BC-OPTIMIZATION-AUDIT.md` | technischer Playwright-Audit | mittel | Helper-Schwächen und nächste Optimierung | technische Findings von Fach-Evidence trennen |
| `BC-PAGE-ACTION-MAP.json` | maschinenlesbare Seiten-/Aktionskarte | mittel | bekannte Seiten, Suchbegriffe, Aktionen, Fallen | nur kompakte bewiesene oder klar markierte Kandidaten aufnehmen |
| `playwright/core/bc/` | BC-Helper-Komponenten | mittel | wiederverwendbare Shell-/Action-/Dialog-/Grid-Muster | gezielt erweitern statt Koordinatenlogik zu duplizieren |

## Legacy / Archiv

| Datei/Ordner | Rolle | Soll sie lang sein? | Quelle der Wahrheit für | Pflege-Regel |
|---|---|---|---|---|
| `CURRENT-STATE.md` | alter menschlicher Handover | mittel | historische Übergänge und frühere Laborlage | nicht mehr aktive Steuerwahrheit; bei Bedarf als Legacy markieren |
| `AUTOPILOT-STATE.json` | alte State-Generation | nein | historische Steuerform | nicht als aktuelle Wahrheit nutzen, falls `.agent/state/current.json` widerspricht |
| `COMPANY-REGISTRY.md` / `COMPANY-REGISTRY.json` | alte MCP-Company-Registry | nein | frühere `MCP_1_20260210`-Laborstruktur | nur als Legacy-Laborquelle verwenden |
| `POSTING-AND-SETUP-GATES.md` | frühere Gate-Datei | mittel | historische Labor-Gates | aktuelle Target-Gates liegen in `.agent` und Permission-Dateien |
| `LAB-FIT-STATUS.md` / `MASTERDATA-BACKLOG.md` | RM-DEMO-Laborlandkarte | ja | alte Laborreife | nicht als Universaarl-Zielwahrheit verwenden |
| `archive/` | historisches Material | nur bei Bedarf | überholte Historie | erst archivieren, wenn Links und aktuelle Wahrheit erhalten bleiben |

## Ebenenmodell

1. Aktive Steuerung: `.agent/state/current.json`, `.agent/state/marathon_queue.json`, `.agent/state/last_run_summary.json`, `.agent/state/cases/*.json`.
2. Gates und Berechtigungen: Permission-Blocker, SUPER-Checkliste, Smart Decision Gate, Next-Step Decision Gate.
3. Universaarl-Coverage: Full-Playthrough-Katalog, Coverage Matrix, Objektkatalog und Atlanten.
4. Buchsubstanz: Buchmaster, Buchdrafts, Clickguide-Coverage und Buch-vs.-Evidence-Audit.
5. Evidence: Case-README, Result-JSON, Screenshots, Screenshot-Metadaten, Findings.
6. Legacy: RM-DEMO-, Rhein-Main-, CRONUS- und `MCP_1_20260210`-Dateien als historische Laborquellen.
