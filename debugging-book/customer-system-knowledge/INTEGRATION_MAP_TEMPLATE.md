# Integration Map Template

## Ziel

Dieses Template beschreibt externe Schnittstellen und Automationen. Es hilft, Integrationstickets read-only zu triagieren, ohne Jobs, Flows oder Webhooks auszulösen.

## Integrationen

| Integration | System | Richtung | Technik | Kritikalitaet | Owner | Evidence |
|---|---|---|---|---|---|---|
|  |  | inbound / outbound / bidirektional | API/OData/MCP/EDI/Power Automate/File | niedrig / mittel / hoch |  | Logs/Telemetry/API read-only |

## Sicherheitsregeln

- Keine Integrationslaeufe starten.
- Keine Webhooks ausloesen.
- Keine Job Queue starten oder reaktivieren.
- Keine Payloads als Rohdump committen.
- API/OData nur read-only und mit minimalen Feldern.

## Diagnose-Hinweise

| Symptom | Naechster read-only Schritt |
|---|---|
| Status bleibt offen | Job Queue Logs und Integration Logs lesen |
| API meldet Fehler | Status/Error/API-Kontext und Telemetry pruefen |
| Daten fehlen extern | BC-Datensatzexistenz und Mapping read-only pruefen |
