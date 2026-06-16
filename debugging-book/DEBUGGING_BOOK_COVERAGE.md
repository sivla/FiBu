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
| Evidence Packs schreiben | Template + Samples | 4 | echte Kundendaten-Anonymisierung | Anonymisierungscheck ausbauen |

## Template-Coverage

| Artefakt | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| `TICKETANALYSE_TEMPLATE.md` | brauchbar | 4 | automatische Pflichtfeldpruefung | Test fuer Template-Abschnitte schreiben |
| `EVIDENCE_PACK_TEMPLATE.md` | brauchbar | 4 | optionale Ordner nicht getestet | Generator/Scaffold-Skript spaeter |
| `DEBUGGING_AGENT_RUNBOOK.md` | brauchbar | 3 | noch nicht in echtem Fall genutzt | ersten echten read-only Fall abarbeiten |
| `SAFE_ACTION_POLICY.md` | testbar | 4 | mehr Aktionsklassen in TS abbilden | `safe-actions.ts` an Markdown angleichen |
| `PLAYWRIGHT_DEBUGGING_FOUNDATION.md` | brauchbar | 3 | konkrete Codebeispiele | kleine Locator-Beispiele ergaenzen |

## Evidence-Coverage

| Fall | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| `SAMPLE-001-missing-field` | synthetisch, vollstaendig | 4 | keine echte Page Inspection | in Sandbox read-only gegen Sales Order pruefen |
| `sample-001-inventory-posting-setup-missing` | synthetisch/laborbasiert | 4 | keine aktuelle Live-Repro | Datencheck-Variante per API/OData skizzieren |

## Playwright-/Ausfuehrbarkeits-Coverage

| Bereich | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| Evidence-Pack-Pflichtdateien | getestet | 5 | keine | beibehalten |
| Safe-Action-Policy | teilweise getestet | 4 | Markdown/TS nicht voll synchron | weitere Tests fuer Datenexport/Integration |
| Live-BC-Smoke | optional, skippt ohne `BC_URL` | 2 | Browser/Auth/BC_URL nicht eingerichtet | Sandbox-Konfiguration dokumentieren |
| API/OData/MCP | Strategie vorhanden | 2 | keine Implementierung | erster read-only Datencheck |
| Telemetry | Strategie vorhanden | 2 | keine Implementierung | Beispiel-Query/Logstruktur spaeter |

## Risiken

- Sample-Faelle sind nicht gleich echte Kundentickets.
- Page IDs und Table IDs in synthetischen Faellen sind Annahmen, bis Page Inspection sie bestaetigt.
- Playwright kann ohne Browser/Auth/BC_URL nur lokale Strukturchecks ausfuehren.
- Safe-Action-Policy ist streng, aber noch nicht vollstaendig automatisiert.
- Datenschutzpruefung ist textuell vorhanden, aber noch kein robuster Scanner.

## Naechste 5 Prioritaeten

1. Ersten echten read-only Sandbox-Fall mit Page Inspection und Screenshot-Evidence erzeugen.
2. `safe-actions.ts` an die vollstaendige `SAFE_ACTION_POLICY.md` angleichen.
3. Template-Pflichtabschnitte maschinell pruefen.
4. API/OData/MCP-Read-only-Datencheck als kleines Beispiel ergaenzen.
5. Anonymisierungs- und Screenshot-Governance weiter schaerfen.
