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

Der erste Einrichtungsschritt ist bewusst klein: die Kreditorenbuchungsgruppe fuer inlaendische Lieferanten. Auf der Seite **Kreditorenbuchungsgruppen** legt der Code fest, welche Gruppe spaeter auf einer Lieferantenkarte verwendet wird. Das Feld **Verbindlichkeiten-Konto** legt fest, auf welches Sammelkonto Business Central die offenen Kreditorenposten im Hauptbuch fuehrt.

Fuer die Universaarl GmbH wird die Gruppe **INLAND** verwendet. Sie steht fuer inlaendische Lieferanten. Als Verbindlichkeitskonto ist **3300 Verbindlichkeiten aus Lieferungen und Leistungen** hinterlegt. Wenn spaeter eine Eingangsrechnung gebucht wird, sorgt diese Gruppe dafuer, dass der offene Kreditorenbetrag auf dieses Sammelkonto laeuft.

Business Central oeffnet beim Anlegen nicht immer eine neue Zeile direkt in der Liste. Auf der Seite **Kreditorenbuchungsgruppen** fuehrt **Neu** in eine Karte. Dort werden **Code**, **Beschreibung** und **Verbindlichkeiten-Konto** gepflegt. Nach dem Speichern ist die Gruppe wieder in der Liste sichtbar. Dieser Reopen-Kontrollpunkt ist wichtig: Erst die sichtbare Liste zeigt, dass die Gruppe nicht nur in einer offenen Karte stand, sondern in der Company gefunden wird.

Dieser Schritt richtet noch keine Einkaufsrechnung ein. Er erzeugt auch keinen Lieferanten, keinen Artikel und keine Buchung. Er bereitet nur die Kontenfindung fuer Lieferanten vor. Die Debitorenseite, die allgemeine Buchungsmatrix, die Lagerbuchung und die USt-Buchungsmatrix brauchen jeweils eigene Kontrollpunkte, bevor Stammdaten und Belege angelegt werden.

Auf der Debitorenseite gilt dieselbe Logik, aber mit einem anderen Sammelkonto. Eine Debitorenbuchungsgruppe darf erst angelegt werden, wenn das Forderungskonto sichtbar im Kontenplan vorhanden ist. Das Konto **1406 Abziehbare Vorsteuer 19 Prozent** ist dafuer nicht geeignet, weil es zur Vorsteuer gehoert.

Fuer die SKR04-orientierte Universaarl-Struktur verwenden wir **1200 Forderungen aus Lieferungen und Leistungen** als Forderungskonto. Dieses Konto steht im Kontenplan als **Bilanz** und **Buchung**. Das ist wichtig: Forderungen sind Vermoegenswerte. Wenn spaeter eine Verkaufsrechnung gebucht wird, entsteht nicht nur ein Debitorenposten, sondern auch ein Sachposten auf dem Forderungskonto.

Vor der Korrektur war die Nummer **1200** mit einer falschen Bezeichnung belegt. Im Kontenplan stand dort **Bank Saarland**. Das Bankkonto steht jetzt getrennt auf **1800 Bank Saarland**. Dadurch ist die Trennung wieder sauber: **1200** ist fuer Forderungen, **1800** ist fuer Bank. Erst nach diesem Kontrollpunkt kann die Debitorenbuchungsgruppe vorbereitet werden.

Der naechste kleine Schritt ist die Seite **Debitorenbuchungsgruppen**. Dort wird eine Gruppe **INLAND** fuer inlaendische Kunden angelegt oder geprueft. Im Feld **Debitorensammelkonto** wird **1200** eingetragen. Auch dieser Schritt erzeugt noch keinen Kunden, keine Rechnung, keine Belegvorschau und keine Buchung. Er bereitet nur die Forderungsseite fuer spaetere Verkaufsprozesse vor.
