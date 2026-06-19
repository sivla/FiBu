# fixedassets-082 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-082-result.json` | JSON | deaktivierter Acquire-Zustand und Diagnosegrenzen | keine Ursache, keine Anschaffung, keine Buchung | `labor`, `read-only` |
| `FIXEDASSETS-082-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |
| `010-card-state-readonly.txt` | Text | sichtbarer Kartenstatus | keine technische Tabellenlogik | `read-only` |
| `020-acquire-disabled-diagnostics.json` | JSON | Aktions-/Feldsignale aus sichtbarer UI | keine Buchungswirkung | `read-only-diagnosis` |

Aktuelle Wahrheit: FA-082 confirmed read-only that Acquire remains visible but disabled on FA-CNC-01. UI evidence shows Book Value 0,00 and no specific depreciation-book value such as HGB in this compact card view. The cause is not proven; the next case must decide between edit-mode/Page Inspection diagnosis or an alternate acquisition route.
