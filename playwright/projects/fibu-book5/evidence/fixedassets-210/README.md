# FIXEDASSETS-210 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-preflight-after-hgb-fit.json` | JSON | Kontext, Zielzeile und `FA Posting Type = Acquisition Cost` vor Preview | keine Vorschau | `labor` oder `blocked` |
| `020-preview-posting-after-hgb-fit.json` | JSON | exakten Preview-Menuepunkt, Ergebnisart, Safety Flags | keine Buchung | `labor` oder `blocked` |
| `030-preview-posting-result-text.txt` | Text | kompakten sichtbaren Preview-/Fehlertext | keine Rohseite, keine Postenspur | `labor` oder `blocked` |
| `FIXEDASSETS-210-result.json` | JSON | Ergebnis, Grenzen, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-210-learning.md` | Markdown | Lernwert nach HGB-Setup-Fit | keine Buchungsfreigabe | `labor` |

Aktuelle Wahrheit: FA-210 clicked only the exact Preview Posting menuitem after proving FA Posting Type = Acquisition Cost; outcome=preview-entry-context; prior FA Posting Type blocker gone=true.
