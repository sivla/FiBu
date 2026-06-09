# GOVERNANCE-006: Next Gate Decision

## Entscheidung

Der naechste praktische Gate-Hebel ist `REPORTING-011-ANALYSIS-VIEW-FIT`.

Diese Entscheidung ist ein Governance-/State-Lauf. Es wurde kein Business-Central-Test ausgefuehrt, keine Analysis View geaendert, keine Zahlung gebucht, keine Bankabstimmung gestartet und kein Setup in `RM-DEMO` veraendert.

## Warum Reporting der naechste Hebel ist

Die bereits gebuchten Laborbelege liefern genug Prozess- und Postenspur:

- O2C: `S-ORD101068` -> `PS-INV103297`
- P2P: `106049` -> `108219`
- Inventory: `INV008-899959`
- Payments: `PAY011-PS103297` inklusive OP-Ausgleich, Sachposten und Bankposten Page `372`

Das groesste offene Buch-/Lernloch liegt dadurch nicht mehr in einer weiteren Zahlung oder einer neuen Buchung. Es liegt in der Frage, wie Business Central die bereits vorhandenen Dimensionen fuer Auswertungen nutzt.

`REPORTING-001` bis `REPORTING-010` zeigen:

- `Financial Reports` ist erreichbar.
- `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `792` sichtbar.
- Die vorhandene `REVENUE` Analysis View nutzt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, aber nicht `PRODUCTLINE`/`CHANNEL`.
- `Dimensions - Detail`, `G/L Entries`, `Data Analysis` und `Analysis by Dimensions` liefern ohne Setup-Fit keinen belastbaren Zielnachweis.

Damit ist ein weiterer gleicher Read-only-Reportinglauf nicht sinnvoll. Der naechste fachliche Schritt ist ein eng begrenzter, idempotenter Labor-Fit fuer eine Analysis View.

## Warum nicht Bankabstimmung

Die Zahlung `PAY011-PS103297` ist bereits als Laborzahlung belegt. Seit `PAYMENTS-013` ist auch der Bankposten ueber Page `372` sichtbar. Eine Bankabstimmung wuerde einen neuen Bank-/Statement-Prozess starten und braucht eigene Bankauszugs-/Abstimmungslogik. Fuer das Buch ist vorher wichtiger, die bereits gebuchten Dimensionen in Reporting/Analysis auszuwerten.

## Warum nicht Fixed Assets

Fixed Assets ist als Readiness-Kette bis `FIXEDASSETS-008` dokumentiert. Es fehlen aber Zielanlage `FA-CNC-01`, AfA-Buch `HGB`, Posting Group `MACHINES` und Kreditor `K30000`. Ein Anlagen-Setup waere ein neuer Modulaufbau. Reporting schliesst dagegen direkt an vorhandene O2C-/Inventory-/Dimension-Evidence an.

## Gate fuer den Folgelauf

`REPORTING-011-ANALYSIS-VIEW-FIT` wird fuer genau den naechsten Lauf auf `approved-for-next-run` gesetzt.

Erlaubt ist nur:

- in `MCP_1_20260210` / `RM-DEMO` bleiben,
- vorhandene Analysis Views vorher lesen,
- idempotent eine RM-DEMO-Labor-Analysis-View fuer `PRODUCTLINE` und `CHANNEL` anlegen oder aktualisieren,
- bevorzugt eine eigene Labor-View statt die vorhandene `REVENUE`-View unkontrolliert umzubauen,
- Analysis View aktualisieren, falls BC das verlangt,
- danach `Analysis by Dimensions` oder eine gleichwertige BC-Standardsicht pruefen,
- Screenshots, JSON und Markdown-Evidence sichern,
- keine Zahlenwirkung behaupten, wenn sie nicht sichtbar ist,
- keine Buchung, keine Zahlung, keine Bankabstimmung, keine deutsche VAT19-Behauptung.

Wenn der Folgelauf die View nicht stabil UI-first anlegen/aktualisieren kann, wird nicht improvisiert. Dann wird der neue Blocker als Reporting-Lernfall dokumentiert.

## Naechster Schritt

`REPORTING-011-ANALYSIS-VIEW-FIT`: freigegebenen Reporting-Fit UI-first und idempotent ausfuehren oder den konkreten UI-/Setup-Blocker sichern.
