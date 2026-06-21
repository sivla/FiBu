# FIXEDASSETS-186 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-before-persistence-probe.json` | JSON | Journal-Kontext, Kandidat und Wertlage vor Reopen-Probe | keine Persistenz | `labor` |
| `020-after-value-entry.json` | JSON | sichtbaren Wert unmittelbar nach UI-Eingabe, falls Eingabe noetig war | keine Persistenz nach Reopen | `labor` oder `blocked` |
| `030-after-reopen-persistence-check.json` | JSON | ob `Bal. Account No. = 82000` nach erneutem Oeffnen sichtbar/current war | keine Preview/Buchung | `labor` oder `blocked` |
| `FIXEDASSETS-186-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-186-learning.md` | Markdown | Lernwert der Reopen-/Persistenzprobe | keine Postenspur | `labor` |

Aktuelle Wahrheit: FA-186 proved Bal. Account No. = 82000 persisted after reopening the Fixed Asset G/L Journals page.
