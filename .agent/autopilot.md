# FiBu Buch 5 Autopilot

Zweck: kleiner Einstiegspunkt fuer Codex-Laeufe, die nicht den gesamten Projektverlauf lesen sollen.

## Startreihenfolge

1. `git branch --show-current`, `git status --short` und `git pull --ff-only` pruefen.
2. Lokale Agent-Checks laufen lassen, bevor ein Fachlauf startet:
   - `npm run agent:preflight`
   - Der Preflight prueft State, Budgets, Safety, Modellrouting, Capability-Links und Skill-Vertrag.
3. Kompakten Lauf-Steckbrief erzeugen:
   - `npm run agent:context`
   - `npm run agent:dry-run`, wenn ein Lauf erst geplant und ohne BC/Playwright validiert werden soll.
   - Der Dry-Run gibt `canProceed`, Budget, Skills, Capabilities, Safety Gates, Stop Conditions und `nextSafeAction` als JSON aus.
   - `npm run agent:run-plan`, wenn aus dem Dry-Run eine konkrete lokale Schrittfolge entstehen soll.
   - Der Run-Plan blockiert Playwright, Business Central, Buchpatches und Binary-/Screenshot-Lesen weiterhin.
   - Standard ist danach ein Single-Agent-Lauf mit klaren Phasen. `npm run agent:subagent-plan` ist optional und kein echter Subagent-Start.
   - `agent:subagent-plan` nur ausfuehren, wenn Review/Eskalation noetig ist: `requiresStrongModel=true`, geplante Buchaenderung, Posting-/Setup-Bewertung, widerspruechliche Evidence/State, grosser Diff, blocked/failed Live-Lauf oder unklare naechste Case-Auswahl.
   - `npm run agent:result-normalize`, wenn ein lokales Analyseergebnis in ein einheitliches Result-JSON ueberfuehrt werden soll.
   - Der Result-Normalizer schreibt noch keinen State; State-Finalisierung bleibt eine spaetere Gate-Schicht.
   - `npm run agent:state-finalize`, wenn aus einem normalisierten Result ein State-Patch-Plan entstehen soll.
   - State-Finalisierung schreibt standardmaessig nicht; `--write` ist nur mit `safeToFinalizeState=true`, Review-freiem Result und nichtleerem `statePatch` moeglich.
   - `npm run agent:state-finalize:test` prueft die lokale Pipeline mit einem kuenstlichen sicheren Result im Planmodus.
   - optional `npm run agent:usage:summary`, wenn `judge_work` oder `big_brain_review` genutzt wurde
4. Modell-/Reasoning-Klasse aus `.agent/model-routing.json` waehlen:
   - `monkey_work` fuer billige Fleissarbeit
   - `wizard_work` fuer Tool-, Script-, Helper- und Refactor-Arbeit
   - `judge_work` fuer BC-/FiBu-Urteil, Buch-vs-Evidence und Risikoentscheidungen
   - `big_brain_review` nur als seltene Endabnahme
   - Bei `spawn_agent` immer `subagentSpawn.spawnModel` und `subagentSpawn.reasoningEffort` aus `.agent/model-routing.json` setzen; nicht das Parent-Modell erben lassen.
   - Beispiele stehen in `.agent/subagent-routing.md`.
5. Nur diese Kernstate-Dateien lesen, falls der Context-Pack nicht ausreicht:
   - `.agent/state/current.json`
   - `.agent/state/project_state.json`
   - `.agent/state/coverage_state.json`
   - `.agent/state/last_run_summary.json`
   - die in `current.json.active_case_file` genannte Case-Datei
6. Danach maximal drei Skills laden, die fuer den gewaehlten Lauf gebraucht werden.
   - Jeder Skill muss dem Vertrag in `.agent/skills/SKILL-CONTRACT.md` folgen.
   - Fuer BC-UI-Arbeit gilt zusaetzlich `.agent/BC-OPERATING-MODEL.md`.
7. Alte grosse Projektdateien nur gezielt lesen, wenn der State oder ein Skill sie ausdruecklich verlangt.

## Arbeitsprinzip

