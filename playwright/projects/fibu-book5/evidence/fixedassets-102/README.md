# FIXEDASSETS-102 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-before-journal-row.json` | JSON | Journal-Zustand vor der Werteingabe | keine Buchungswirkung | `labor`, `before` |
| `020-draft-entry-probe.json` | JSON | Eingabeversuch, Zielwerte, Blocker oder sichtbare Zielsignale | kein Preview/Post | `labor`, `draft-probe` |
| `030-after-journal-row.json` | JSON | Journal-Zustand nach der Werteingabe | keine Postenspur | `labor`, `after` |
| `031-after-journal-row-focused-text.txt` | Text | kompakte sichtbare Zielsignale | kein Rohdump | `compact` |
| `FIXEDASSETS-102-result.json` | JSON | Ergebnis, Safety Flags, Keep-Trace | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-102-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |

Aktuelle Wahrheit: FA-102 produced only a partial FA G/L Journal draft signal. `FA-CNC-01`, `HGB`, `Fixed Asset`, `Acquisition Cost` and `K30000` are visible, but the amount `68000` is not proven. No Preview Posting and no posting occurred.
