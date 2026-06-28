# Customer Context and Ticket Triage

## Ziel

Der Agent soll sich wie ein Business-Central-Experte verhalten, der sowohl BC-Standard als auch das Kundensystem kennt. Dieses Dokument beschreibt die lokale Vorbereitung dafuer. Es erzwingt keine Live-Zugriffe und enthaelt keine echten Kundendaten.

## Wissensschichten

| Schicht | Inhalt | Quelle |
|---|---|---|
| BC-Expertenwissen | Standardprozesse, typische Fehlerklassen, Pages, Tabellen, Posting, Permissions | Buch, Templates, Code |
| Kundensystemwissen | Prozesse, Extensions, Integrationen, Berechtigungen, Known Issues | `customer-system-knowledge/` |
| Evidence-Wissen | UI, Data, Telemetry, Root Cause, Regression | Evidence Packs |

## Ticket-Triage-Ziel

Ein Ticket soll zuerst eingeordnet werden, bevor irgendeine Aktion in BC passiert:

```text
Ticket -> Fakten -> Problemklasse -> Kundenkontext -> beste Evidence-Kanaele -> sichere naechste Schritte -> Rueckfragen
```

## Problemklassen

| Klasse | Typischer Befund | Sinnvoller naechster Schritt |
|---|---|---|
| Bedienhilfe | Kunde findet Feld, Page oder Aktion nicht | UI/Page/Profile read-only pruefen |
| Setup/Konfiguration | Posting Group, Dimension, Nummernserie, Setup fehlt | Setup-Kombination read-only pruefen |
| Berechtigung | Permission, Execute, TableData, Security Filter | Permission-Kontext und Telemetry vorbereiten |
| Standardgrenze | Kunde erwartet Verhalten, das Standard nicht kann | Standardverhalten belegen, Alternative formulieren |
| Bug | Exception, reproduzierbarer Fehler, Extension-Hinweis | Repro, Telemetry, Codekontext, Regression |
| Datenproblem | Status, Entries, Beleg, Bestand, Datensatz | Data Evidence read-only sammeln |
| Integration | API, OData, EDI, Job, externes System | Logs/Telemetry/API read-only pruefen |
| Performance | langsam, Timeout, Haenger | UI-Zeitpunkt und Telemetry vorbereiten |
| Unklar | zu wenig Kontext | gezielte Rueckfragen |

## Lokale Module

| Modul | Zweck |
|---|---|
| `playwright/core/customer-context.ts` | Kundenkontext typisieren und auf sensible Rohwerte pruefen |
| `playwright/core/ticket-triage.ts` | Tickettext lokal klassifizieren und Evidence-Plan vorschlagen |

## Sicherheitsgrenzen

- Triage fuehrt keine BC-Aktion aus.
- Kundenkontext darf keine Secrets, Tokens, Auth-State oder personenbezogene Rohdaten enthalten.
- Unknown Environment blockiert jede konkrete Runtime-Aktion.
- Schreibende Aktionen bleiben durch Safe Action Policy gesperrt.

## Mac-Weiterarbeit

Wenn das Repo spaeter auf dem Mac mit echten Zugaengen laeuft, koennen lokale Kundenkontexte, Sandbox-Konfiguration, Auth-State und Application-Insights-Zugriff separat eingebunden werden. Diese Werte bleiben ausserhalb des Repos.
