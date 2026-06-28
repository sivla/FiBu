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
| Runtime-Konfiguration | lokal getestet | 4 | keine echte Auth-/Login-Strecke | Sandbox-Setup dokumentiert ausfuehren |
| Read-only API Client | mock-getestet | 3 | kein echter Auth-Flow, keine BC-Endpunkte | ersten erlaubten GET gegen Sandbox modellieren |
| Evidence Scaffold | lokal getestet | 5 | kein interaktiver Generator | bei echten Tickets als Startpunkt nutzen |
| BC MCP Tool Spec | dokumentiert + Registry getestet | 3 | kein echter MCP-Server | read-only Server-Adapter spaeter |
| Playwright MCP Strategy | dokumentiert | 2 | nicht angebunden | Explorationsablauf mit Safe Checks testen |
| Telemetry Query Builder | lokal getestet | 3 | keine Live Application Insights | read-only AI-Verbindung spaeter |
| Customer Context | Templates + Typen getestet | 3 | keine echten Kundendaten | lokalen Kundenkontext auf Mac pflegen |
| Ticket Triage Engine | lokal heuristisch getestet | 3 | keine LLM-/Live-Ausfuehrung | mit echten Ticketbeispielen kalibrieren |

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
| `SAMPLE-003-permission-telemetry` | synthetisch | 4 | keine echte Telemetry | als Vorlage fuer Permission+Telemetry-Faelle nutzen |

## Playwright-/Ausfuehrbarkeits-Coverage

| Bereich | Status | Score | Fehlende Bausteine | Naechster Schritt |
|---|---|---:|---|---|
| Evidence-Pack-Pflichtdateien | getestet + strukturvalidiert | 5 | keine | beibehalten |
| Safe-Action-Policy | breit getestet | 5 | echte Laufzeit-Integration | Policy in Agent-Routinen erzwingen |
| Template-Sektionen | getestet | 5 | keine Feldwert-Pruefung | bei Bedarf Pflichtfeldwerte pruefen |
| Privacy-Scanner | getestet | 4 | keine Bildanalyse, kein volles DLP | Scanner gegen neue Leak-Muster erweitern |
| Live-BC-Smoke | optional, skippt ohne `BC_URL` | 2 | Browser/Auth/BC_URL nicht eingerichtet | Sandbox-Konfiguration dokumentieren |
| API/OData/MCP | GET-only Client-Fundament vorhanden | 3 | keine Auth-Implementierung, kein echter BC-Call | erster mockbarer read-only Datencheck |
| Telemetry | Strategie vorhanden | 2 | keine Implementierung | Beispiel-Query/Logstruktur spaeter |
| Runtime Config | lokal getestet | 4 | keine echte `.env` im Repo | echte Sandbox-Werte lokal setzen |
| Evidence Scaffold | lokal getestet | 5 | keine | fuer neue synthetische und echte Faelle verwenden |
| BC MCP Runtime | Mock/Registry vorhanden | 3 | kein echter MCP-Server, kein Tenant-Zugriff | Tool-Adapter fuer read-only Daten bauen |
| Telemetry Query Builder | lokal getestet | 3 | keine Live-Ausfuehrung | Application-Insights-Zugriff separat klaeren |
| Live App Insights | Strategie vorhanden | 1 | keine Verbindung, keine Freigabe | read-only Zugriffskonzept erstellen |
| Customer Context Checks | lokal getestet | 3 | keine echten Kundenkontexte | sichere lokale Context-Dateien spaeter |
| Ticket Triage | lokal getestet | 3 | heuristisch, nicht final | mit gelosten Tickets trainieren/schaerfen |

## Risiken

- Lokale Validatoren sind Governance-Checks, aber kein Ersatz fuer echte Business-Central-Tests.
- Sample-Faelle sind nicht gleich echte Kundentickets.
- Synthetische Evidence ist Lernmaterial, nicht automatisch ein Live-Beleg.
- Page IDs und Table IDs in synthetischen Faellen sind Annahmen, bis Page Inspection sie bestaetigt.
- Playwright kann ohne Browser/Auth/BC_URL nur lokale Strukturchecks ausfuehren.
- Der Read-only API Client ist mock-getestet, aber noch kein vollstaendiger BC-Auth-Client.
- BC MCP ist Tool-Spec und Registry, aber noch kein Live-MCP-Server.
- Playwright MCP ist Strategie, aber noch nicht angebunden.
- Telemetry Query Builder erzeugt Templates, fuehrt aber keine Application-Insights-Queries aus.
- Customer Context ist nur Template/Typmodell, noch kein echtes Kundenwissen.
- Ticket Triage ist heuristisch und ersetzt keine Consultant-Pruefung.
- Runtime Config prueft Sicherheitsflags, stellt aber keine Secrets bereit.
- Telemetry bleibt Strategie, solange keine Application-Insights-Anbindung existiert.
- Privacy-Scanner findet typische Text-Leaks, ist aber kein vollstaendiges DLP und prueft keine Bilder.
- Safe-Action-Policy ist getestet, muss aber in echten Agentenlaeufen vor kritischen Klicks konsequent aufgerufen werden.

## Naechste 5 Prioritaeten

1. Ersten echten read-only Sandbox-Fall mit Page Inspection und Screenshot-Evidence erzeugen.
2. Erste lokale Sandbox-Konfiguration mit `BC_URL` und Auth-State dokumentiert testen.
3. API/OData/MCP-Read-only-Datencheck als kleines GET-Beispiel ergaenzen.
4. Telemetry-Query gegen anonymisierte Demo-Daten validieren.
5. Erste anonymisierte echte Tickets gegen Ticket Triage kalibrieren.
