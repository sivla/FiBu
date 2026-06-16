# Business Central Debugging Book

Dieses Repository ist ab diesem Branch kein allgemeines FiBu-/Business-Central-Prozessbuch mehr.

Der neue Fokus ist ein eigenstaendiges Debugging-Buch und ein spaeter ausfuehrbares Evidence-System fuer Microsoft Dynamics 365 Business Central:

- Kundentickets strukturiert verstehen
- Symptome, Fakten, Hypothesen und Tests trennen
- BC-Probleme ueber Page, Table, Field, Setup, Posting Result und Evidence eingrenzen
- reproduzierbare Evidence Packs aufbauen
- aus jedem Fall Buchwissen, Checklisten und Regressionstests machen

## Dateien

| Datei | Zweck |
|---|---|
| `DEBUGGING_BUCH.md` | neues Hauptmanuskript |
| `FEHLERJOURNAL.md` | wiederverwendbare Debugging-Faelle und Regeln aus dem alten Buchprojekt |
| `TICKETANALYSE_TEMPLATE.md` | Antwortstruktur fuer Kundentickets |
| `EVIDENCE_PACK_TEMPLATE.md` | Ordner- und Dateistruktur fuer Evidence Packs |
| `AGENT_REGELN.md` | Sicherheits-, Arbeits- und Schreibregeln fuer den Debugging-Agent |
| `SAFE_ACTION_POLICY.md` | klare Erlaubnis-/Stop-Regeln fuer autonome Aktionen |
| `RUNBOOK.md` | Schritt-fuer-Schritt-Ablauf vom Ticket zum Buchwissen |
| `DEBUGGING_AGENT_RUNBOOK.md` | operatives Runbook fuer Agenten, Consultants und Support |
| `PLAYWRIGHT_DEBUGGING_FOUNDATION.md` | Playwright-Regeln fuer BC-Debugging |
| `BC_DATA_ACCESS_STRATEGY.md` | wann UI, Page Inspection, API/OData/MCP und Telemetry genutzt werden |
| `OBJECT_MAPPING_STARTER.md` | Starter-Mapping von Page zu Table, Posted Document und Entries |
| `evidence/sample-001-inventory-posting-setup-missing/` | erster Sample-Evidence-Fall |
| `evidence/SAMPLE-001-missing-field/` | synthetischer Missing-Field-/Personalisierungsfall |
| `../playwright/` | minimale ausfuehrbare Test- und Evidence-Grundstruktur |

## Arbeitsregel

Das Buch ist praxisnah, aber nicht mehr an das alte Vollstaendigkeitsziel gebunden. Business Central bleibt der fachliche Gegenstand; Playwright, Page Inspection, API/OData, Telemetry und Evidence Packs sind Werkzeuge. Alte BC-/Playwright-Faelle bleiben als Lernmaterial erhalten, aber der Branch ist bewusst schlank.

## Nicht verhandelbar

- Production grundsaetzlich read-only behandeln.
- Keine Buchungen, Stornos, Zahlungen, E-Mails, Job-Queue-Starts oder Integrationslaeufe ohne ausdrueckliche Freigabe.
- Kundendaten anonymisieren, wenn sie in Buchtexte oder Screenshots wandern.
- Jede bestaetigte Ursache braucht Evidence.
- Jeder Fix braucht einen Regressionstest oder mindestens einen klaren Testplan.

## Start

```powershell
npm install
npm run check:debugging-book
npm run check:evidence
npm run check:safe-policy
npm run check:templates
npm run check:privacy
npm run check:runtime
npm run check:api
npm run check:scaffold
npm run new:evidence -- SAMPLE-002 "Permission error on posting preview"
```

Optionaler Live-BC-Smoke:

```powershell
npm run bc:sample
```

Der Live-Smoke laeuft nur, wenn `BC_URL` und ein gueltiger Auth-State vorhanden sind. Ohne `BC_URL` wird er uebersprungen.

## Governance as Code

Der Branch hat lokale Governance-Checks, die ohne BC-Zugang laufen:

| Kommando | Prueft |
|---|---|
| `npm run check:debugging-book` | Evidence Packs, Templates, Privacy Scan und Script-Setup |
| `npm run check:evidence` | Sample-Evidence-Struktur, Pflichtdateien, Root Cause, Regressionstest |
| `npm run check:safe-policy` | Safe-Action-Entscheidungen fuer Environment, Risiko, Freigabe und kritische Buttons |
| `npm run check:templates` | Pflichtabschnitte in Ticketanalyse- und Evidence-Pack-Template |
| `npm run check:privacy` | Privacy-Scanner gegen saubere und absichtlich schmutzige Fixtures |
| `npm run check:runtime` | sichere Runtime-Konfiguration, Schreibflags und optionale BC-Variablen |
| `npm run check:api` | mock-faehiger GET-only API/OData-Client mit URL-Redaktion |
| `npm run check:scaffold` | Evidence-Pack-Generator in Temp-Verzeichnissen |

Ein neuer Evidence-Fall wird als Ordner unter `evidence/` angelegt. Die Dateien `00-ticket-summary.md` bis `11-book-chapter-draft.md` sind Pflicht und muessen Inhalt haben. `12-lessons-learned.md`, `13-follow-up-questions.md` und `14-risk-notes.md` sind empfohlen; fehlende Dateien sind Warnungen, keine harten Fehler.

Neues Pack erzeugen:

```powershell
npm run new:evidence -- SAMPLE-002 "Permission error on posting preview"
```

Production bleibt read-only. Erlaubt sind Diagnose, Page Inspection und strukturierte Lesezugriffe mit minimalen Feldern. Jede Aktion mit Wirkung, zum Beispiel `Post`, `OK`, `Send`, `Start`, Buchung, Zahlung, Job Queue, Integration, Setup-, Stammdaten- oder Berechtigungsaenderung, braucht ausdrueckliche Freigabe mit Environment, Company, Zweck, Evidence-Plan und Rollback-Plan.

Grenzen: Die Validatoren pruefen Textstruktur und typische Leak-Muster in Markdown/JSON/TypeScript. Sie pruefen keine Screenshots, keine Binaerdateien, keine echten BC-Berechtigungen und ersetzen keinen Live-Test in Sandbox oder Production.
