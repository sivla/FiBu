# Project Dashboard Draft

Status: active-control
Purpose: Kompakte Projektleiter-Sicht fuer Universaarl Business Central Implementierung, Buch, Training, UAT und Playwright-Evidence.
Last reviewed: 2026-07-06

## Aktive Wahrheit

| Feld | Aktueller Stand |
| --- | --- |
| Zielwelt | `playthru / UNIVERSAARL-DE / Universaarl GmbH` |
| Projektphase | Improvement Freeze / M0-M1 Uebergang |
| Aktive Steuerungsquelle | `.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md` |
| Artefakt-Klassifikation | `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` |
| Geparkter Live-Case | `TARGET-073` |
| Erster erlaubter Resume-Pilot | `TARGET-075`, read-first, no-write |
| Legacy-Grenze | RM-DEMO, MCP_1_20260210, CRONUS, Rhein-Main und RM-* sind keine aktive Projektwahrheit. |

## Steuerungsregel

Dieses Dashboard ist keine Datei-Inventarliste und keine Queue. Es beantwortet nur:

1. Was ist gerade aktiv?
2. Was darf als Naechstes passieren?
3. Welche Gates blockieren Live-Arbeit?
4. Welche Risiken und Entscheidungen muessen sichtbar bleiben?

Detaildateien werden ueber `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` eingeordnet. Wenn ein Detailentwurf nicht dort oder in der Roadmap als aktiv genannt ist, steuert er keine naechste Aktion.

## Aktueller Meilenstein

Current milestone: `M0 Project mobilized`

M0 ist weitgehend entworfen, aber noch nicht als voll abgenommen zu behandeln. Der naechste sinnvolle Fortschritt ist keine weitere Methodikschicht, sondern ein sauberer Freeze/Resume-Uebergang mit `TARGET-075` als lesendem Foundation-Pilot.

## Overall status

| Bereich | Status |
| --- | --- |
| Universaarl Execution Roadmap | active-control |
| Artifact classification | active-control |
| Agent operating model | reference |
| Data request Jira candidates | reference/active-work when master-data planning resumes |
| Data request realism review | reference |
| Simulated core/master data tables | active-work, Jira-ready but not BC-setup-ready |
| Foundation/master-data route decisions | active-work before setup or master-data writes |
| Read-first WS02/WS03/WS04 scenario catalog | active-work for read-first Playwright planning |

## Workstream readiness

| Bereich | Status | Naechste sinnvolle Aktion |
| --- | --- | --- |
| Projektsteuerung | usable-draft | Roadmap, Dashboard, State und Klassifikation schlank synchron halten. |
| Freeze/Resume | gated | Lokale Freeze/Resume-Checks ausfuehren, bevor Business Central oder Playwright live laufen. |
| Finance Foundation | pending-read-first | `TARGET-075` fuer Kontenplan/Foundation-Kontext lesen, keine Writes. |
| VAT/USt, Dimensions, Posting Groups | planned | Erst nach TARGET-075 als read-first Proofs angehen. |
| Master Data | planned-blocked | Erst nach Foundation Readiness Decision in BC schreiben. |
| Buch/Handbuch/Training | draft | Nur auf Basis offizieller Quellen, Universaarl-Evidence oder klar markierter Annahmen ausbauen. |
| Playwright/Evidence | draft | Read-first Specs und Screenshot-QA stabilisieren; keine Legacy-Routen als aktive Tests nutzen. |
| Legacy-Decommission | active-work | Legacy nur inventarisieren, neutralisieren, portieren oder parken; Evidence nicht blind loeschen. |

## Top open decisions

| ID | Entscheidung | Status |
| --- | --- | --- |
| DEC-001 | Repo als realistisches Business-Central-Kundenprojekt fuehren | accepted |
| DEC-005 | Offizielle Microsoft-/BC-Quellen stehen ueber Community-Quellen | accepted |
| DEC-009 | Training muss rollenbezogen und evidence-backed sein | accepted |
| DEC-010 | Realismus ist Qualitaetsgate fuer Projekt, Buch und Training | accepted |
| DEC-017 | Universaarl Implementation Operating System ist aktive Wahrheit | accepted |
| DEC-018 | Deutsch ist fuehrende Projekt- und Buchsprache | accepted |

## Top active risks

| ID | Risiko | Severity | Steuerung |
| --- | --- | --- | --- |
| RISK-001 | Rohprotokolle werden zu Buchtext | P0 | Buchtext nur kuratiert, ohne Agenten-/Evidence-Meta. |
| RISK-002 | Fehlende Kundendaten fuehren zu willkuerlichem Setup | P0 | Datenpakete und Route Decisions vor Writes. |
| RISK-005 | VAT/Compliance-Claims ueberziehen die Evidence | P0 | Produktlogik, lokale Evidence und amtliche Quellen trennen. |
| RISK-004 | Playwright-Routen sind nicht wiederholbar | P1 | Read-first Proof, Screenshot-QA und Helper-Learning nutzen. |
| RISK-018 | Legacy bleibt aktive Steuerungswahrheit | P0 | Klassifikation, Legacy-Check und Universaarl-first README nutzen. |
| RISK-019 | Projektartefakte bleiben sprachlich gemischt | P1 | Substanzielle Edits auf deutsche Leserfuehrung umstellen. |

## Next recommended work

1. Keine neue Methodikdatei anlegen.
2. Naechsten kleinen Batch waehlen, der aktive Steuerung, Legacy-Isolation oder Universaarl-Readiness verbessert.
3. Vor Live-Arbeit: `agent:preflight`, `check:encoding`, `agent:quality:audit`, `agent:resume:check || true`, `agent:freeze:status || true`.
4. `TARGET-073` bleibt geparkt.
5. Live-Resume nur mit `TARGET-075`, read-first und no-write.
6. Nach `TARGET-075`: `FOUNDATION-READINESS-DECISION.md` erstellen oder aktualisieren.

## Update rule

Aktualisiere dieses Dashboard nur, wenn sich aktive Wahrheit, Gate-Status, naechster erlaubter Schritt, Top-Risiko oder Top-Entscheidung geaendert hat.

Wenn nur eine Detaildatei besser wird, reicht die Detaildatei. Kein Dashboard-Edit nur als Aktivitaetsnachweis.
