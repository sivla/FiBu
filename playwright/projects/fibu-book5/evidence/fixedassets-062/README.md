# FIXEDASSETS-062 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-062-result.json` | JSON | UI-first Zielwerte-Preflight, Guard-Status, Cleanup-Status | keine Preview, keine Buchung, keinen Zugang | `labor`, `no-posting` |
| `022-after-new-card-context-signals.json` | JSON | Card-/Lines-Kontextsignale nach `New/Neu` | keine Zielwerte | `context` |
| `030-header-field-mapping-result.json` | JSON | Header-Feldmapping fuer `K30000` und `Vendor Invoice No.` | keine Anlagenzeile | `header-proof-or-blocker` |
| `040-line-field-mapping-result.json` | JSON | Zeilenversuch fuer `Type = Fixed Asset` und `FA-CNC-01` | keine Buchung | `line-proof-or-blocker` |
| `050-final-visibility-result.json` | JSON | ob Zielwerte zusammen sichtbar sind | keine Postenspur | `visibility` |
| `fixedassets-062-050-target-field-mapping.png` | Screenshot | Zielwerte oder Blockerbild laut Metadaten | kein Anlagenzugang | `candidate/rejected` |
| `090-cleanup-result.json` | JSON | UI-Cleanup, falls Draft entstand | keine Datenbankgarantie ueber API | `cleanup` |
| `094-accidental-purchase-invoice-107223-cleanup-result.json` | JSON | UI-Cleanup des beim ersten 062-Versuch entstandenen Einkaufsrechnungsentwurfs | keine Anlagenbuchung | `cleanup` |
| `097-accidental-vendor-V00060-cleanup-result.json` | JSON | UI-Cleanup des versehentlichen Vendor-Drafts aus dem falschen Lookup-Kontext | keine Anlagenzeile | `cleanup` |

Aktuelle Wahrheit: `FA-CNC-01` wurde sichtbar, aber nicht als Anlagenzeile: BC oeffnete einen Vendor-Card-/Lookup-Kontext. Der Screenshot ist ein Rejected Path, kein Anlagenzugang-Preflight.
