# FIXEDASSETS-097 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-097-result.json` | JSON | Einkaufsrechnungsroute fuer `Type = Fixed Asset`, Cleanup, Grenzen | keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |
| `030-purchase-invoice-line-type-proof.json` | JSON | Purchase-Invoice-Line-Type-Probe und Guard-Klassifikation | keine No.-Feldzuordnung | `line-type-context` |
| `031-after-route-focused-text.txt` | Text | kompakter UI-Text nach Probe | kein Rohdump, kein Screenshot | `compact` |
| `090-cleanup-result.json` | JSON | Cleanup-Status eines ggf. erzeugten Drafts | keine Postenspur | `cleanup` |

Aktuelle Wahrheit: FA-097 did not prove Purchase Invoice Line Type = Fixed Asset; status=blocked-fixed-asset-not-visible, guard=blocked-item-line-type-visible. Cleanup status=not-created-or-draft-number-not-found.
