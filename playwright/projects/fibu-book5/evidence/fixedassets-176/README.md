# FIXEDASSETS-176 Evidence Index

Status: `local-helper-refinement`, `no-bc`, `no-playwright`, `no-posting`, `not-final`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-176-helper-refinement.md` | Markdown | Welche Helper-Regel verschaerft wurde und warum | keinen BC-Live-Erfolg | `local-helper-refinement` |
| `FIXEDASSETS-176-result.json` | JSON | Selftest-Ergebnis, Grenzen, State-Patch-Plan | keine Werteingabe, keine Preview, keine Buchung | `local-helper-refinement` |

## Aktuelle Wahrheit

Der Journal-Grid-Helper akzeptiert `already-visible` jetzt nur noch row-anchored: `82000` muss in einem Kandidaten stehen, der Zielzeile und Zielspalte verbindet. Ein global sichtbares `82000` in einem anderen Gridbereich reicht nicht mehr.
