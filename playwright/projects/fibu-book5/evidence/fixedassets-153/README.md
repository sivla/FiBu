# fixedassets-153 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-153-result.json` | JSON | Edit-State-/Acquire-Diagnose | keine Anschaffung, keine Buchung | `labor`, `diagnosis` |
| `FIXEDASSETS-153-learning.md` | Markdown | Lernwert und Buchwirkung | keinen deutschen Finalnachweis | `labor` |
| `010-action-state-diagnostics.json` | JSON | Controls, Edit-Probe, Acquire-Zustand vorher/nachher | keine Aktionsausfuehrung | `diagnosis` |
| `011-card-context-before.txt` | Text | kompakter Kartenkontext vor Probe | kein Rohdump | `compact` |
| `012-card-context-after.txt` | Text | kompakter Kartenkontext nach Probe/Stop | kein Rohdump | `compact` |
| `../../img/fixedassets-153-010-fa-cnc-01-before-editmode.png` | Screenshot | Vorher-Kontext | keine Anschaffung | `labor` |
| `../../img/fixedassets-153-020-fa-cnc-01-after-editmode.png` | Screenshot | Nachher-/Stop-Kontext | keine Anschaffung | `labor` |

Aktuelle Wahrheit: FA-153 proved in the UI that FA-CNC-01 still shows Acquire disabled after a safe edit-state probe; no acquisition route is unlocked.
