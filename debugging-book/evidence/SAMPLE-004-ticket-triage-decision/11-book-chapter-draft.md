# book chapter draft

# Buchbaustein: Erst triagieren, dann debuggen

Ein gutes BC-Debugging beginnt nicht mit Klicks im System, sondern mit Einordnung. Ein Ticket kann Bedienhilfe, Setup-Problem, Berechtigungsproblem, Datenproblem, Standardgrenze oder Bug sein. Der gleiche sichtbare Fehler kann mehrere Ursachen haben.

Die Regel:

1. Fakten aus dem Ticket extrahieren.
2. Kundenkontext laden.
3. Problemklasse bestimmen.
4. Evidence-Kanaele waehlen.
5. Safe Action Policy pruefen.
6. Erst dann UI, Daten, Telemetry oder Code lesen.

So verhindert der Agent, dass er in Production riskante Aktionen ausloest oder vorschnell ein Setup-/Bug-Urteil faellt.
