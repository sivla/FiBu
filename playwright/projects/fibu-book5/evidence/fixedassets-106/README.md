# FIXEDASSETS-106 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-current-line-ownership.json` | JSON | aktuelle Zeilen-/Balance-Signale | keine Wertkorrektur | `labor`, `read-only` |
| `020-focused-text.txt` | Text | kompakte UI-Signale | kein Screenshot, kein Rohdump | `compact` |
| `FIXEDASSETS-106-result.json` | JSON | Diagnoseergebnis und naechster Decision-Case | keine Buchungswirkung | `labor` |

Aktuelle Wahrheit: FA-106 captured current FA G/L Journal line ownership read-only. `G05001`, `Fixed Asset`, `FA-CNC-01`, `HGB` und `Bal. Account Type = G/L Account` sind als Control-Werte sichtbar. `68000` und `K30000` sind nicht sichtbar; `Number of Lines / Balance / Total Balance = 1 / 0,00 / 0,00`. Keine Wertkorrektur, kein Insert/Delete, keine Preview und kein `Post`.
