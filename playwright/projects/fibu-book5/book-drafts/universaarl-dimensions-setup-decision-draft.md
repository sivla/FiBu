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

Auf der Seite `Dimensionswerte` ist je Dimension bereits ein erster Wert sichtbar:

- `PRODUCTLINE` enthaelt `SOFTWARE`.
- `COSTCENTER` enthaelt `ADMIN`.
- `CHANNEL` enthaelt `DIRECT`.

Diese Werte reichen noch nicht fuer alle spaeteren Beispiele. Fuer die ersten Belege brauchen wir auch `SERVICE`, `TRAINING`, `SALES`, `OPERATIONS` und `PARTNER`. Die Liste `Dimensionswerte` zeigt zwar `Neu` und `Liste bearbeiten`, die aktuelle Bedienroute kann weitere Zeilen aber noch nicht stabil speichern. Deshalb kommen Kunden, Lieferanten und Artikel erst danach an die Reihe.

Eine Dimension besteht nicht nur aus dem Dimensionscode. Die Werte sind genauso wichtig, weil sie spaeter auf Belegen, Stammdaten und Posten stehen. Erst wenn die Werte sichtbar sind, kann man sie sinnvoll als Standarddimension oder Belegdimension verwenden.

## Was noch offen bleibt

Eine angelegte Dimension beweist noch keine Auswertung. Die Auswertung entsteht erst, wenn ein Beleg mit Dimensionen gebucht wurde und die Dimensionen in den Posten oder Berichten sichtbar sind.
