# FIXEDASSETS-115 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-115-result.json` | JSON | Type-Dropdown-/Options-Discovery, Cleanup, Grenzen | keine Auswahl, keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |
| `030-line-type-dropdown-discovery.json` | JSON | Button-/Dropdown-Klickpunkt, Optionssignale und Guard-Klassifikation | keine No.-Feldzuordnung | `line-type-context` |
| `031-after-dropdown-focused-text.txt` | Text | kompakter UI-Text nach Dropdown-Probe | kein Rohdump | `compact` |
| `fixedassets-115-030-line-type-dropdown-discovery.png` | Screenshot | Blocker-/Kontextmenue-Zustand nach Dropdown-Probe | kein Dropdown-Erfolg, kein Zielwert- oder Buchungsbild | `rejected`, `do-not-use` |
| `090-cleanup-result.json` | JSON | Cleanup-Status eines ggf. erzeugten Drafts | keine Postenspur | `cleanup` |

Aktuelle Wahrheit: FA-115 did not expose useful Type dropdown options; status=blocked-dropdown-options-not-visible, guard=blocked-item-line-type-visible. Der bereinigte Optionsbefund enthaelt nur `Item`; `Fixed Asset`/`Anlage` ist nicht bewiesen. Cleanup status=not-created-or-draft-number-not-found.
