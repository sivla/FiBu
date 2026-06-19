# FIXEDASSETS-066 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-066-result.json` | JSON | Guarded no-target UI-Probe fuer Einkaufsrechnungs-Zeilentyp | keine Zielanlage, keine Preview/Buchung | `labor`, `guarded-probe` |
| `030-line-type-guard-result.json` | JSON | strukturierte Zeilentyp-Evidence und Guard-Status | keine Nummernspalte | `line-type-guard` |
| `090-cleanup-result.json` | JSON | UI-Cleanup des Entwurfs, falls einer entstand | keine API-Datenbankgarantie | `cleanup` |
| `091-cleanup-retry-result.json` | JSON | dedizierter UI-Cleanup entfernte Draft `107210` | keine fachliche Einkaufsrechnung | `cleanup-complete` |
| `092-cleanup-retry-after-focused-text.txt` | Text | gefilterte Liste zeigt `In dieser Ansicht kann nichts angezeigt werden` | keine API-Datenbankgarantie | `cleanup-proof` |

Aktuelle Wahrheit: Der Guard stoppte korrekt, weil weiterhin `Item` statt `Fixed Asset` in den Einkaufsrechnungszeilen sichtbar war. Zielwerte bleiben gesperrt. Der temporaere Draft `107210` wurde per UI-Cleanup entfernt.
