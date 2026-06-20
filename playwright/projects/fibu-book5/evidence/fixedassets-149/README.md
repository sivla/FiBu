# fixedassets-149 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-149-result.json` | JSON | `FA-CNC-01` wurde per feldlokaler UI-Auswahl von `EQUIPMENT` auf `MACHINES` gesetzt | keinen deutschen Finalnachweis | `labor`, `setup-fit` |
| `FIXEDASSETS-149-learning.md` | Markdown | Lernwert und Buchwirkung | keine Anschaffung/Buchung | `labor` |
| `010-before-state.json` | JSON | Kartenwert vor Feldaktion: `EQUIPMENT` | keine Posten | `field-proof` |
| `020-fieldlocal-click-result.json` | JSON | feldlokaler Posting-Group-Auswahlknopf wurde geklickt | keine Buchungswirkung | `technical-context` |
| `030-selection-result.json` | JSON | sichtbare Option `MACHINES` wurde ausgewaehlt; kein Posting-/Confirm-Dialog | keine Anschaffung | `setup-fit` |
| `040-after-state.json` | JSON | Kartenwert nach Neuoeffnen: `MACHINES` | keine FA Ledger Entries | `field-proof` |
| `../../img/fixedassets-149-050-fa-cnc-01-posting-group-fieldlocal-fit.png` | Screenshot | `FA-CNC-01` zeigt sichtbar `Posting Group = MACHINES` | nicht alleinige Wahrheit | `candidate`, `labor` |

Aktuelle Wahrheit: FA-149 changed FA-CNC-01 Posting Group from EQUIPMENT to MACHINES through the field-local UI selector and confirmed the value after reopening the card.
