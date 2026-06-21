# FIXEDASSETS-174 Evidence Index

Status: `local-helper`, `no-bc`, `no-playwright`, `no-posting`, `not-final`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-174-helper-decision.md` | Markdown | Warum FA-172 einen Lines/Subform-Helper braucht und was der neue Helper schuetzt | keinen BC-Live-Erfolg | `local-helper` |
| `FIXEDASSETS-174-result.json` | JSON | Helper-Aenderung, lokale Selftest-Grenzen, State-Patch-Plan | keine Journal-Werteingabe, keine Preview, keine Buchung | `local-helper` |

## Aktuelle Wahrheit

FA-172 bleibt ein Blocker-/Kontextnachweis: `Bal. Account Type = G/L Account` und die Spalte `Bal. Account No.` waren sichtbar, aber `82000` wurde nicht sichtbar und es gab keinen eindeutig editierbaren Zellkandidaten. FA-174 ergaenzt deshalb nur einen lokalen Analyse-Helper fuer row-anchored cell candidates. Der naechste BC-Live-Lauf bleibt gesperrt, bis FA-175 den Helper bewertet.
