# FIXEDASSETS-030 Evidence Index

Status: `done-decision-correction-gate-no-bc-run`  
Umgebung: `MCP_1_20260210`  
Company: `RM-DEMO`  
Modus: Entscheidungslauf ohne BC-Ausfuehrung, ohne Setup-Aenderung, ohne Buchung

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-030-FA-CNC-01-CORRECTION-GATE-DECISION.md` | Entscheidung / Lernnotiz | `FA-CNC-01` bleibt der Buch-Zielcode; die vorhandene leere Karte soll im naechsten Lauf UI-first korrigiert werden, statt einen neuen Zielcode zu erfinden | keine praktische Korrektur, keinen gesetzten Kartenwert, keine Anlagenbuchung | `labor-decision`, `no-bc-run`, `no-posting` |
| `FIXEDASSETS-030-result.json` | strukturierte Evidence | Entscheidung, erlaubte Zielwerte, verbotene Folgeaktionen und Stop-Kriterien fuer den naechsten Lauf | keinen UI-/Screenshot-Nachweis, keinen Persistenznachweis nach Korrektur | `machine-readable`, `gate-for-next-run` |
| `../fixedassets-029-existing-asset-readonly/FIXEDASSETS-029-existing-readonly-result.json` | Eingangs-Evidence | `FA-CNC-01` existiert, ist aber fachlich unvollstaendig | keine Korrekturentscheidung allein | `input-evidence` |
| `../fixedassets-029-existing-asset-readonly/030-card-field-values.json` | Feldwerte / Eingangs-Evidence | nur `No. = FA-CNC-01` passt; Kernfelder sind leer/nicht passend | keine Zielwerte nach Korrektur | `input-evidence` |

## Kurzurteil

Der Buchprozess soll weiter mit `FA-CNC-01` arbeiten. Weil die vorhandene Karte laut `FIXEDASSETS-029-EXISTING` noch keinen Zugang, keinen Buchwert und keine fachlichen Zielwerte zeigt, ist der sicherste naechste Schritt die kontrollierte UI-first Korrektur dieses bestehenden Stammsatzes.

Nicht freigegeben sind `K30000`, Einkaufsrechnung, Zugang, AfA, Anlagenposten und jede Buchung.