- Repo-State ist die Wahrheit, nicht alte Chat-Historie.
- Ziel ist ein vollstaendiges, anfaengerfreundliches, evidence-basiertes Business-Central-FiBu-Buch.
- Aktive Buchwelt ist ab jetzt Universaarl: Zielinstanz `playthru`, Zielcompany `UNIVERSAARL-DE`, Musterfirma `Universaarl GmbH`. Die Company existiert nicht als Voraussetzung; ihre UI-first-Anlage ist Teil des Buchprozesses.
- `MCP_1_20260210`, `RM-DEMO`, Rhein-Main-/RM-* und CRONUS-Bezuege sind nur noch `legacy-labor-reference`. Sie bleiben als historische Evidence erhalten, duerfen aber nicht mehr als aktive Zielwahrheit oder finale deutsche Buchwelt verwendet werden.
- Business-Central-Specialist-Modus: Jeder Lauf soll mindestens eine Coverage-Zeile, einen Atlas-Eintrag, eine Evidence-Strecke, ein Buchdraft-Stueck oder eine wiederverwendbare Playwright-Faehigkeit verbessern. Die zentralen Projektdateien dafuer liegen unter `playwright/projects/fibu-book5/BC-*.md`.
- Gate-is-not-stop: Ein Gate ist ein Kontrollpunkt, kein Endziel. Wenn ein Gate gruen ist und der naechste Schritt innerhalb der aktiven State-Instanz klar, erlaubt und evidence-faehig ist, wird der naechste Prozessschritt geplant oder ausgefuehrt statt nach Header/Zeile/Screenshot zu stoppen.
- Marathon mode overrides single-case completion. Vor einem Abschlussbericht in Deep-/Execute-Laeufen muss `npm run agent:marathon:check` bestehen oder ein harter Stop dokumentiert sein.
- Read-only route comparisons, readiness checks und Coverage-/State-Sync zaehlen nicht als Execute-Fortschritt. Wenn der Marathon-Check fehlschlaegt und der Arbeitsbaum sauber ist, nach dem ersten Commit mit dem naechsten Execute-Hebel weiterarbeiten.
- Process over fragment: Bevorzugt werden Prozessstrecken von Beleganlage ueber Werte, Preview, Posting, Ledger Trace und Buchsync. Mini-Gates sind nur sinnvoll, wenn sie ein Risiko isolieren oder eine konkrete Playwright-/BC-Faehigkeit verbessern.
- Blocker-to-skill: Wiederholbare Blocker werden in Playwright-Patterns, BC-Atlas, Buch-Lernpunkt oder Helper-/Capability-Verbesserung ueberfuehrt. Ein Blocker ohne Lern- oder Strukturwirkung ist unvollstaendig dokumentiert.
- Business Central bleibt in der aktuell im State definierten Zielinstanz. Aktuell ist das `playthru`; nicht mehr `MCP_1_20260210`.
- Alte `RM-DEMO`-Ergebnisse duerfen nur noch als historische Laborquelle genutzt werden. Sobald Universaarl-Evidence fuer einen Prozess existiert, wird der alte Laborstand als `superseded-by-universaarl` markiert.
- Jeder aktive Buchclaim muss auf Universaarl umgestellt oder klar als historische Laborreferenz gekennzeichnet werden. Kein Mischbuch aus Rhein-Main, RM-DEMO, CRONUS und Universaarl.
- Diese Sandbox-Freiheit ist immer case-/gate-gesteuert: jede Daten-, Setup-, Posting- oder Company-Aktion braucht dokumentierte Instanz, Company, Zweck, Ergebnis und Cleanup-/Trace-Status.
- In `.agent/state/current.json` sind `forbiddenActions` harte Stopps. `defaultLockedActions` sind innerhalb der Sandbox nur gesperrt, bis ein aktiver Case oder Gate sie mit Evidence-Plan freigibt.
- `defaultLockedActions` sind Gates, keine Verbote. Wenn Fachpruefung, Case-Freigabe, Evidence-Plan und Trace-/Cleanup-Pfad klar sind, darf derselbe Lauf in `MCP_1_20260210` vom Gate in Preview, Posting, Receive, Setup oder Cleanup weitergehen.
- Vor fachlich wirksamen Sandbox-Schritten muss kompakt dokumentiert werden: Business Case, Zielwert, betroffene Module, Stammdaten/Setup, erwartete Belege/Posten, Risiko, Korrekturpfad und Evidence-Plan. Nachher werden Ist-Wirkung, Abweichung, Belege/Posten, Screenshot/Evidence und Cleanup-/Keep-Status festgehalten.
- Ein Blocker ist kein Endstatus, solange noch sichere UI-Routen, vorhandenes Projektwissen, Atlas/Coverage oder Evidence genutzt werden koennen. Endstatus ist nur eine harte Grenze, ein belegter UI-/Setup-Blocker oder ein sauber dokumentierter naechster Fix-Hebel.
- Companies sind in der Sandbox ersetzbar, Evidence nicht: Testcompanies, Drafts und Setup duerfen kontrolliert neu aufgebaut werden, aber Belege, Screenshots, Results und Lernpunkte bleiben nachvollziehbar referenziert.
- Vor neuer Discovery erst vorhandenes Wissen pruefen: Coverage, Page-/Field-/Action-/Posting-Atlas, Screenshot-Inventar, Error-Atlas, letzte Evidence und aktive Case-Datei.
- Auth, `.env`, Reports, Traces, Videos und Rohsnapshots bleiben lokal.
- Screenshots und Evidence werden projekt-relativ referenziert.
- Jeder Lauf muss mindestens eines erzeugen: neue Labor-Evidence, bessere Playwright-Faehigkeit, konkrete Buchdraft-/Clickguide-Substanz, kontrollierten Execute-/Posting-/Setup-Trace oder eine klare Klassifikation als `labor-proven`, `labor-blocked`, `labor-sufficient-for-book-draft` oder `needs-german-final-rebuild`.
- Nicht ausreichend sind reine Review-Schleifen ohne Abschluss, State-Bewegung ohne Projektfortschritt, Mikro-Cases ohne Buch-/Evidence-/Playwright-Nutzen, ein einzelner Header/Screenshot ohne Folgeentscheidung oder Framework-Ausbau ohne aktuellen Blocker.
- Jeder fachliche Lauf muss pruefen, ob `BC-COVERAGE-MATRIX.md`, Page-/Field-/Action-/Posting-Atlas, Screenshot-Inventar oder Error-Atlas aktualisiert werden muss. Atlas-Pflege ersetzt keine Evidence, verdichtet sie aber fuer den naechsten Lauf.
- Jeder Lauf muss `last_run_summary.json` und den betroffenen Case-State aktualisieren.
- Bei `judge_work` oder `big_brain_review` muss ein Eintrag in `.agent/state/model_usage_log.jsonl` entstehen.
- `agent:subagent-plan` erzeugt nur einen budgetierten Review-/Delegationsplan. Er fuehrt keine KI-Subagents aus und sein Output wird im Standardlauf nicht automatisch konsumiert.
- Fuer normale Sandbox-Probes, kleine Evidence-Syncs und enge Playwright-Fixes gilt: kein Subagent-Plan als Pflicht, solange `context`, `dry-run` und `run-plan` eindeutig sind.
- Subagent-/Review-Planung bleibt Pflicht, wenn starke Urteilskraft oder zweite Sicht noetig ist: riskante fachliche Bewertung, Buchfreigabe, Posting-/Setup-Ergebnis, widerspruechliche Projektwahrheit, grosser Diff, fehlgeschlagener Live-Lauf oder unklare Case-Auswahl.
- Neue wiederverwendbare Playwright-/BC-Faehigkeiten werden in `.agent/capabilities.json` als Capability mit Inputs, Outputs, Gates und Reifegrad gepflegt.
- Datei-/Skill-Limits sind adaptive Budget-Profile aus `.agent/budgets.json`; fuer grosse Laeufe bewusst `expanded` oder `deep` im Case setzen statt heimlich mehr Kontext zu laden.
- Keine neue npm-Abhaengigkeit ohne ausdrueckliche Freigabe. Agent-Tools nutzen Node-Standardbibliothek.
- `monkey_work` darf nur Routing, Extraktion, Formatierung und Validierung ausfuehren; BC-/FiBu-Urteil, Posting-/Setup-Gates und Buchtext-Freigabe muessen zu `judge_work` oder `big_brain_review` eskalieren.

