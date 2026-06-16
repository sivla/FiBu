# fixedassets-027 Evidence

Status: `labor`, `ui-first`, `readiness`, `lookup-preflight`, `auto-number-cleanup`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-027-result.json` | JSON-Ergebnis | Lookup-/Wertpreflight, Auto-Number-Falle und Cleanup-Status | keinen sicheren No-Save-Pfad, kein Setup, keine Buchung | labor |
| `FIXEDASSETS-027-FA-CNC-01-VALUE-LOOKUP-PREFLIGHT-DECISION.md` | Markdown | fachliche Lern- und Buchwirkung | keinen deutschen Finalnachweis | labor |
| `026-active-card-control-baseline.json` | JSON | aktive Kartenfelder vor den Lookup-Proben | keine gesetzten Werte | control-proof |
| `030-060-*.txt` | kompakter UI-Text | jeweiliger Lookup-/Kontexttext | Rohdump oder finaler Buchtext | mixed |
| `030-060-*.screenshot.json` | Screenshot-Metadaten | Zweck, Status, sichtbare Werte und Auto-Number-Grenze je Bild | keinen No-Save-Beweis | mixed |
| `090-target-filter-after-run.txt` | UI-Text | `FA-CNC-01` wurde nach dem Lauf nicht gespeichert | erkennt nicht automatisch erzeugte andere Nummern | target-no-save-check |
| `100-auto-number-draft-cleanup-coordinate-result.json` | JSON | `FA000110` wurde nach UI-Cleanup im Filter nicht mehr sichtbar | keinen allgemeinen Cleanup-Helper | cleanup-proof |
| `fixedassets-027-097-card-delete-confirmation.screenshot.json` | Screenshot-Metadaten | Dialog `FA000110 loeschen?` als Lernfall | kein Buchungsnachweis | cleanup-context |
| `fixedassets-027-100-cleanup-after-filter.screenshot.json` | Screenshot-Metadaten | Filter nach Cleanup zeigt `FA000110` nicht mehr | keine API-Pruefung | cleanup-proof |

## Kernaussage

Kapitel 21 darf die sichtbaren Lookup-Werte `HGB`, `MACHINES` und Klassen-/Unterklassenwerte als Laborbefund aufnehmen. Der Lauf zeigt aber auch eine wichtige Auto-Number-Falle: Die neue Anlagenkarte erzeugte `FA000110`; der Entwurf wurde danach per UI geloescht. Fuer den naechsten Schritt braucht es deshalb eine explizite Save-Gate-Entscheidung statt eines weiteren vermeintlichen No-Save-Preflights.
