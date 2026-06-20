# FIXEDASSETS-157 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-fa-gl-journal-line-ownership-context.txt` | Text | kompakte Journal-/Zeilensignale | keine Werteingabe | `labor`, `read-only` |
| `020-focused-line-ownership-text.txt` | Text | fokussierte Zeilen-/Balance-Signale | kein Rohdump | `compact` |
| `030-line-ownership-signals.json` | JSON | Ziel-, Balance-, Page- und Screenshot-Signale; markiert DOM-Extractor-Grenze | keine Ownership-Entscheidung | `labor`, `read-only` |
| `040-visual-qa.md` | Markdown | visuelle Bildpruefung: eine Zeile mit `G05001` / `Fixed Asset` / `FA-CNC-01` / `HGB` ist sichtbar | keinen Betrag, kein Gegenkonto, keine Buchung | `visual-qa` |
| `fixedassets-157-010-fa-gl-journal-line-ownership-readonly.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bildes | keine Buchungswirkung | `labor` |
| `FIXEDASSETS-157-result.json` | JSON | Ergebnis, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-157-learning.md` | Markdown | Lernwert fuer Journalzeilen-Besitz/Cleanup | keine Postenspur | `labor` |

Aktuelle Wahrheit: FA-157 zeigt visuell die aktuelle Journalzeile, aber der DOM-/Text-Extractor hat nur die Business-Central-Shell erfasst. Das Bild belegt `Fixed Asset G/L Journals`, `DEFAULT`, eine Zeile mit `G05001`, `Fixed Asset`, `FA-CNC-01`, `HGB` und `CNC Maschine FRA`; Betrag `68.000` und Gegenkonto bleiben nicht sichtbar.