## Buchproduktionsstatus

- `labor-draft`: Laborbasierter Buchentwurf, noch nicht durchgaengig bewiesen.
- `labor-proven`: In `MCP_1_20260210` praktisch belegt, aber nicht deutsch final.
- `labor-blocked`: Laborlauf zeigt einen reproduzierbaren Blocker oder eine offene Ursache.
- `labor-sufficient-for-book-draft`: Gut genug fuer eine klar markierte Labor-/Vorproduktions-Buchstelle.
- `needs-german-final-rebuild`: Muss in deutscher Zielinstanz neu aufgebaut und bebildert werden.
- `german-final-candidate`: Kandidat fuer deutsche finale Evidence, sobald Zielinstanz existiert.
- `german-final-proof`: In deutscher Zielinstanz final belegt.

Fuer Buchaenderungen gilt: Interne Evidence, Coverage, State und Atlas duerfen Agenten-, Proof- und Rebuild-Sprache verwenden. Der Buchmaster und finale Buchdrafts nicht. Dort steht direkter Lesertext: Was sieht der Anfaenger in Business Central, warum ist der Schritt noetig, welcher Button oder welches Feld ist relevant, was passiert nach Speichern oder Buchen, welcher Fehler ist typisch und wie wird er korrigiert. Keine Formulierungen wie "Dieses Kapitel soll", "Evidence zeigt", "Dieser Screenshot beweist" oder "Spaeter muss noch" im Buchfliesstext.

