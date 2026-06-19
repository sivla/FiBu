# FIXEDASSETS-077 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-077-result.json` | JSON | Einkaufsbestellungsroute fuer `Type = Fixed Asset`, Cleanup, Grenzen | keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |
| `030-purchase-order-line-type-route.json` | JSON | Purchase-Order-Line-Type-Probe und Guard-Klassifikation | keine No.-Feldzuordnung | `line-type-context` |
| `031-after-route-focused-text.txt` | Text | kompakter UI-Text nach Probe | kein Rohdump, kein Screenshot | `compact` |
| `090-cleanup-result.json` | JSON | Cleanup-Status eines ggf. erzeugten Drafts | keine Postenspur | `cleanup` |

Aktuelle Wahrheit: FA-077 did not prove visible Type = Fixed Asset through the Purchase Order line route; status=blocked-fixed-asset-not-visible, guard=blocked-missing-purchase-invoice-lines-context. Cleanup status=deleted.
