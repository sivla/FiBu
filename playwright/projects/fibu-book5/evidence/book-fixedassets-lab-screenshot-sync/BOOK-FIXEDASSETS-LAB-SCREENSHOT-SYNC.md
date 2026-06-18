# BOOK-FIXEDASSETS-LAB-SCREENSHOT-SYNC

## Ziel

Kapitel 21 sollte sichtbarer zeigen, was Business Central im aktuellen `RM-DEMO`-Labor tatsaechlich zeigt. Die Aenderung verwendet vorhandene Screenshots und Evidence, statt neue BC-Aktionen auszufuehren.

## Ergebnis

Das Buch nutzt jetzt sechs Fixed-Assets-Bilder als erklaerte Labor-/Diagnosebilder:

- `HGB` als Labor-AfA-Buch.
- `MACHINES` als Labor-Anlagenbuchungsgruppe.
- `FA-CNC-01` als Labor-Stammdatenfit mit `Book Value = 0,00`.
- `K30000` als teilweiser Invoicing-/Tax-Diagnosepunkt.
- leere Einkaufsrechnung als Preflight vor Anlagenkauf.
- `FIXEDASSETS-064` als Rejected Path: Dialogtext `Fixed Asset` ist kein Zeilentypnachweis.

## Grenze

Diese Buchverbesserung beweist keinen deutschen Finalprozess. Weiter offen bleiben:

- sichtbarer Zeilentyp `Type = Fixed Asset` in der Einkaufsrechnung,
- `FA-CNC-01` als Einkaufsrechnungszeile,
- Preview Posting fuer den Anlagenzugang,
- gebuchte Einkaufsrechnung,
- Anlagenposten,
- AfA,
- deutscher Kontenplan,
- deutsche USt-/Compliance-Finalisierung.
