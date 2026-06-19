# FIXEDASSETS-065 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-065-result.json` | JSON | lokale Diagnose aus 064-Evidence, Guard-Blocker und naechste sichere Aktion | keinen neuen BC-Zustand, keinen Anlagenkauf | `labor`, `local-static-analysis` |
| `020-line-type-guard-regression.json` | JSON | der neue Zeilentyp-Guard blockiert `Item` und Vendor-Registrierungsdialog aus 064-Evidence | keinen sichtbaren BC-Zustand `Type = Fixed Asset` | `helper-regression`, `no-bc-run` |
| `FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS.md` | Markdown | Lernbefund, Buchwirkung und Guard-Entscheidung | keine Preview-/Buchungsfreigabe | `not-final` |

Aktuelle Wahrheit: `Type = Item` plus Vendor-Registrierungsdialog ist kein `Fixed Asset`-Zeilenbeweis. Der Guard/Helper ist lokal verbessert; der naechste UI-Probe darf ihn nutzen, muss aber weiter ohne `K30000`, ohne `FA-CNC-01`, ohne Preview und ohne Post laufen.
