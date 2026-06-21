# FIXEDASSETS-168 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-machines-field-context.json` | JSON | `MACHINES` und `Acquisition Cost Bal. Acc.` Feldkontext | keine gespeicherte Auswahl | `labor`, `read-only` |
| `020-machines-focused-text.txt` | Text | kompakter Zielkontext | kein Rohdump | `compact` |
| `030-existing-patterns-readonly.json` | JSON | sichtbare FA-Posting-Group-Muster | keinen Setup-Fit | `labor`, `candidate` |
| `040-patterns-focused-text.txt` | Text | kompakte Musterzeilen | kein vollstaendiger Page-Dump | `compact` |
| `FIXEDASSETS-168-learning.md` | Markdown | Lernwert und Buchwirkung | keine Buchung | `labor` |
| `FIXEDASSETS-168-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keine Postenspur | `labor` |
| `../../img/fixedassets-168-010-machines-balaccount-field-context.png` | Screenshot | Feldkontext `MACHINES` / `Acquisition Cost Bal. Acc.` | keine Werteauswahl | `candidate` |
| `../../img/fixedassets-168-020-fa-posting-group-patterns-readonly.png` | Screenshot | Musterkontext FA Posting Groups | kein Setup-Fit | `candidate` |

Aktuelle Wahrheit: MACHINES / Acquisition Cost Bal. Acc. is visible, but no concrete field value or safe selected lookup value is proven.
