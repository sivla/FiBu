# Project Dashboard Draft

Status: active-control
Purpose: Kompakte Projektleiter-Sicht fuer Universaarl Business Central Implementierung, Buch, Training, UAT und Playwright-Evidence.
Last reviewed: 2026-07-07

## Aktive Wahrheit

| Feld | Aktueller Stand |
| --- | --- |
| Zielwelt | `playthru / UNIVERSAARL-DE / Universaarl GmbH` |
| Projektphase | W2 Core Master Data: Debitor/Artikel bewiesen, VAT-/Posting-Boundary offen |
| Aktive Steuerungsquelle | `.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md` |
| Artefakt-Klassifikation | `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` |
| Geparkter Live-Case | `TARGET-073` |
| Letzter Resume-Pilot | `TARGET-075`, read-first, no-write, abgeschlossen |
| Aktiver Case | `FOUNDATION-READINESS-DECISION` |
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

M0 ist als Arbeitsrahmen nutzbar. Der naechste sinnvolle Fortschritt ist keine weitere Methodikschicht, sondern die ehrliche Foundation-Entscheidung aus TARGET-075, PWS-FF-002B und den bestehenden VAT-/Page-472-Blockern.

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
| Freeze/Resume | passed-for-read-first-history | TARGET-075 ist gelaufen; neue Live-Arbeit braucht trotzdem aktuellen Auth-/Case-Gate. |
| Finance Foundation | blocked-by-specific-gaps | Foundation-Decision aktuell halten: Page 314 und Page 472 active editor sind die harten UI-/Setup-Grenzen; TARGET-073B ist als no-write Proof gelaufen und blockiert. |
| VAT/USt, Dimensions, Posting Groups | partial/blocked | INLAND/VAT19 sichtbar, Page 472-Hauptoberflaeche und Page Inspection/Tabelle 325 bewiesen; VAT-Matrix-Schreibroute und Page 314 bleiben nicht posting-ready. |
| Master Data | customer-and-item-observed | Debitor `U-CUST-100 / Saarland Maschinenbau AG` ist fuer Debitorenkarten-Handbuch/Training nutzbar, aber nicht O2C-ready. Artikel `U-ITEM-HW100 / Steuerbox Standard U100` ist mit `STK`, `WARE`, `VAT19`, FIFO-Kontext, Einstandspreis `100,00` und VK-Preis `149,00` in echter `playthru`-Oberflaeche beobachtet. O2C/P2P bleibt bis VAT-/Posting-Boundary geparkt. |
| Buch/Handbuch/Training | draft-with-customer-card-module | Debitorenkarten-Training `TR-03-01A` ist als Draft vorhanden; Screenshots stammen aus echter `playthru`-Oberflaeche, nicht aus Mockups. |
| Playwright/Evidence | draft | Read-first Specs und Screenshot-QA stabilisieren; keine Legacy-Routen als aktive Tests nutzen. |
| Datenrealismus | active-control | Reale Business-Central-Oberflaeche und realistische fiktive Universaarl-Projektdaten nutzen; keine UI-Mockups, keine vertraulichen echten Kundendaten als Evidence oder Buchwahrheit. |
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
| DEC-019 | Foundation-/Master-Data-Route-Cards steuern Planung, aber keine Writes | accepted-as-framework, write-blocked |

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
5. Kein as-is Retry von TARGET-073 oder TARGET-073B; TARGET-073B ist konsumierte blockierte No-Write-Evidence.
6. `U-CUST-100` und `U-ITEM-HW100` sind als realistische fiktive Universaarl-Masterdaten nutzbar, aber noch nicht als Prozessfreigabe fuer O2C/P2P.
7. Naechster Schritt ist die `FOUNDATION-READINESS-DECISION`: vorhandene Debitor-/Artikel-Evidence konsumieren und VAT-/Posting-Boundaries klar entscheiden. Keine O2C/P2P-Belege, kein Preview, kein Posting.
8. Masterdaten sollen reale Business-Central-Oberflaechen und realistische fiktive Universaarl-Geschaeftspartner/Produkte verwenden, keine UI-Mockups und keine vertraulichen echten Kundendaten.

## Update rule

Aktualisiere dieses Dashboard nur, wenn sich aktive Wahrheit, Gate-Status, naechster erlaubter Schritt, Top-Risiko oder Top-Entscheidung geaendert hat.

Wenn nur eine Detaildatei besser wird, reicht die Detaildatei. Kein Dashboard-Edit nur als Aktivitaetsnachweis.
