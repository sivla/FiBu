# Dimensionen in der Universaarl GmbH

Dimensionen sind Zusatzmerkmale fuer Buchungen und Stammdaten. Sie beantworten spaeter Fragen wie: Zu welcher Produktlinie gehoert ein Umsatz? Ueber welchen Vertriebskanal kam ein Auftrag? Welche Kostenstelle soll eine Ausgabe tragen?

In Business Central sind Dimensionen keine eigenen Konten. Sie ergaenzen Buchungen. Ein Betrag wird weiterhin auf ein Sachkonto gebucht. Die Dimension hilft anschliessend beim Filtern, Auswerten und Vergleichen.

## Die Seite Dimensionen

Die Seite `Dimensionen` ist die zentrale Liste der Dimensionscodes. Dort stehen normalerweise Codes wie `PRODUCTLINE`, `CHANNEL` oder `COSTCENTER`. Zu jedem Dimensionscode gehoeren Dimensionswerte. Bei `PRODUCTLINE` koennten das zum Beispiel `SOFTWARE`, `SERVICE` oder `HARDWARE` sein.

In der Universaarl-Company ist die Dimensionsseite erreichbar. Die aktuelle Ansicht zeigt aber noch keine Zeilen. Das ist ein wichtiger Befund: Die Seite ist vorhanden, aber daraus entsteht noch keine fertige Reportingstruktur.

Bevor erste Kunden, Lieferanten, Artikel oder Belege angelegt werden, muss entschieden werden, welche Dimensionen fuer das Buch wirklich gebraucht werden. Fuer die Universaarl GmbH sind als erste Achsen sinnvoll:

- Produktlinie
- Vertriebskanal
- Kostenstelle

## Globale Dimensionen

In der Seite `Finanzbuchhaltung Einrichtung` gibt es den Abschnitt `Dimensionen`. Dort stehen die Felder `Globaler Dimensionscode 1` und `Globaler Dimensionscode 2`.

Globale Dimensionen sind besonders wichtige Dimensionen. Business Central kann sie in vielen Listen, Posten und Auswertungen direkter anzeigen und filtern. Deshalb sollten sie bewusst gewaehlt werden. Wenn spaeter zum Beispiel Produktlinie und Kostenstelle in vielen Auswertungen gebraucht werden, sind sie Kandidaten fuer globale Dimensionen.

In der Universaarl-Company sind diese Felder sichtbar. Es wurde aber noch kein Wert geaendert. Das ist richtig: Globale Dimensionen beeinflussen spaeter Buchungen und Auswertungen und gehoeren deshalb in einen eigenen Setup-Schritt.

## Was vor Stammdaten geklaert wird

Vor dem ersten Kunden, Lieferanten oder Artikel sollte klar sein:

- Welche Dimensionen werden im Buch verwendet?
- Welche Dimensionswerte braucht jeder Prozess?
- Welche Dimensionen sollen global sein?
- Welche Dimensionen werden automatisch als Standarddimension an Stammdaten vorgeschlagen?
- Welche Dimensionen sind Pflicht und welche optional?

Erst danach werden Stammdaten angelegt. Sonst entstehen spaeter Kunden, Artikel oder Buchungen ohne die Merkmale, die fuer Filter, Berichte und Uebungen gebraucht werden.

## Was dieser Schritt noch nicht bedeutet

Die sichtbare Dimensionsseite beweist noch keine Auswertung. Eine Auswertung ist erst bewiesen, wenn eine Buchung mit Dimensionen entstanden ist und diese Dimensionen in Posten, Dimensionsposten oder Berichten sichtbar werden.

Der naechste fachliche Schritt ist deshalb kein Verkaufs- oder Einkaufsbeleg. Zuerst wird entschieden, welche Universaarl-Dimensionen und Dimensionswerte angelegt werden.
