# FIXEDASSETS-025 Evidence Index

Status: `labor`, `decision-no-bc-run`, `no-save`, `no-setup`, `no-posting`, `not-final`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-025-FA-CNC-01-VALUE-LOOKUP-OR-SAVE-GATE-DECISION.md` | Entscheidung / Lernnotiz | `FIXEDASSETS-024` ist nur ein partieller aktiver Kartencontrol-Nachweis; `Depreciation Book Code` und `Posting Group` fehlen in der aktiven Control-Diagnose. | Kein `HGB`-/`MACHINES`-Wertnachweis, kein Save-Gate, keine Anlage, keine Buchung. | verbindliche Laborentscheidung |
| `FIXEDASSETS-025-result.json` | kompaktes JSON-Ergebnis | Maschinenlesbarer Stop fuer Werteingabe, Lookup und Speichern von `FA-CNC-01`. | Keine neue UI-Evidence und kein deutscher Finalnachweis. | aktuell |
| `../fixedassets-024/FIXEDASSETS-024-result.json` | Input-Evidence | `activeControlProof=false`, 4 von 6 erwarteten Controls aktiv gemappt. | Vollstaendige aktive Kartensteuerung fuer `Depreciation Book Code` und `Posting Group`. | Input |
| `../fixedassets-024/030-active-card-control-diagnosis.json` | technische Input-Evidence | `FA Class Code`, `FA Subclass Code` und AfA-Datumsfelder sind aktive Kartencontrols; `Depreciation Book Code` und `Posting Group` sind `caption-not-visible`. | Werteauswahl oder Speichern. | Input |

Naechster Schritt: `FIXEDASSETS-026-FA-CNC-01-DEPRECIATION-BOOK-CONTROL-RECOVERY`.

