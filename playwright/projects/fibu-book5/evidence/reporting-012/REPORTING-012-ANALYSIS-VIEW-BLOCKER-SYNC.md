# REPORTING-012 Analysis-View-Blocker-Sync

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Arbeitsart | Governance-/Buch-/Evidence-Sync |
| BC-Lauf | nein |
| Setup geaendert | nein |
| Gebucht | nein |
| Vorlauf | `REPORTING-011` |
| Ergebnis | Analysis-View-Fit bleibt `rejected` |

## Situation

Das Buchziel fuer Kapitel 10/25 verlangt eine GuV- beziehungsweise Reporting-Auswertung nach `PRODUCTLINE=MACHINE`, `CHANNEL=B2B` und `DEPARTMENT=SALES`. Die bisherige Evidence beweist die Dimensionen am Beleg und am Artikelposten, aber nicht als Financial-Reports-Summenwirkung.

`REPORTING-011` hat deshalb den freigegebenen UI-first Setup-Hebel versucht: eine eigene Analysis View `RM-PLCH` mit `PRODUCTLINE` und `CHANNEL`. Die Seite `Analysis Views` war erreichbar, aber die UI zeigte keine sichere editierbare Feldzuordnung fuer Code, Name und Dimensionsfelder.

## Entscheidung

`REPORTING-011` darf nicht wiederholt werden, solange es keinen neuen Hebel gibt. Ein erneuter Versuch waere nur sinnvoll, wenn ein neues ausdrueckliches Gate zuerst die Feldmapping-Frage klaert:

- Wo oeffnet Business Central die Analysis-View-Card oder editierbare Liste?
- Welche Felder entsprechen `Code`, `Name`, `Dimension 1 Code`, `Dimension 2 Code`?
- Wie wird gespeichert und danach wieder geoeffnet?
- Wie wird `Update` ausgefuehrt und als Vorher/Nachher belegt?
- Wie wird verhindert, dass ein halber oder falscher Setup-Datensatz entsteht?

Ohne diese Antworten bleibt der sichere Zustand: keine Analysis View anlegen, keine Analysis View aendern, keine Reporting-Summenwirkung behaupten.

## Anfaenger-Lernwert

Eine Dimension am Artikelposten ist ein Buchungsnachweis. Eine Reportingachse ist ein Auswertungsnachweis. Business Central kann die Dimension zwar gespeichert haben, aber ein Finanzbericht nutzt sie erst, wenn der Bericht, die Analysis View oder ein anderer Reportingkontext diese Dimension auch als Achse oder Filter verwendet.

Fuer Anfaenger ist das wichtig: Wenn eine GuV nach Produktlinie leer oder falsch aussieht, ist nicht automatisch die Buchung falsch. Moeglich sind auch fehlende Reportingfilter, eine unpassende Analysis View, nicht aktualisierte Analyseansichten oder sichtbare Shortcut-Spalten, die nicht den gesuchten Dimensionen entsprechen.

## Buchwirkung

Kapitel 25 bleibt als Zielpfad korrekt, darf aber fuer `RM-DEMO` nicht als erledigt formuliert werden. Die aktuelle Buchformulierung muss als Zielbild/Laborgrenze gelesen werden:

- Zielbild: Finanzbericht, Drilldown, Sachposten, Wertposten und Analysis View nach `PRODUCTLINE`/`CHANNEL`.
- RM-DEMO-Labor: Financial Reports erreichbar; Artikelposten-Dimension belegt; Analysis Views erreichbar; `RM-PLCH` nicht angelegt.
- DE-Finalnachweis: offen.
- Nicht behaupten: Financial Reports seien bereits nach `PRODUCTLINE`/`CHANNEL` belegt.

## Naechster Schritt

Ohne neues Gate: `GOVERNANCE-007-REPORTING-NEXT-GATE-DECISION` als kurzer Entscheidungs-/State-Lauf. Mit Freigabe: `REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP`, zuerst UI-Feldmapping sichern, dann idempotent `RM-PLCH` anlegen oder aendern und danach `Analysis by Dimensions` pruefen.
