# Debugging Book Coverage

## Ziel

Diese Datei bewertet ehrlich, wie weit das Business Central Debugging Book und das Evidence-System bereits tragfaehig sind. Konzept, Template und Sample sind noch kein echter Kundenzugriff.

## Reifegrad-Skala

| Score | Bedeutung |
|---:|---|
| 0 | nicht vorhanden |
| 1 | Stichwort |
| 2 | grober Entwurf |
| 3 | brauchbares Kapitel |
| 4 | mit Beispiel/Evidence verknuepft |
| 5 | getestet, Evidence vorhanden, Regression/Checkliste vorhanden |

## Kapitel-Coverage

| Kapitel | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| Was BC-Debugging bedeutet | Entwurf | 3 | echter Ticketfall | mit Sample-Fall verlinken |
| Page/Table/Field/Entry-Denkmodell | Entwurf | 3 | mehr Object-Mapping | `OBJECT_MAPPING_STARTER.md` erweitern |
| Oberflaeche debuggen | Beispiel vorhanden | 4 | Live-Screenshot/Page Inspection | Missing-Field-Fall live read-only nachstellen |
| Page Inspection | Entwurf | 3 | echte Page-ID-Beispiele | erster read-only BC-Fall |
| Berechtigungen debuggen | Backlog | 1 | Permission-Beispiel | synthetischen Permission-Fall anlegen |
| Posting Groups debuggen | Sample vorhanden | 4 | Live-Regression | Inventory-Posting-Sample als Testplan schaerfen |
| Playwright fuer BC-Debugging | Grundlage vorhanden | 3 | Live-Smoke mit Auth | `bc:sample` mit Sandbox laufen lassen |
| Evidence Packs schreiben | Template + Samples + Validator | 5 | echte Kundendaten-Anonymisierung | ersten echten read-only Fall validieren |
| Datenschutz/Anonymisierung | Privacy-Scanner vorhanden | 4 | kein vollstaendiges DLP, keine Bildanalyse | Scanner-Regeln anhand echter Review-Funde schaerfen |

## Template-Coverage

| Artefakt | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| `TICKETANALYSE_TEMPLATE.md` | getestet | 5 | keine Pflichtfeldwerte-Pruefung | Feldwert-Validator spaeter |
| `EVIDENCE_PACK_TEMPLATE.md` | getestet | 5 | optionale Ordner nicht getestet | Generator/Scaffold-Skript spaeter |
| `DEBUGGING_AGENT_RUNBOOK.md` | brauchbar | 3 | noch nicht in echtem Fall genutzt | ersten echten read-only Fall abarbeiten |
| `SAFE_ACTION_POLICY.md` | maschinenlesbar getestet | 5 | UI-Integration in echte Agentenlaeufe | Policy vor jedem kritischen Locator-Klick nutzen |
| `PLAYWRIGHT_DEBUGGING_FOUNDATION.md` | brauchbar | 3 | konkrete Codebeispiele | kleine Locator-Beispiele ergaenzen |

## Evidence-Coverage

| Fall | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| `SAMPLE-001-missing-field` | synthetisch, vollstaendig | 4 | keine echte Page Inspection | in Sandbox read-only gegen Sales Order pruefen |
| `sample-001-inventory-posting-setup-missing` | synthetisch/laborbasiert | 4 | keine aktuelle Live-Repro | Datencheck-Variante per API/OData skizzieren |

## Playwright-/Ausfuehrbarkeits-Coverage

| Bereich | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| Evidence-Pack-Pflichtdateien | getestet + strukturvalidiert | 5 | keine | beibehalten |
| Safe-Action-Policy | breit getestet | 5 | echte Laufzeit-Integration | Policy in Agent-Routinen erzwingen |
| Template-Sektionen | getestet | 5 | keine Feldwert-Pruefung | bei Bedarf Pflichtfeldwerte pruefen |
| Privacy-Scanner | getestet | 4 | keine Bildanalyse, kein volles DLP | Scanner gegen neue Leak-Muster erweitern |
| Live-BC-Smoke | optional, skippt ohne `BC_URL` | 2 | Browser/Auth/BC_URL nicht eingerichtet | Sandbox-Konfiguration dokumentieren |
| API/OData/MCP | Strategie vorhanden | 2 | keine Implementierung | erster read-only Datencheck |
| Telemetry | Strategie vorhanden | 2 | keine Implementierung | Beispiel-Query/Logstruktur spaeter |

## Risiken

- Lokale Validatoren sind Governance-Checks, aber kein Ersatz fuer echte Business-Central-Tests.
- Sample-Faelle sind nicht gleich echte Kundentickets.
- Synthetische Evidence ist Lernmaterial, nicht automatisch ein Live-Beleg.
- Page IDs und Table IDs in synthetischen Faellen sind Annahmen, bis Page Inspection sie bestaetigt.
- Playwright kann ohne Browser/Auth/BC_URL nur lokale Strukturchecks ausfuehren.
- Privacy-Scanner findet typische Text-Leaks, ist aber kein vollstaendiges DLP und prueft keine Bilder.
- Safe-Action-Policy ist getestet, muss aber in echten Agentenlaeufen vor kritischen Klicks konsequent aufgerufen werden.

## Naechste 5 Prioritaeten

1. Ersten echten read-only Sandbox-Fall mit Page Inspection und Screenshot-Evidence erzeugen.
2. Safe-Action-Policy in echte Agenten-/Playwright-Flows integrieren.
3. Evidence-Scaffold fuer neue Faelle erzeugen.
4. API/OData/MCP-Read-only-Datencheck als kleines Beispiel ergaenzen.
5. Anonymisierungs- und Screenshot-Governance weiter schaerfen.
