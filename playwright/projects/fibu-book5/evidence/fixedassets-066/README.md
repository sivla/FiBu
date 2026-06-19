# FIXEDASSETS-066 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-066-result.json` | JSON | guarded no-target UI-Probe-Runner, npm-Script, zentraler `clickBcScoredAction`-Helper und Approval-Gate sind vorbereitet; Zielwerte bleiben gesperrt | keinen neuen BC-Zustand, keinen Anlagenkauf | `runner-prepared`, `approval-gated`, `no-bc-run`, `no-playwright-run` |
| `../../tests/fixedassets-066-purchase-invoice-line-type-guarded-probe.spec.ts` | Playwright-Test | zukuenftiger Runner nutzt `classifyPurchaseInvoiceLineTypeVisibility()` und `clickBcScoredAction()` und schreibt Guard-Evidence | wurde in diesem Lauf nicht ausgefuehrt; er darf ohne Freigabe nicht laufen, weil er `New/Neu` klickt | `prepared-not-executed`, `requires-explicit-approval` |
| `../../../../core/bc/actions.ts` | Helper | wiederverwendbares Scoring fuer mehrdeutige BC-Aktionen wie `New/Neu` und `Delete/Loeschen` | keinen sichtbaren BC-Erfolg ohne Lauf | `lab-reusable-helper` |

Aktuelle Wahrheit: Der Runner darf nicht automatisch ausgefuehrt werden. Er klickt `New/Neu` und kann einen temporaeren Draft erzeugen; dafuer ist ausdrueckliche Freigabe noetig. Ohne diese Freigabe ist der naechste sichere Schritt ein read-only Kontext- oder Action-Inventar-Lauf. `K30000`, `FA-CNC-01`, Preview und Post bleiben gesperrt.
