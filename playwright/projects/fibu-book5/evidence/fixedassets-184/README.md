# FIXEDASSETS-184 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-journal-pre-preview-check.json` | JSON | Journal-Kontext und ob `Bal. Account No. = 82000` vor Preview sichtbar/current war | keine Buchung | `labor` oder `blocked` |
| `020-preview-posting-result.json` | JSON | ob Preview Posting geklickt/geoeffnet wurde und Safety-Flags | keine Postenspur aus echter Buchung | `labor` oder `blocked` |
| `020-preview-posting-page-text.txt` | Text, falls Preview/Fehlerbild erreicht wurde | kompakter sichtbarer Preview-/Fehlertext | kein Rohdump | `labor` oder `blocked` |
| `FIXEDASSETS-184-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-184-learning.md` | Markdown | Lernwert der Buchungsvorschau | keine echte Buchung | `labor` |
| `fixedassets-184-020-preview-posting-only.screenshot.json` | Screenshot-Metadaten, falls Preview/Fehlerbild erreicht wurde | Zweck und Grenze des Preview-Bildes | keine eigenstaendige fachliche Wahrheit ohne JSON/Text | `labor` oder `rejected` |

Aktuelle Wahrheit: FA-184 stayed safe but did not prove Preview Posting: bal-account-82000-not-visible:single-editable-candidate
