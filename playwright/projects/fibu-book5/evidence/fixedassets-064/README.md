# FIXEDASSETS-064 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-064-result.json` | JSON | UI-first Zeilentyp-Probe, Safety- und Cleanup-Status | keine Zielanlage, keine Preview/Buchung | `labor`, `line-type-probe` |
| `040-line-type-attempt-result.json` | JSON | Klick-/Eingabeversuch fuer `Type = Fixed Asset` | keine Nummernspalte | `line-type-proof-or-blocker` |
| `050-final-line-type-visibility-result.json` | JSON | ob `Fixed Asset` sichtbar wurde und ob verbotene Kontexte offen sind | keine Postenspur | `visibility` |
| `fixedassets-064-050-line-type-fixed-asset-visible.png` | Screenshot | Zeilentyp-Kandidat oder Rejected-Bild laut Metadaten | kein `FA-CNC-01`, kein Anlagenzugang | `candidate/rejected` |
| `090-cleanup-result.json` | JSON | erster Cleanup-Versuch fuer Entwurf `107209` | keinen geloeschten Entwurf; blieb sichtbar | `cleanup-blocked` |
| `094-purchase-invoice-107209-cleanup-result.json` | JSON | separater UI-Cleanup hat Entwurf `107209` geloescht | keine API-Datenbankgarantie | `cleanup`, `resolved` |
| `fixedassets-064-092-purchase-invoice-107209-before-cleanup.png` | Screenshot | Entwurf `107209` war vor Cleanup sichtbar | keinen Anlagenkauf | `rejected`, `cleanup-before` |
| `fixedassets-064-093-purchase-invoice-107209-after-cleanup.png` | Screenshot | Entwurf `107209` ist nach Cleanup nicht mehr sichtbar | keine Buchung/Postenspur | `labor`, `cleanup-after` |

Aktuelle Wahrheit: Der Zeilentyp `Fixed Asset` wurde nicht belastbar im Purchase-Invoice-Zeilenkontext nachgewiesen. Das Rejected-Bild zeigt weiter `Type = Item` und einen Vendor-Registrierungsdialog fuer `Fixed Asset`. Der Entwurf `107209` wurde danach UI-first geloescht. Der Folgelauf darf `FA-CNC-01` weiterhin nicht eingeben.
