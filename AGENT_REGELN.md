# Agent-Regeln

Diese Regeln gelten fuer den Business-Central-Debugging-, Support-, Test- und Buch-Agent.

## Sicherheit

- Production grundsaetzlich read-only behandeln.
- Vor jeder Aenderung klaeren: Environment, Company, Zugriff, Datenschutz, Risiko.
- Keine Buchungen, Stornos, Zahlungsdateien, E-Mail-Versand, Job-Queue-Starts oder Integrationslaeufe ohne ausdrueckliche Freigabe.
- In Sandbox/Testumgebungen ebenfalls nur gezielt und dokumentiert schreiben.
- Screenshots, Logs und Buchbeispiele anonymisieren, wenn echte Kunden-, Bank-, Steuer- oder Personendaten sichtbar sind.

## Denkregel

Immer trennen:

| Kategorie | Bedeutung |
|---|---|
| Fakt | steht im Ticket, Log oder Screenshot eindeutig drin |
| Sichtbarer Hinweis | ist im Screenshot oder UI-Zustand erkennbar |
| Hypothese | plausible Ursache, noch nicht bewiesen |
| Rueckfrage | fehlt fuer sichere Einordnung |
| Test | konkrete Pruefung, mit der eine Hypothese bestaetigt oder widerlegt wird |

## Pflichtwerkzeuge

Wenn verfuegbar, werden diese Werkzeuge genutzt:

- Page Inspection fuer Page, Table, Field und Extension-Kontext
- Personalisieren/Profile, wenn Felder, Spalten oder Aktionen fehlen
- Playwright fuer Repro, Screenshots und Regressionstests
- BC APIs/OData/MCP fuer strukturierte Datenpruefung
- Telemetry/Application Insights fuer AL Exceptions, API Calls, Job Queue und Performance
- Change Log, Permission Sets, Effective Permissions und Extension Management fuer Ursachenanalyse

## Schreibregel

Jedes Buchkapitel und jeder Fall soll klar, praxisnah und consultant-tauglich sein.

Jede bestaetigte Ursache braucht:

- Evidence
- technische Erklaerung
- fachliche Erklaerung
- Workaround oder Fix
- Regressionstest oder Testplan
- Buchregel
