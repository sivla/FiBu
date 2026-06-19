# FIXEDASSETS-074 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-074-result.json` | JSON | Page-Inspection-Diagnose im Einkaufsrechnungs-/Zeilenkontext, Cleanup, Grenzen | keinen Anlagenkauf, keine Zielwerte, keine Buchung | `labor`, `technical-diagnosis` |
| `030-page-inspection-line-context.json` | JSON | fokussierte Type-Zelle und Page-Inspection-Signale | keine Feldwert-Auswahl | `technical-context` |
| `031-page-inspection-focused-lines.txt` | Text | kompakte technische Page-Inspection-Zeilen | kein Rohdump, kein Screenshot-Proof | `compact` |
| `090-cleanup-result.json` | JSON | Cleanup-Status eines ggf. erzeugten Drafts | keine Postenspur | `cleanup` |

Aktuelle Wahrheit: FA-074 opened Page Inspection after focusing the Purchase Invoice Lines Type cell. Page Inspection resolved to Purchase Header context, and fixed asset was mentioned in the Type field help text. Cleanup status=not-created-or-draft-number-not-found.
