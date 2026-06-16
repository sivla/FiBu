# repro plan

1. Tickettext und Fehlermeldung anonymisiert sichern.
2. Environment, Company, User/Rolle und Zeitpunkt klaeren.
3. UI Evidence read-only sammeln: Page, Aktion, sichtbarer Fehler.
4. Data Evidence read-only planen: Permission Sets, Effective Permissions, Security Filter.
5. Telemetry Evidence vorbereiten: Permission-Error-Query mit Zeitfenster und optionaler Correlation ID.
6. Keine Aktion ausfuehren, die buchen, senden, zahlen, loeschen oder Rechte aendern koennte.
7. Root Cause erst nach Abgleich von UI, Data Evidence und Telemetry formulieren.
