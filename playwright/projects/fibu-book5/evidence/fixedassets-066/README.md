# FIXEDASSETS-066 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-066-result.json` | JSON | guarded no-target UI-Probe-Runner und npm-Script sind vorbereitet; Zielwerte bleiben gesperrt | keinen neuen BC-Zustand, keinen Anlagenkauf | `runner-prepared`, `no-bc-run`, `no-playwright-run` |
| `../../tests/fixedassets-066-purchase-invoice-line-type-guarded-probe.spec.ts` | Playwright-Test | zukuenftiger Runner nutzt `classifyPurchaseInvoiceLineTypeVisibility()` und schreibt Guard-Evidence | wurde in diesem Lauf nicht ausgefuehrt | `prepared-not-executed` |

Aktuelle Wahrheit: Der naechste Schritt ist Review und ggf. Ausfuehrung von `npm run fibu:fixedassets:purchase-invoice-line-type-guarded-probe`. Der Runner muss bei `Item`-Zeile oder Vendor-Registrierungsdialog stoppen. `K30000`, `FA-CNC-01`, Preview und Post bleiben gesperrt.
