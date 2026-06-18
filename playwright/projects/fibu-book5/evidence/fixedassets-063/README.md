# FIXEDASSETS-063 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-063-result.json` | JSON | Strictness-Gate aus 062, Cleanup-Konsistenz, No-BC-Safety | keinen neuen UI-Zustand, keine Anlagenzeile, keine Preview/Buchung | `labor`, `no-bc-run`, `helper-strictness` |
| `FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS.md` | Markdown | fachliche Lernregel fuer Zeilentyp `Fixed Asset` vor `FA-CNC-01` | keinen deutschen Finalnachweis | `book-learning` |

Aktuelle Wahrheit: Der naechste praktische Lauf darf nur den Zeilentyp `Fixed Asset` in einer Einkaufsrechnungszeile stabil sichtbar machen. `FA-CNC-01` bleibt bis danach gesperrt.
