# Customer Context Template

## Ziel

Dieses Template beschreibt einen Kundenkontext ohne Secrets und ohne echte personenbezogene Daten. Es dient dem Agenten als lokales Wissensmodell fuer Ticket-Triage und Diagnoseplanung.

## Kunde

| Feld | Wert |
|---|---|
| Kundenkuerzel |  |
| Branche |  |
| BC-Version |  |
| Hosting | SaaS / On-Prem / unbekannt |
| Standardnaehe | Standard / leichte Anpassung / stark angepasst / unbekannt |
| Hauptprozesse |  |
| Kritische Module | Finance / Sales / Purchase / Inventory / Warehouse / Service / Manufacturing / Projects / Integration |
| Production-Regel | read-only |

## Systemlandschaft

| Bereich | Beschreibung |
|---|---|
| Environments | Production, Sandbox, Test, Training |
| Companies |  |
| Integrationen |  |
| Job Queues |  |
| Reporting/BI |  |
| Externe Systeme |  |

## Diagnose-Hinweise

| Thema | Kundenregel |
|---|---|
| Standardverhalten |  |
| bekannte Sonderlogik |  |
| haeufige Bedienfehler |  |
| riskante Bereiche |  |
| erlaubte Evidence | anonymisiert / synthetisch / nur lokal |

## Grenzen

- Keine Secrets.
- Keine echten Zugangsdaten.
- Keine Rohdaten aus Production.
- Keine Auth-State-, Cookie- oder Token-Pfade committen.
