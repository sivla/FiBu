# REPORTING-009 G/L Entry Dimensions

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-posting, no-setup |
| Ausgangsbeleg | PS-INV103297 |
| Layout | breite Ansicht 2200 x 1300; FactBox-Hide versucht |

## Kernergebnis

| Frage | Befund |
|---|---|
| G/L Entries zur Rechnung sichtbar | ja |
| Rechnungsfilter sichtbar | ja |
| Entry/Posten-Aktion geklickt | nein |
| Weitere Optionen geklickt | ja |
| Dimensionsaktion geklickt | nein |
| Sachposten-Dimensionskontext sichtbar | nein |
| Shortcut-Dimensionsspalten sichtbar | ja |
| PRODUCTLINE/CHANNEL dort sichtbar | nein |
| Keine Buchung | ja |

## Anfaenger-Lernwert

Ein Sachposten zeigt die Hauptbuchwirkung einer Buchung. Das ist nicht automatisch dasselbe wie die Dimensionen, die vorher an Verkaufszeile, Debitor oder Artikel sichtbar waren. In diesem Listenbild sind zwar Shortcut-Spalten wie `Department Code` und `Customergroup Code` sichtbar, aber nicht die Buchziel-Dimensionen `PRODUCTLINE` und `CHANNEL`. Fuer das Buch ist deshalb wichtig, die Postenarten getrennt zu lesen: Artikelposten koennen die operative Artikel-/Dimensionsspur zeigen, waehrend Sachposten vor allem Konten, Betraege und einzelne Shortcut-Dimensionen zeigen. Erst ein sichtbarer Dimensionsdialog, eine Analysis View oder ein Bericht macht daraus eine Reporting-Evidence fuer `PRODUCTLINE`/`CHANNEL`.

## Buchwirkung

Kapitel 10, 11 und 25 duerfen weiterhin nicht behaupten, dass `PRODUCTLINE=MACHINE` oder `CHANNEL=B2B` schon in Financial Reports oder Sachposten-Reporting auswertbar sind. Der Lauf ergaenzt aber die Klickanleitung: Bei Sachposten soll der Leser bewusst nach `Entry`/`Posten` und `Dimensions` suchen und das Ergebnis als getrennten Kontrollpunkt bewerten.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Buchung, keine Stammdatenanlage und keine Analysis-View-Aktualisierung.
- Deutsche `19 %` USt bleibt offen.
- Wenn der Dimensionsdialog nicht sichtbar oder ohne Zielwerte bleibt, ist das kein Gegenbeweis zur Artikelposten-Dimension, sondern eine Grenze dieses Sachposten-/Reportingpfads.

## Naechster Schritt

Sachposten-Dimensionsdialog liefert in diesem UI-Lauf keinen sichtbaren PRODUCTLINE-/CHANNEL-Nachweis. Naechster Reporting-Hebel bleibt der freigegebene Analysis-View-Fit oder ein alternativer offizieller Reporting-Einstieg.
