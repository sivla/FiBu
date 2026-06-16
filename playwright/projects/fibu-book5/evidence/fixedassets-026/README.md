# fixedassets-026 Evidence

Status: `labor`, `ui-first`, `readiness`, `control-recovery`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-026-result.json` | JSON-Ergebnis | ob die in 024 fehlenden aktiven Karten-Controls wiedergefunden wurden | keine Werte, keine Speicherung, keine Buchung | labor |
| `FIXEDASSETS-026-FA-CNC-01-DEPRECIATION-BOOK-CONTROL-RECOVERY.md` | Markdown | Lern- und Buchwirkung der No-Save-Control-Recovery | keinen deutschen Finalnachweis | labor |
| `020-show-more-recovery.json` | JSON | gezielt geklickte FastTab-Show-More-Aktionen | keine fachlichen Werte | diagnostic |
| `030-card-context-after-recovery.txt` | kompakter UI-Text | Kartenkontext mit Depreciation-Book-Feldern | keinen Rohdump | context |
| `040-focused-field-hints.json` | JSON | fokussierte Hinweise auf FA-/Depreciation-/Posting-Felder | kein vollstaendiges Tabellenmodell | diagnostic |
| `050-active-card-control-recovery.json` | JSON | aktive Kartenlabel mit nahen Controls/Buttons | keine Wertauswahl | control-proof |
| `090-target-filter-after-run.txt` | UI-Text | `FA-CNC-01` wurde nach dem Lauf nicht gespeichert | keine API-Pruefung | no-save-check |
| `fixedassets-026-030-depreciation-book-controls-recovery.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bilds | keine eigenstaendige Wahrheit ohne JSON/Markdown | candidate |
| `playwright/projects/fibu-book5/img/fixedassets-026-030-depreciation-book-controls-recovery.png` | Screenshot | Buchkandidat fuer sichtbare leere Kartenfelder `Depreciation Book Code` und `Posting Group` | keine gesetzten Werte `HGB`/`MACHINES` | candidate |

## Kernaussage

Die Anlagen-Klickanleitung braucht vor jeder Wert-/Speicheraktion einen breiten Karten-Screenshot, auf dem Depreciation Book Code und Posting Group wirklich sichtbar sind.
