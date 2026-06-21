# FIXEDASSETS-202 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-preflight-fa-posting-type.json` | JSON | Kontext, Zielzeile und `FA Posting Type = Acquisition Cost` vor Preview | keine Vorschau | `labor` oder `blocked` |
| `020-preview-posting-after-correction.json` | JSON | exakten Preview-Menuepunkt, Ergebnisart, Safety Flags | keine Buchung | `labor` oder `blocked` |
| `030-preview-posting-result-text.txt` | Text | kompakten sichtbaren Preview-/Fehlertext | keine Rohseite, keine Postenspur | `labor` oder `blocked` |
| `FIXEDASSETS-202-result.json` | JSON | Ergebnis, Grenzen, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-202-learning.md` | Markdown | Lernwert nach Zeilenkorrektur | keine Buchungsfreigabe | `labor` |

Aktuelle Wahrheit: FA-202 clicked only the exact Preview Posting menuitem after proving `FA Posting Type = Acquisition Cost`; outcome=`error-messages-context`. Der alte Blank-Blocker ist weg. Neuer Blocker: `FA Posting Type Acquisition Cost must be posted in the FA journal in Gen. Journal Line ASSETS / DEFAULT / 10000`.
