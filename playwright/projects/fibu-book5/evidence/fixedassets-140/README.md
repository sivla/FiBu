# fixedassets-140 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-140-result.json` | JSON | Ergebnis, Safety, Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |
| `FIXEDASSETS-140-posting-group-assignment-fit.md` | Markdown | Lernwert und Buchwirkung | keine Anschaffung/Buchung | `labor` |
| `010-before-visible-rows.json` | JSON | Kartenwerte vor Aenderung | keine Posten | `field-proof` |
| `020-fa-ledger-entries-safety.txt` | Text | kompakter Ledger-Sicherheitscheck | keinen Abschlussbericht | `safety` |
| `040-fill-result.json` | JSON | falsche Related-Card-Route statt Posting-Group-Fit | keine Buchungswirkung | `blocked` |
| `../../img/fixedassets-140-060-fa-cnc-01-posting-group-machines.png` | Screenshot | `Depreciation Book Card HGB` als falscher Vordergrundkontext | keinen MACHINES-Fit | `blocked/labor` |

Aktuelle Wahrheit: FA-140 blocked. Der Lauf setzte `Posting Group` nicht auf `MACHINES`, sondern oeffnete die verwandte `Depreciation Book Card` fuer `HGB`.
