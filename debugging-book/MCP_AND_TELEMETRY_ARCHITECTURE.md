# MCP and Telemetry Architecture for Business Central Debugging

## Ziel

Dieses Dokument trennt die drei Evidence-Kanaele fuer Business-Central-Debugging. Jeder Kanal beantwortet eine andere Frage. Erst zusammen ergeben sie belastbare Evidence fuer Hypothesen, Root Cause, Regressionstest und Buchwissen.

## Die drei Evidence-Kanaele

| Kanal | Werkzeug | Beweist | Beweist nicht |
|---|---|---|---|
| UI Evidence | Playwright / Playwright MCP | Was der User sieht | gespeicherte Daten oder Root Cause |
| Data Evidence | BC MCP / API / OData | gespeicherte Werte und Entries | User-Erlebnis oder Timing |
| Telemetry Evidence | Application Insights / BC Telemetry | technische Fehler, Dauer, Objekt, Extension, Session | fachliche Richtigkeit allein |

## Playwright vs. Playwright MCP

Playwright normal ist fuer reproduzierbare Tests, Screenshots und Regression gedacht. Es soll stabile Schritte abbilden, Locators kontrollieren und Ergebnisse wiederholbar machen.

Playwright MCP ist fuer explorative Agenten-Navigation geeignet: UI-Struktur lesen, Accessibility Snapshots auswerten, Hypothesen bilden und den naechsten sicheren read-only Schritt vorschlagen.

MCP-Erkenntnisse sind erst buchfaehig, wenn sie in einem Evidence Pack dokumentiert oder durch einen normalen Playwright-Test reproduzierbar werden. Ein explorativer UI-Befund allein ist keine bestaetigte Root Cause.

## Was BC MCP in diesem Projekt bedeutet

BC MCP bedeutet hier ein spaeterer eigener read-only MCP-Server oder Adapter, der Business-Central-Daten ueber sichere Tools verfuegbar macht.

BC MCP bedeutet nicht:

- Schreibzugriff auf Business Central.
- dass ein Agent in BC alles machen darf.
- automatische Freigabe fuer Buchungen, Zahlungen, Job Queue, Integrationen oder Setup-Aenderungen.

## BC MCP Tool-Klassen

| Tool-Klasse | Zweck |
|---|---|
| page_context | Page/Table/Feld-Kontext dokumentieren |
| record_lookup | Datensatz read-only suchen |
| ledger_trace | Postenspur read-only verfolgen |
| setup_check | Setup-Kombination read-only pruefen |
| permission_check | Rechte-/Permission-Hinweise strukturieren |
| job_queue_read | Job Queue Logs read-only lesen |
| telemetry_query | KQL-Templates oder anonymisierte Telemetry lesen |
| evidence_write_local | lokale Evidence-Dateien schreiben |

## Sicherheitsmodell

- Alle BC-MCP-Tools sind standardmaessig read-only.
- Schreibende BC-Tools werden nicht implementiert.
- Kritische Aktionen werden durch die Safe Action Policy blockiert.
- Secrets bleiben ausserhalb des Repos.
- Ergebnisse werden redigiert oder anonymisiert, bevor sie in Evidence Packs landen.
- `bc_write_local_evidence` schreibt nur lokale Dateien, niemals BC-Daten zurueck.

## Vom Ticket zur Multi-Channel Evidence

```text
Ticket -> UI Evidence -> Data Evidence -> Telemetry Evidence -> Hypothesenmatrix -> Root Cause -> Regressionstest -> Buchregel
```

## Grenzen

- MCP ersetzt keine Freigabe.
- MCP ersetzt keine fachliche Pruefung.
- Telemetry beweist technische Ereignisse, nicht automatisch fachliche Wahrheit.
- API/OData zeigt gespeicherte Daten, nicht automatisch UI-Sichtbarkeit.
- Playwright MCP Exploration ist kein Ersatz fuer stabile Regressionstests.
