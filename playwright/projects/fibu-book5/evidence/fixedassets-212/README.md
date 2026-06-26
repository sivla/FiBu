# FIXEDASSETS-212 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-preflight-preview-entry-details-after-hgb-fit.json` | JSON | Kontext, Zielzeile und `FA Posting Type = Acquisition Cost` vor Preview | keine Vorschau | `labor` oder `blocked` |
| `020-preview-posting-preview-entry-details-after-hgb-fit.json` | JSON | exakten Preview-Menuepunkt, Ergebnisart, Safety Flags | keine Buchung | `labor` oder `blocked` |
| `030-preview-posting-result-text.txt` | Text | kompakten sichtbaren Preview-/Fehlertext | keine Rohseite, keine Postenspur | `labor` oder `blocked` |
| `FIXEDASSETS-212-result.json` | JSON | Ergebnis, Detailsignale, Grenzen, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-212-learning.md` | Markdown | Lernwert zur Preview-Detailpruefung | keine Buchungsfreigabe | `labor` |

Aktuelle Wahrheit: FA-212 stayed safe but did not complete the guarded Preview Posting detail capture: Preview entry labels were visible in compact text but not found as exact clickable detail targets.
