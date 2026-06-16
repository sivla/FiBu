# regression test

## Testplan

1. Ausgangslage read-only belegen: User, Rolle, Page, Fehlermeldung.
2. Erwartetes Permission Set oder Execute-Recht beschreiben.
3. In Sandbox/Testumgebung mit Testuser pruefen, ob Buchungsvorschau ohne Berechtigungsfehler startet.
4. Keine echte Buchung ausfuehren.
5. Keine Berechtigung in Production aendern.

## Assertions

- Keine Schreibaktion ohne Freigabe.
- Alter Permission-Fehler ist nachvollziehbar dokumentiert oder widerlegt.
- Expected Result: Preview startet oder liefert eine fachlich passende, dokumentierte Restfehlermeldung.
- posted = false
- permissionsChangedInProduction = false
