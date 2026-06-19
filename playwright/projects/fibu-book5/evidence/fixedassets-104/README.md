# FIXEDASSETS-104 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-bal-account-diagnosis.json` | JSON | aktuelles Fehlerbild und Account-Type-Optionen | keine Wertkorrektur | `labor`, `diagnosis` |
| `020-focused-text.txt` | Text | kompakte UI-Signale | kein Screenshot, kein Rohdump | `compact` |
| `FIXEDASSETS-104-result.json` | JSON | Diagnoseergebnis und naechster Decision-Case | keine Buchungswirkung | `labor` |

Aktuelle Wahrheit: FA-104 lief in `MCP_1_20260210` / `RM-DEMO` read-only. Der alte Fehler `Account Type or Bal. Account Type must be a G/L Account or Bank Account` war in diesem Lauf nicht sichtbar; deshalb bleibt der Lauf `blocked/partial`. Sichtbar belegt sind aber die Account-Type-Optionen inklusive `G/L Account` und `Bank Account`; der aktuelle Bal.-Account-Type-Optionssatz wirkt bereits auf `G/L Account` gesetzt. Es wurde nichts korrigiert, keine Preview geoeffnet und nicht gebucht. Naechster Schritt ist `FIXEDASSETS-105`: lokale Entscheidung, ob ein spaeterer enger UI-Probe zuerst die aktuelle Zeile/Balance liest oder einen kontrollierten G/L-Account-Gegenkonto-Weg pruefen darf.
