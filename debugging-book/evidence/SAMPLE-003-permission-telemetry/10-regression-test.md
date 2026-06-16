# regression test

## Testplan

1. In Sandbox/Testumgebung mit Testuser und dokumentierter Rolle starten.
2. Buchungsvorschau oder betroffene Aktion nur soweit ausfuehren, wie keine Buchung entsteht.
3. Erwarteten Permission-Kontext read-only pruefen.
4. Telemetry-Query fuer Permission Error mit kleinem Zeitfenster vorbereiten.
5. Nach Fix/Freigabe pruefen, dass der alte Permission-Fehler nicht mehr auftritt.
6. Keine echte Buchung, Zahlung, E-Mail, Job Queue oder Rechteaenderung in Production.

## Assertions

- Keine Schreibaktion ohne Freigabe.
- alterPermissionErrorPresent = false oder sauber dokumentiert
- telemetryCorrelationCaptured = true oder nicht verfuegbar begruendet
- posted = false
- permissionsChangedInProduction = false
- Expected Result wird vor dem Test festgelegt.
