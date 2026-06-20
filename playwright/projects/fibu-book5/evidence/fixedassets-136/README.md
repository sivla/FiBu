# fixedassets-136 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-136-result.json` | JSON | Kartenkontext, Page-Inspection-Signale, Sicherheitsflags | keine Anschaffung, keine Posten, keinen Setup-Fit | `labor`, `read-only` |
| `FIXEDASSETS-136-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |
| `010-card-focused-text.txt` | Text | kompakte Karten-/Feldsignale vor/nach Diagnose | keine technische Feldquelle allein | `compact` |
| `020-pageinspection-focused-lines.txt` | Text | kompakte Page-Inspection-Zeilen, falls sichtbar | kein Rohdump | `technical-context` |
| `030-pageinspection-signals.json` | JSON | Page-Inspection-Versuch und Signale | keine Buchungswirkung | `read-only-diagnosis` |
| `../../img/fixedassets-136-040-fa-cnc-01-pageinspection-context.png` | Screenshot | Kartenkontext mit HGB/EQUIPMENT und sichtbare Page Inspection | allein keinen Feldzeilenbeweis fuer `FA Posting Group (29)` | `labor`, `debugging-evidence`, `context-image` |

Aktuelle Wahrheit: FA-136 opened Page Inspection read-only on FA-CNC-01. Text-/JSON-Evidence beweist `Fixed Asset Card (5600)`, `Fixed Asset (5600)`, `Depreciation Book Code`, `HGB`, `Posting Group`, `EQUIPMENT`, `FA Posting Group (29, Code[20])` und `Acquired (30, Boolean)`. Der Screenshot ist als Kontextbild brauchbar, aber der konkrete Feldzeilenbeweis liegt in den Text-/JSON-Dateien. `MACHINES` bleibt nicht als zugewiesener Kartenwert bewiesen.
