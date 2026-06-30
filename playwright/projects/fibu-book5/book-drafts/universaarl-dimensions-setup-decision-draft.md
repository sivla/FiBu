# Dimensionen fuer die ersten Universaarl-Prozesse

Die Universaarl GmbH braucht vor den ersten Stammdaten eine einfache, stabile Dimensionsstruktur. Sie soll nicht zu gross sein, aber genug Auswertung ermoeglichen.

Fuer den Start reichen drei Dimensionen:

- `PRODUCTLINE` fuer die Produktlinie
- `COSTCENTER` fuer die Kostenstelle
- `CHANNEL` fuer den Vertriebskanal

Mit `PRODUCTLINE` lassen sich Umsaetze, Einkaeufe und Lagerbewegungen spaeter nach dem Angebot der Universaarl GmbH auswerten. Die ersten Werte sind `SOFTWARE`, `SERVICE` und `TRAINING`.

Mit `COSTCENTER` werden Kosten und Buchungen nach Verantwortungsbereichen getrennt. Die ersten Werte sind `ADMIN`, `SALES` und `OPERATIONS`.

Mit `CHANNEL` kann ein Verkaufsprozess spaeter unterscheiden, ob ein Auftrag direkt oder ueber einen Partner entsteht. Die ersten Werte sind `DIRECT` und `PARTNER`.

## Globale Dimensionen fuer den Anfang

Business Central kann zwei globale Dimensionen besonders sichtbar in Posten und Auswertungen verwenden. Fuer die Universaarl GmbH sind zum Start `PRODUCTLINE` und `COSTCENTER` die besten Kandidaten.

`CHANNEL` bleibt zunaechst eine normale Dimension. Sie wird spaeter wichtig, wenn Verkaufsprozesse und Berichte entstehen.

## Warum dieser Schritt vor Stammdaten kommt

Kunden, Lieferanten und Artikel koennen Standarddimensionen bekommen. Wenn Dimensionen erst nach den Stammdaten entstehen, muss man diese Zuordnungen spaeter nacharbeiten.

Deshalb wird zuerst die Dimensionsbasis angelegt. Danach folgen Kunden, Lieferanten, Artikel und Belege.

## Was in Business Central schon sichtbar ist

Die Seite `Dimensionen` zeigt die drei Dimensionen `PRODUCTLINE`, `COSTCENTER` und `CHANNEL`. Damit sind die Auswertungsachsen fuer die Universaarl GmbH angelegt.

Auf der Seite `Dimensionswerte` sind die Startwerte jetzt sichtbar:

- `PRODUCTLINE` enthaelt `SOFTWARE`, `SERVICE` und `TRAINING`.
- `COSTCENTER` enthaelt `ADMIN`, `SALES` und `OPERATIONS`.
- `CHANNEL` enthaelt `DIRECT` und `PARTNER`.

Damit sind die wichtigsten Auswertungswerte fuer die ersten Beispiele vorhanden. In Business Central fuehrt der stabile Weg ueber die Seite `Dimensionen`: Zuerst wird die Dimension markiert, danach oeffnet man ueber `Dimension` die zugehoerigen `Dimensionswerte`. In dieser gefilterten Werte-Liste werden neue Werte in der letzten Eingabezeile erfasst und anschliessend durch erneutes Oeffnen der Liste geprueft.

Eine Dimension besteht nicht nur aus dem Dimensionscode. Die Werte sind genauso wichtig, weil sie spaeter auf Belegen, Stammdaten und Posten stehen. Erst wenn die Werte sichtbar sind, kann man sie sinnvoll als Standarddimension oder Belegdimension verwenden.

## Was noch offen bleibt

Eine angelegte Dimension beweist noch keine Auswertung. Die Auswertung entsteht erst, wenn ein Beleg mit Dimensionen gebucht wurde und die Dimensionen in den Posten oder Berichten sichtbar sind.

Vor den ersten Stammdaten wird noch festgelegt, welche Dimensionen als globale Dimensionen besonders sichtbar in Posten und Auswertungen erscheinen. Fuer den Start sind `PRODUCTLINE` und `COSTCENTER` die Kandidaten.

Auf der Seite `Finanzbuchhaltung Einrichtung` stehen die Felder `Globaler Dimensionscode 1` und `Globaler Dimensionscode 2` im Abschnitt `Dimensionen`. In der aktuellen Universaarl-Company sind diese beiden Felder noch leer. Die Aktion `Globale Dimensionen aendern...` oeffnet eine eigene Seite mit den Optionen `Fortlaufend` und `Parallel`; dort nimmt die sichtbare linke Eingabespalte zwar `PRODUCTLINE` und `COSTCENTER` an, nach dem erneuten Oeffnen der Einrichtung bleiben die globalen Dimensionsfelder aber leer.

Fuer die ersten Stammdaten heisst das: Die Dimensionen und ihre Werte sind vorhanden, aber `PRODUCTLINE` und `COSTCENTER` sind noch nicht als globale Dimensionen nachgewiesen. Bevor daraus Belege, Posten oder Auswertungen entstehen, muss die genaue Feld- und Aktionslogik der Seite `Globale Dimensionen aendern` sauber geklaert werden. Erst danach ist sinnvoll erkennbar, welche Dimension spaeter als globale Dimension in Posten und Berichten besonders einfach gefiltert werden kann.
