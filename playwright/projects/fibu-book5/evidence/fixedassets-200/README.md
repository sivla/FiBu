# FIXEDASSETS-200 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-before-fa-posting-type.json` | JSON | Journal-Kontext, Zielzeile und Kandidat vor Feldkorrektur | keine Persistenz | `labor` |
| `020-after-fa-posting-type.json` | JSON | Eingabe-/Wertlage nach `FA Posting Type = Acquisition Cost` | keine Persistenz nach Reopen | `labor` oder `blocked` |
| `030-after-reopen-persistence.json` | JSON | ob `FA Posting Type = Acquisition Cost` nach erneutem Oeffnen sichtbar/current war | keine Preview/Buchung | `labor` oder `blocked` |
| `FIXEDASSETS-200-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-200-learning.md` | Markdown | Lernwert zur gezielten Journaldaten-Korrektur | keine Postenspur | `labor` |

Aktuelle Wahrheit: FA-200 proved FA Posting Type = Acquisition Cost persisted after reopening Fixed Asset G/L Journals.
