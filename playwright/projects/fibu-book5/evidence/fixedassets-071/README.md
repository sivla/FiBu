# FIXEDASSETS-071 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-071-result.json` | JSON | guardierte Draft-Probe mit New/Neu, Draftnummer, Lines-/Type-Kontext, Cleanup-Status | keinen Anlagenkauf, keine Zielwerte, keine Buchung | `labor`, `guarded-draft-probe` |
| `030-line-type-context.json` | JSON | strukturierte Type-/Lines-Kontextklassifikation | keine gebuchte Anlagenbewegung | `line-type-context` |
| `090-cleanup-result.json` | JSON | Cleanup-Status des erzeugten Drafts | keine API-Datenbankgarantie | `cleanup` |
| `091-cleanup-retry-result.json` | JSON | Draft `107211` wurde im UI-Cleanup-Retry entfernt | keine Buchung, keine Zielwerte | `cleanup-complete` |
| `091-cleanup-retry-before-focused-text.txt` | Text | Draft `107211` war vor Retry sichtbar | keine technische Tabellenabfrage | `cleanup-before` |
| `092-cleanup-retry-after-focused-text.txt` | Text | Draft `107211` war nach Retry nicht mehr sichtbar | keine API-Datenbankgarantie | `cleanup-after` |

Aktuelle Wahrheit: FA-071 erreichte den echten Purchase-Invoice-Lines-Kontext. `Type` und `No.` waren sichtbar, der Zeilentyp blieb aber `Item`; `Fixed Asset` wurde nicht sichtbar/prozessual nachgewiesen. `K30000` und `FA-CNC-01` wurden nicht eingegeben. Draft `107211` wurde im UI-Cleanup-Retry entfernt.
