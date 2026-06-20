# fixedassets-126 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-126-result.json` | JSON | Acquire-Aktionszustand und Ursache-Diagnosegrenzen | keine Anschaffung, keine Buchung | `labor`, `read-only-diagnosis` |
| `FIXEDASSETS-126-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |
| `010-card-state-readonly.txt` | Text | sichtbarer Kartenstatus | keine technische Tabellenlogik | `compact` |
| `020-acquire-action-diagnostics.json` | JSON | Aktions-/Feld-/Page-Inspection-Signale | keine Buchungswirkung | `read-only-diagnosis` |
| `040-page-inspection-focused-text.txt` | Text | Page-Inspection-Kontext, falls geoeffnet | keine Business-Regel-Ursache allein | `technical-diagnosis` |
| `../../img/fixedassets-126-030-acquire-disabled-context.png` | Screenshot | Karten-/Aktionskontext | kein Anschaffungs- oder Buchungsbild | `labor`, `diagnosis` |

Aktuelle Wahrheit: FA-126 kept Acquire as a disabled-action diagnosis. The action was visible on FA-CNC-01, but acquisition execution remains locked because the exact executable path and posting effect are not proven.
