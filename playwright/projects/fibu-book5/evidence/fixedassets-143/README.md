# fixedassets-143 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-143-guarded-retry.md` | Markdown | Ergebnis des guarded Live-Retry nach FA-142 | keinen MACHINES-Fit, keine Buchung | `blocked/labor` |
| `FIXEDASSETS-143-result.json` | JSON | maschinenlesbares Ergebnis und naechster State-Patch-Plan | keine deutsche Final-Evidence | `blocked/labor` |

Aktuelle Wahrheit: Der reparierte Guard funktioniert. Der praktische Retry stoppt erneut, weil die Posting-Group-Route die verwandte `Depreciation Book Card HGB` oeffnet. `FA-CNC-01` bleibt bei `Posting Group = EQUIPMENT`; `MACHINES` ist nicht als Kartenwert bewiesen.
