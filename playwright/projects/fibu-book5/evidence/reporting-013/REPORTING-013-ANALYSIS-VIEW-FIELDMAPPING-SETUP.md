# REPORTING-013 Analysis View Feldmapping und Setup-Entscheidung

| Feld | Wert |
|---|---|
| Sandbox | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | `labor`, `ui-first`, `fieldmapping`, `no-posting`, `not-final` |
| Gate | `REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP approved-for-next-run by GOVERNANCE-007` |
| Ziel-Analysis-View | `RM-PLCH` - RM PRODUCTLINE CHANNEL |
| Dimension 1 | `PRODUCTLINE` |
| Dimension 2 | `CHANNEL` |
| Ergebnis | `rejected` |
| Setup geaendert | nein |
| Gebucht | nein |
| Zahlung/Bankabstimmung | nein |

## Was wurde geprueft?

Der Lauf hat `Analysis Views` in `RM-DEMO` geoeffnet und nach dem von `GOVERNANCE-007` freigegebenen Feldmapping gesucht. Geprueft wurden die sichtbaren und editierbaren UI-Felder fuer `Code`, `Name`, `Dimension 1 Code` und `Dimension 2 Code`.

## Feldmapping-Befund

- Analysis Views geoeffnet: ja
- Referenz-Analysis-View gewaehlt: ja
- Liste bearbeiten geklickt: nein
- editierbare Felder gefunden: 11
- Feldmapping sicher: ja
- Setup-Entscheidung: Kein Setup-Versuch: Die bestehende REVENUE-Karte belegt zwar die Feldpositionen fuer Code, Name, Dimension 1 und Dimension 2, aber New/Neu ist in der BC-Shell global mehrdeutig. Der kontrollierte Folgeversuch zeigte, dass ein ungescopter New-Klick in den Role-Center-Kontext geraten kann. REPORTING-013 verbraucht das Gate deshalb ohne Aenderung.

## Ergebnis

Der Gate-Lauf wurde bewusst als `rejected` geschlossen: Es gab keinen ausreichend sicheren UI-Pfad, um `RM-PLCH` anzulegen oder zu aendern, ohne falsche Felder oder einen halben Setup-Datensatz zu riskieren.

## Anfaenger-Lernwert

Eine Analysis View ist Reporting-Setup. Sie entscheidet, welche Dimensionen spaeter als Analyseachsen verwendet werden koennen. Sichtbare Spalten in einer Liste sind aber noch keine sicheren Eingabefelder. Deshalb muss ein Buch-Klickpfad erst die Feldzuordnung zeigen, bevor er Leser anleitet, eine neue View anzulegen.

## Buchwirkung

Kapitel 10 und 25 duerfen weiter sagen: `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten belegt. Sie duerfen aber keine GuV-/Revenue-Summenwirkung nach diesen Dimensionen behaupten, solange keine passende Analysis View oder Matrixsicht sichtbar nachgewiesen ist.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`.
- Kein deutscher Reporting-Finalnachweis.
- Keine deutsche `19 %` USt.
- Kein deutscher Kontenplan-Endstand.
- Keine Buchung, keine Zahlung, keine Bankabstimmung.

## Naechster Schritt

REPORTING-014 Buch-/Governance-Sync: REPORTING-013 als rejected schliessen, Gate auf rejected/locked setzen und im Buch erklaeren, warum Analysis-View-Setup ohne stabile UI-Feldzuordnung nicht als Klickanleitung taugt.
