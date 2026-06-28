# P2P-021 Purchase Invoice Alternative Route Preflight

Status: `labor`, `ui-first`, `purchase-invoice-preflight`, `no-preview`, `no-post`, `needs-german-final-rebuild`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `P2P-021-result.json` | JSON | strukturierter Laufbefund, Flags, Cleanup | keine Buchung | labor |
| `010-before-new-text.txt` | Text | Purchase-Invoices-Startkontext | keine Feldwerte | compact |
| `020-after-new-signals.json` | JSON | Beleg-/Zeilen-/Aktionskontext nach New | keine Buchungsvorschau | labor |
| `030-after-vendor-signals.json` | JSON | Vendor-Eingabeversuch und sichtbare Signale | keine Item-Zeile | labor/blocked |
| `040-cleanup-result.json` | JSON | Cleanup/Keep-Status des Entwurfs | keine Postenspur | cleanup |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der Bilder | keine eigenstaendige Wahrheit | evidence |

## Ergebnis

P2P-021 did not fully prove the Purchase Invoice alternative route. new=true, vendorFilled=true, vendorVisible=true, cleanup=cleanup-clicked-but-still-visible.

## Anfängerhinweis

Die Einkaufsrechnung ist der direkte Kreditorenbeleg. Sie ist nicht dasselbe wie eine Einkaufsbestellung mit Wareneingang und auch nicht dasselbe wie ein Purchase Journal. In diesem Gate wird nur geprüft, ob der Belegkopf kontrolliert entsteht, ob der Kreditor sichtbar gesetzt werden kann und ob danach ein Zeilenkontext fuer Artikelwerte sichtbar wird.

## Grenze

- Keine Preview Posting.
- Keine Buchung.
- Kein Wareneingang.
- Kein deutscher Finalnachweis.
- RM-DEMO bleibt Labor-/Vorproduktionsnachweis.

## Naechster Schritt

P2P-022: diagnose Purchase Invoice vendor/cleanup blocker before any item line or preview route.
