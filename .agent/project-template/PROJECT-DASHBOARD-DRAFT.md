# Project Dashboard Draft

Status: active-control
Purpose: Kompakte Projektleiter-Sicht fuer Universaarl Business Central Implementierung, Buch, Training, UAT und Playwright-Evidence.
Last reviewed: 2026-07-08

## Aktive Wahrheit

| Feld | Aktueller Stand |
| --- | --- |
| Zielwelt | `playthru / UNIVERSAARL-DE / Universaarl GmbH` |
| Projektphase | W1/W2 Boundary: Foundation konsolidieren, Debitor/Artikel als Training/Handbuch-Evidence nutzen, O2C/P2P weiter gesperrt |
| Aktive Steuerungsquelle | `.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md` |
| Artefakt-Klassifikation | `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` |
| Geparkter Live-Case | `TARGET-073` |
| Letzter Resume-Pilot | `TARGET-075`, read-first, no-write, abgeschlossen |
| Aktiver Case | `FOUNDATION-SETUP-PACKAGE-TABLE-MAPPING-SOURCE-DECISION` |
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
| Realistische Universaarl-Datenpakete | active-work, Jira-ready but not BC-setup-ready |
| Foundation setup route decisions | active-work: Feldkarte erstellt; Konfigurationspakete-Seite und bestehendes Paket `U-VAT325-DISC` sind read-first bewiesen. `U-VAT325-DISC` hat 0 Tabellen/0 Datensaetze und bleibt geparkter Route-Kandidat; naechster Schritt ist lokale Tabellen-/Feld-Mapping-Entscheidung vor jedem Paket-/Setup-Write. |
| Read-first WS02/WS03/WS04 scenario catalog | active-work for read-first Playwright planning |

## Workstream readiness

| Bereich | Status | Naechste sinnvolle Aktion |
| --- | --- | --- |
| Projektsteuerung | usable-draft | Roadmap, Dashboard, State und Klassifikation schlank synchron halten. |
| Freeze/Resume | passed-for-read-first-history | TARGET-075 ist gelaufen; neue Live-Arbeit braucht trotzdem aktuellen Auth-/Case-Gate. |
| Finance Foundation | blocked-by-specific-gaps | Feldkarte fuer General Posting Setup und VAT Posting Setup ist erstellt; Konfigurationspakete sind als Seite erreichbar, `U-VAT325-DISC` existiert mit 0 Tabellen/0 Datensaetzen. Naechster Schritt ist lokale source-backed Tabellen-/Feld-Mapping-Entscheidung; kein Paket-/Setup-Write. |
| VAT/USt, Dimensions, Posting Groups | partial/blocked | INLAND/VAT19-Kontext und Page 472/Page-Inspection sind nutzbar, aber keine gespeicherte vollstaendige Setup-Matrix. Page 314 bleibt partiell und nicht posting-ready. |
| Master Data | customer-and-item-observed | Debitor `U-CUST-100 / Saarland Maschinenbau AG` ist fuer Debitorenkarten-Handbuch/Training nutzbar, aber nicht O2C-ready. Artikel `U-ITEM-HW100 / Steuerbox Standard U100` ist mit `STK`, `WARE`, `VAT19`, FIFO-Kontext, Einstandspreis `100,00` und VK-Preis `149,00` in echter `playthru`-Oberflaeche beobachtet. O2C/P2P bleibt bis VAT-/Posting-Boundary geparkt. |
| Buch/Handbuch/Training | chapter-9-boundary-integrated | Debitorenkarten-Training `TR-03-01A`, Artikelkarten-Training `TR-03-03` und Kapitel 9 nutzen `U-CUST-100`/`U-ITEM-HW100` als realistische fiktive Universaarl-Beispiele. Das ist Schulungs-/Handbuchsubstanz, aber keine O2C/P2P-Freigabe. |
| Playwright/Evidence | draft | Read-first Specs und Screenshot-QA stabilisieren; keine Legacy-Routen als aktive Tests nutzen. |
| Datenrealismus | active-control | Reale Business-Central-Oberflaeche und kundenprojektartige Universaarl-Daten mit Zweck, Owner, Abhaengigkeiten, UAT-/Trainingsnutzen und Setup-Readiness nutzen. Daten duerfen fiktiv oder anonymisiert sein, muessen sich aber wie echte Kundenprojektdaten verhalten. Keine UI-Mockups, keine Wegwerf-Dummydaten und keine vertraulichen echten Kundendaten als Evidence oder Buchwahrheit. |
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
7. Naechster Schritt ist kein O2C/P2P-Beleg, kein Repeat von `VAT-POSTING-SETUP-READFIRST` und kein Setup-Write. Jetzt `FOUNDATION-SETUP-PACKAGE-TABLE-MAPPING-SOURCE-DECISION` lokal ausfuehren: genaue Tabellen, Felder, Werte, Validierungen und Keep/Cleanup-Regel fuer den Paketweg entscheiden.
8. Masterdaten sollen reale Business-Central-Oberflaechen und kundenprojektartige Universaarl-Geschaeftspartner/Produkte verwenden: realistisch, fachlich begruendet, UAT-/Training-tauglich und setup-abhaengig. Keine UI-Mockups, keine Wegwerf-Dummydaten und keine vertraulichen echten Kundendaten.

## Update rule

Aktualisiere dieses Dashboard nur, wenn sich aktive Wahrheit, Gate-Status, naechster erlaubter Schritt, Top-Risiko oder Top-Entscheidung geaendert hat.

Wenn nur eine Detaildatei besser wird, reicht die Detaildatei. Kein Dashboard-Edit nur als Aktivitaetsnachweis.
