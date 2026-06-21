# FIXEDASSETS-198 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-immediate-preview-error-capture.json` | JSON | exakten Preview-Klick, sofortige Error-Messages-Samples, Safety Flags | keine Buchung | `labor` oder `blocked` |
| `020-immediate-preview-error-text.txt` | Text | kompakten besten sichtbaren Fehlerseiten-Text | keine vollstaendige Rohseite | `labor` oder `blocked` |
| `FIXEDASSETS-198-result.json` | JSON | Ergebnis, Grenzen, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-198-learning.md` | Markdown | Lernwert fuer kurzlebige Fehlerkontexte | keine Setup-Korrektur | `labor` |

Aktuelle Wahrheit: FA-198 captured immediate Preview Posting Error Messages details (16 line(s)) without posting.

Kernfehler:

- Datensatz: `Gen. Journal Line ASSETS / DEFAULT / 10000`
- UI-Hinweis: `Waehlen Sie einen Wert fuer Batch Name`
- BC-Meldung: `'FA Posting Type' darf in 'Gen. Journal Line' nicht ' ' sein: 'Journal Template Name=ASSETS, Journal Batch Name=DEFAULT, Line No.=10000'`
