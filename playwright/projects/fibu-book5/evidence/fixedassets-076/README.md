# FIXEDASSETS-076 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-076-result.json` | JSON | Direktwert-Probe fuer `Type = Fixed Asset`, Cleanup, Grenzen | keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |
| `030-direct-line-type-entry.json` | JSON | Type-Zelle, Eingabeversuch, sichtbare Signale, Guard-Klassifikation | keine No.-Feldzuordnung | `line-type-context` |
| `031-after-direct-entry-focused-text.txt` | Text | kompakter UI-Text nach Eingabeversuch | kein Rohdump, kein Screenshot | `compact` |
| `090-cleanup-result.json` | JSON | Cleanup-Status eines ggf. erzeugten Drafts | keine Postenspur | `cleanup` |

Aktuelle Wahrheit: FA-076 did not prove visible Type = Fixed Asset through direct UI value entry; status=blocked-direct-entry-not-accepted, guard=blocked-item-line-type-visible. Cleanup status=not-created-or-draft-number-not-found.
