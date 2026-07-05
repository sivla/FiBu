# Dimensionen in der Universaarl GmbH

Dimensionen sind Zusatzmerkmale fuer Buchungen und Stammdaten. Sie beantworten spaeter Fragen wie: Zu welcher Produktlinie gehoert ein Umsatz? Ueber welchen Vertriebskanal kam ein Auftrag? Welche Kostenstelle soll eine Ausgabe tragen?

In Business Central sind Dimensionen keine eigenen Konten. Sie ergaenzen Buchungen. Ein Betrag wird weiterhin auf ein Sachkonto gebucht. Die Dimension hilft anschliessend beim Filtern, Auswerten und Vergleichen.

## Die Seite Dimensionen

Die Seite `Dimensionen` ist die zentrale Liste der Dimensionscodes. Dort stehen Codes wie `PRODUCTLINE`, `CHANNEL` oder `COSTCENTER`. Zu jedem Dimensionscode gehoeren Dimensionswerte. Bei `PRODUCTLINE` sind das zum Beispiel Werte wie `SOFTWARE`, `SERVICE` oder `TRAINING`.

In der Universaarl-Company sind die Starterdimensionen jetzt sichtbar. Fuer den Anfang werden drei Achsen verwendet:

- `PRODUCTLINE` fuer Produktlinien,
- `COSTCENTER` fuer Kostenstellen,
- `CHANNEL` fuer Vertriebskanaele.

Zu diesen Dimensionen gehoeren erste Werte. `PRODUCTLINE` enthaelt `SOFTWARE`, `SERVICE` und `TRAINING`. `COSTCENTER` enthaelt `ADMIN`, `SALES` und `OPERATIONS`. `CHANNEL` enthaelt `DIRECT` und `PARTNER`.

Damit sind die wichtigsten Auswertungsachsen fuer die ersten Beispiele vorhanden. Das ist aber noch keine fertige Reportingstruktur. Eine Dimension wird erst dann im Prozess sichtbar, wenn sie auf Stammdaten, Belegen oder Posten verwendet wird.

## Globale Dimensionen

In der Seite `Finanzbuchhaltung Einrichtung` gibt es den Abschnitt `Dimensionen`. Dort stehen die Felder `Globaler Dimensionscode 1` und `Globaler Dimensionscode 2`.

Globale Dimensionen sind besonders wichtige Dimensionen. Business Central kann sie in vielen Listen, Posten und Auswertungen direkter anzeigen und filtern. Deshalb sollten sie bewusst gewaehlt werden. Wenn spaeter zum Beispiel Produktlinie und Kostenstelle in vielen Auswertungen gebraucht werden, sind sie Kandidaten fuer globale Dimensionen.

In der Universaarl-Company sind diese Felder erreichbar, aber `PRODUCTLINE` und `COSTCENTER` sind noch nicht als globale Dimensionen gespeichert. Die bisher geprueften Wege haben nach erneutem Oeffnen keine dauerhaft sichtbare Zuordnung gezeigt. Deshalb bleibt dieser Schritt bewusst offen.

Das ist kein Grund, Dimensionen komplett zu verwerfen. Die normalen Dimensionen und Werte koennen spaeter auf Stammdaten oder Belegen verwendet werden. Die globale Zuordnung ist nur die besondere, systemweite Hervorhebung fuer Auswertungen und Postenfilter. Sie wird erst wieder angefasst, wenn ein sauberer Bedienweg mit erneutem Oeffnen als Kontrolle vorhanden ist.

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

Standarddimensionen werden ebenfalls noch nicht gesetzt. Sie gehoeren auf konkrete Stammdaten wie Debitoren, Kreditoren, Artikel oder Sachkonten. Solange diese Stammdaten noch nicht als naechster enger Schritt freigegeben sind, gibt es keinen guten Ziel-Datensatz fuer eine Standarddimension.

Der sichere Stand lautet deshalb: Die Dimensionen und ihre Starterwerte sind vorhanden. Globale Dimensionen, Standarddimensionen, Dimensionsposten und Reportingwirkung bleiben offen. Diese Grenze ist wichtig, damit ein spaeterer Bericht nicht schon aus der sichtbaren Dimensionsliste als bewiesen gilt.
