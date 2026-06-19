# FIXEDASSETS-066 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-066-result.json` | JSON | guarded no-target UI-Probe-Runner, npm-Script und zentraler `clickBcScoredAction`-Helper sind vorbereitet; Zielwerte bleiben gesperrt | keinen neuen BC-Zustand, keinen Anlagenkauf | `runner-prepared`, `no-bc-run`, `no-playwright-run` |
| `../../tests/fixedassets-066-purchase-invoice-line-type-guarded-probe.spec.ts` | Playwright-Test | zukuenftiger Runner nutzt `classifyPurchaseInvoiceLineTypeVisibility()` und `clickBcScoredAction()` und schreibt Guard-Evidence | wurde in diesem Lauf nicht ausgefuehrt | `prepared-not-executed` |
| `../../../../core/bc/actions.ts` | Helper | wiederverwendbares Scoring fuer mehrdeutige BC-Aktionen wie `New/Neu` und `Delete/Loeschen` | keinen sichtbaren BC-Erfolg ohne Lauf | `lab-reusable-helper` |

Aktuelle Wahrheit: Der naechste Schritt ist die Ausfuehrung von `npm run fibu:fixedassets:purchase-invoice-line-type-guarded-probe`, wenn ein praktischer BC-Probe gewuenscht ist. Der Runner muss bei `Item`-Zeile oder Vendor-Registrierungsdialog stoppen. `K30000`, `FA-CNC-01`, Preview und Post bleiben gesperrt.
