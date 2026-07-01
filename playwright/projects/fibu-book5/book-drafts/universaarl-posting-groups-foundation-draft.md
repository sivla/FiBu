# Buchungsgruppen als Kontenfindung verstehen

Bevor die Universaarl GmbH Kunden, Lieferanten, Artikel oder Belege sinnvoll nutzt, muss klar sein, wie Business Central spaeter die Sachkonten findet. Diese Logik steckt nicht in einem einzelnen Belegfeld. Sie entsteht aus mehreren Einrichtungen, die zusammenarbeiten.

Die Buchungsmatrix verbindet Geschaeftsbuchungsgruppen mit Produktbuchungsgruppen. Dadurch weiss Business Central zum Beispiel, auf welches Erlos- oder Einkaufskonto ein Verkauf oder Einkauf gebucht werden soll. Auf der Seite **Buchungsmatrix Einrichtung** sieht man deshalb Kombinationen aus Geschaeftsbuchungsgruppe und Produktbuchungsgruppe sowie die dazugehoerigen Sachkonten.

Debitorenbuchungsgruppen steuern die Forderungsseite. Wenn spaeter eine Verkaufsrechnung gebucht wird, entsteht ein Debitorenposten. Das zugehoerige Sammelkonto im Hauptbuch kommt aus der Debitorenbuchungsgruppe.

Kreditorenbuchungsgruppen funktionieren entsprechend fuer Lieferanten. Bei einer Eingangsrechnung entsteht ein Kreditorenposten. Das Verbindlichkeitskonto im Hauptbuch kommt aus der Kreditorenbuchungsgruppe.

Fuer Artikel reicht die Debitoren- oder Kreditorenlogik allein nicht aus. Artikel brauchen zusaetzlich Lagerbuchungsgruppen und die Lagerbuchung Einrichtung. Dort wird festgelegt, welches Bestandskonto fuer eine Kombination aus Lagerort und Lagerbuchungsgruppe verwendet wird.

Die USt-Buchungsmatrix ist wieder eine eigene Ebene. Sie legt fest, welche Steuerlogik fuer Kombinationen aus MwSt.-Geschaeftsbuchungsgruppe und MwSt.-Produktbuchungsgruppe gilt. Erst wenn diese Kombinationen stimmen, kann eine Belegvorschau spaeter zeigen, welche Steuerposten und Sachposten entstehen.

Auf den Seiten fuer Buchungsgruppen kann man viele Schaltflaechen sehen, zum Beispiel **Neu**, **Bearbeiten** oder weitere Aktionen in der Befehlsleiste. Diese Schaltflaechen veraendern Einrichtung oder Datensaetze. Fuer den ersten Rundgang reicht es, die Seiten zu oeffnen und zu verstehen, welche Aufgabe sie haben. Werte werden erst geaendert, wenn klar ist, welche Konten, Steuergruppen und Stammdaten die Universaarl GmbH wirklich verwenden soll.

Ein erfolgreicher erster Kontrollpunkt ist erreicht, wenn diese Seiten geoeffnet werden koennen:

- Buchungsmatrix Einrichtung
- Debitorenbuchungsgruppen
- Kreditorenbuchungsgruppen
- Lagerbuchung Einrichtung
- USt-Buchungsmatrix

Diese Sichtpruefung beweist noch nicht, dass die Einrichtung fachlich vollstaendig ist. Sie zeigt aber, wo Business Central die spaetere Kontenfindung vorbereitet. Erst danach lohnt es sich, Kunden, Lieferanten, Artikel und Belege aufzubauen.

Der erste sinnvolle Einrichtungsschritt ist bewusst klein: die Kreditorenbuchungsgruppe fuer inlaendische Lieferanten. Auf der Seite **Kreditorenbuchungsgruppen** legt der Code fest, welche Gruppe spaeter auf einer Lieferantenkarte verwendet wird. Das Feld **Verbindlichkeiten-Konto** legt fest, auf welches Sammelkonto Business Central die offenen Kreditorenposten im Hauptbuch fuehrt. Fuer die Universaarl GmbH ist als erster Kandidat die Gruppe **INLAND** mit dem Verbindlichkeitskonto **3300 Verbindlichkeiten aus Lieferungen und Leistungen** vorgesehen.

Dieser Schritt richtet noch keine Einkaufsrechnung ein. Er erzeugt auch keinen Lieferanten, keinen Artikel und keine Buchung. Er bereitet nur die Kontenfindung fuer Lieferanten vor. Erst wenn diese Gruppe gespeichert und nach erneutem Oeffnen sichtbar ist, kann die Debitorenseite, die allgemeine Buchungsmatrix, die Lagerbuchung und die USt-Buchungsmatrix sauber weiter aufgebaut werden.
