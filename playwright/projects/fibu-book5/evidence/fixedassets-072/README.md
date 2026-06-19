# FIXEDASSETS-072 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-072-result.json` | JSON | Type-Dropdown-Probe, Dokumentnummer, Cleanup, Grenzen | keinen Anlagenkauf, keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |
| `030-type-dropdown-probe.json` | JSON | Klick-/Tastaturversuche fuer Type-Dropdown und sichtbare Optionen | keine finale Feldzuordnung | `selector-evidence` |
| `040-after-selection-line-type-context.json` | JSON | sichtbarer Type-Kontext nach Auswahlversuch | keine gebuchte Anlagenbewegung | `line-type-context` |
| `090-cleanup-result.json` | JSON | Cleanup-Status des erzeugten Drafts | keine Postenspur | `cleanup` |
| `091-cleanup-retry-result.json` | JSON | UI-Cleanup-Retry fuer Draft `107225`; danach nicht mehr sichtbar | keinen Anlagenkauf, keine Postenspur | `cleanup-complete` |

Aktuelle Wahrheit: FA-072 hat den echten Zeilenkontext erneut erreicht, aber `Type = Fixed Asset` ueber den getesteten Dropdown-/Tastaturpfad nicht bewiesen. Der zuerst uebersehene Draft `107225` wurde danach per UI-Cleanup-Retry geloescht. `K30000` und `FA-CNC-01` bleiben gesperrt.