Labor-Buchdrafts aus Evidence sind erlaubt, aber sie werden als Schulungsbuch geschrieben. Grenzen werden sachlich erklaert oder in interne To-do-/Evidence-Dateien ausgelagert. Keine finalen deutschen Claims aus `RM-DEMO`.

Vor jedem neuen fachlichen Buchclaim gilt die Quellenpruefung aus `playwright/projects/fibu-book5/BC-SOURCE-CLAIM-RULES.md`: eigene Universaarl-Evidence fuer UI-/Evidence-Claims, Microsoft Learn fuer Produkt-/Setupclaims, Microsoft Release Plan fuer releaseabhaengige Features, Implementation Guide/Success by Design fuer Projekt- und Best-Practice-Claims, amtliche deutsche/EU-Quellen fuer Rechts-, Steuer-, GoBD- und E-Rechnungsclaims. Ohne passende Quelle oder Evidence wird die Aussage nicht final in den Buchtext geschrieben.

Vor jeder wirksamen Aktion gilt zusaetzlich `.agent/SMART-DECISION-GATE.md`. Company-Erstellung, Company-Wechsel, Setup, Stammdaten, Drafts, Dialogbestaetigung, Wizard-Finish, Preview, Posting, Payment, Cleanup, Reversal, fachliche Buchmaster-Aenderungen und finale Coverage-/Atlas-Markierungen brauchen vorher eine Smart Decision Card in Case, Result oder Evidence README. Ohne Card wird die Aktion blockiert oder auf read-only Diagnose reduziert.

## Skill-/Capability-Lernen

- Skills, Capabilities und Playwright-Helper duerfen nur evidence-getrieben erweitert werden.
- Erlaubt ist Lernen, wenn ein aktuelles Result oder ein wiederholter Blocker zeigt, dass ein Muster fehlt: BC Lines/Subform Handling, Dropdown Value Discovery, Dialog/Confirm/Error Handling, Draft Lifecycle und Cleanup Proof, Posting/Preview Evidence Trace, Company-/Context-Dokumentation oder fokussierte Action-Inventare.
- Nicht erlaubt sind Skills auf Vorrat, Agenten-/Framework-Ausbau ohne aktuellen Blocker, grosse Architekturumbauten ohne praktischen Nutzen oder neue Dependencies ohne ausdrueckliche Freigabe.
- Neue oder geaenderte Skills muessen dem Vertrag in `.agent/skills/SKILL-CONTRACT.md` folgen und Zweck, Use/Do-not-use, Inputs, Output JSON Schema, Safety/Boundary Rules, Stop-if, Preferred taskClass, Kontextlimit und State-Update-Verhalten enthalten.
- Neue oder geaenderte Capabilities muessen eine reproduzierbare Faehigkeit, Inputs, Outputs, Gates/Boundaries, Playwright Touchpoints, Maturity und die begruendende Evidence oder den Blocker dokumentieren.
- Helper-Aenderungen brauchen einen kleinen passenden Probe/Test oder eine konkrete Evidence-Begruendung. Nach Skill-/Capability-/Helper-Aenderungen laufen mindestens `npm run agent:preflight`, `npm run check:encoding` und `git diff --check`.

## Aktueller Einstieg

Der aktuelle kompakte State verweist auf die in `.agent/state/current.json` genannte aktive Case-Datei.
Die konkrete Case-ID und der naechste sichere Schritt werden nicht mehr hier dupliziert, sondern aus `current.json` gelesen.
Fuer Fixed-Assets-Purchase-Invoice-Laeufe gilt: erst den echten Lines-/Type-Kontext beweisen, dann Zielwerte eingeben; Cleanup fuer Sandbox-Drafts bleibt Pflicht.

## Zero Open Questions

Der Autopilot darf eine fachliche, technische oder UI-bezogene Business-Central-Frage nicht als vage offen liegen lassen. Jede unklare Page, Card, List, Worksheet, jedes Feld, jede Action, jeder Dialog, jede Request Page, jeder Report, jede Tabelle, jeder Entry und jede Buchungswirkung bekommt entweder eine Antwort durch Universaarl-Evidence, Microsoft Learn, erlaubte AL-/Objektanalyse oder einen finalen Klassifikationsstatus aus `playwright/projects/fibu-book5/BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

Ungeklaerte Punkte werden in `.agent/state/open_questions_register.json` gefuehrt. Am Ende eines Laufs darf dort kein Item mit `status = "open"` stehen. Wenn etwas nicht zur Universaarl-Hauptcompany passt, entsteht ein Subcompany-/Spezialusecase oder ein finaler Status wie `requires-subcompany-usecase`, `not-applicable` oder `excluded-shopify`.
