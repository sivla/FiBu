# Telemetry Debugging Strategy

## Ziel

Telemetry hilft, technische Ereignisse hinter Business-Central-Fehlern sichtbar zu machen: Berechtigungsfehler, API-Fehler, langsame Pages, Job-Queue-Probleme, Extension-Ausnahmen und Session-Timelines.

## Wann Telemetry hilft

| Fall | Telemetry-Nutzen |
|---|---|
| Permission Error | Objekt, Permission Type, User, Company |
| Performance | Page, Duration, Session, Browser |
| API/OData Fehler | Status, Operation, Error |
| Job Queue Fehler | Job, Exception, Zeitpunkt |
| Extension Fehler | Extension, Object, Stack/Exception |
| Session Timeline | Reihenfolge der Operationen |

## Evidence-Grenzen

Telemetry beweist technische Ereignisse, aber nicht automatisch fachliche Richtigkeit. Eine Permission Exception zeigt nicht automatisch, welches Permission Set richtig waere. Eine langsame Page beweist nicht allein, ob Netzwerk, Browser, Datenmenge, Extension oder Serverlast die Ursache ist.

## KQL-Templates

`playwright/core/telemetry-query-builder.ts` erzeugt lokale KQL-Templates fuer:

- `permission-error`
- `page-view-performance`
- `api-error`
- `job-queue-error`
- `extension-error`
- `session-timeline`

Der Query Builder fuehrt keine Queries aus. Er baut nur sichere, zeitlich begrenzte Vorlagen und beschreibt Evidence-Nutzen sowie Grenzen.

## Datenschutz

- User IDs, E-Mails, Belegnummern und Kundennamen minimieren.
- Keine Secrets in KQL oder Evidence.
- Ergebnisse vor Commit anonymisieren.
- Keine Application-Insights-Verbindungsdaten im Repo speichern.
- Telemetry-Rohdaten nicht als Massendump versionieren.

## Evidence Pack Integration

Telemetry-Hinweise gehoeren in:

```text
06-telemetry.md
```

Dort werden Query-Zweck, relevante Felder, Ergebniszusammenfassung, Grenzen und offene Rueckfragen dokumentiert.

## Status

- Query Builder: lokal testbar.
- Live Application Insights: spaeter, read-only, mit separater Freigabe.
- Keine echte Telemetry-Ausfuehrung in lokalen Tests.
