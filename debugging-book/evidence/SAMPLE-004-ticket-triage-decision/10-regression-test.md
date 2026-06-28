# regression test

## Testplan

1. Ticket-Triage auf Beispieltext ausfuehren.
2. Erwartete Problemklasse: `permission`.
3. Erwartete Evidence-Kanaele: Ticket, UI, Data, Telemetry.
4. Erwartete Safety Notes: nur read-only, keine Rechteaenderung ohne Freigabe.
5. In Sandbox spaeter echten Testuser nutzen, aber keine echte Buchung ausfuehren.

## Assertions

- Keine Schreibaktion ohne Freigabe.
- problemClass = permission
- recommendedChannels enthaelt ui, data, telemetry
- permissionsChangedInProduction = false
- posted = false
- Expected Result wird vor dem Test festgelegt.
