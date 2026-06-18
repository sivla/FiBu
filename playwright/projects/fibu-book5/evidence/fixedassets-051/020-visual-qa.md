# FIXEDASSETS-051 Visual QA

| Screenshot | Sichtbares Lernziel | Status |
|---|---|---|
| `fixedassets-051-010-k30000-vendor-card-before-pageinspection.png` | `K30000` / `Zollspedition Nord GmbH` auf der Vendor Card; Payments-Kurzwerte `1M(8D)` und `BANK` | Kontextbild, kein Proof fuer ausgeblendete Default-Codes |
| `fixedassets-051-020-pageinspection-context.png` | Page Inspection Pane mit `Vendor Card (26, Card)` und `Vendor (23)` | Technischer Page-/Table-Kontext; nicht als Feldwerte-Buchbild verwenden, weil die kritischen Codes nicht alle im Bildausschnitt lesbar sind |

## Entscheidung

Die Bilder bleiben Labor-/Evidence-Bilder. Fuer ein spaeteres Buchbild gibt es zwei Optionen:

1. Anwenderbild: Werte auf der Vendor Card oder per sauber dokumentierter Personalisierung sichtbar machen.
2. Debugging-Bild: Page Inspection bewusst als technische Nachweisfuehrung erklaeren und mit JSON/Text-Evidence koppeln.

Nicht behaupten: Der Screenshot allein beweist nicht alle Kreditoren-Defaults.
