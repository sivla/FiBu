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

Auf der Seite **Debitorenbuchungsgruppen** ist jetzt ebenfalls die Gruppe **INLAND** vorhanden. Sie steht fuer inlaendische Kunden. In der Liste sieht man den Code **INLAND**, die Beschreibung **Inlaendische Kunden** und das **Debitorensammelkonto 1200**. Dieses Sammelkonto verbindet spaetere Debitorenposten mit dem Forderungskonto im Hauptbuch.

Business Central oeffnet auch diese Einrichtung ueber **Neu** zunaechst als Karte. Dort werden **Code**, **Beschreibung** und **Debitorensammelkonto** gepflegt. Nach dem erneuten Oeffnen der Liste ist die Gruppe sichtbar. Damit ist die Forderungsseite vorbereitet, aber noch keine Verkaufsbuchung bewiesen: Es gibt noch keinen Kunden, keine Verkaufsrechnung, keine Belegvorschau und keine Sachposten.

Der naechste Einrichtungsschritt ist die allgemeine Buchungsmatrix. Dort reichen einzelne Debitoren- und Kreditorenbuchungsgruppen nicht aus. Business Central braucht zusaetzlich Kombinationen aus Geschaeftsbuchungsgruppen und Produktbuchungsgruppen, damit Verkaufs- und Einkaufsbetraege spaeter auf die richtigen Erloes- und Aufwandskonten laufen.

Die Geschaeftsbuchungsgruppe beschreibt, mit welcher Art von Geschaeftspartner die Universaarl GmbH arbeitet. Fuer den ersten deutschen Inlandsfall bietet sich wieder **INLAND** an. Die Produktbuchungsgruppe beschreibt, was verkauft oder eingekauft wird. Fuer den ersten Warenfall kann eine Gruppe wie **WAREN** verwendet werden. Erst die Kombination aus beiden Gruppen fuehrt in der Buchungsmatrix zu den Sachkonten, zum Beispiel zu **4400 Umsatzerloese Inland 19 Prozent** fuer Verkauf und **5400 Wareneingang / Materialaufwand** fuer Einkauf.

Vor dem Eintragen dieser Kombination muss die Oberflaeche noch einmal getrennt geprueft werden: zuerst die Geschaeftsbuchungsgruppen, dann die Produktbuchungsgruppen und danach die Buchungsmatrix Einrichtung. Dieser Zwischenschritt verhindert, dass eine einzelne Matrixzeile ohne passende Grundgruppen entsteht. Auch danach ist noch keine Buchung bewiesen; die Buchungsmatrix ist nur eine Voraussetzung fuer spaetere Belegvorschau und Postenspur.

Auf der Seite **Geschaeftsbuchungsgruppen** sieht man eine einfache Liste mit **Code** und **Beschreibung**. Die Schaltflaechen **Neu** und **Liste bearbeiten** sind sichtbar. Fuer die Universaarl GmbH ist hier der Code **INLAND** der naheliegende Startpunkt: Er beschreibt inlaendische Geschaeftspartner, also Kunden und Lieferanten im deutschen Inland.

Auf der Seite **Produktbuchungsgruppen** ist die Struktur aehnlich. Auch hier stehen **Code** und **Beschreibung** im Mittelpunkt. Fuer den ersten Warenprozess braucht die Universaarl GmbH eine Produktgruppe fuer Waren. Der Arbeitscode **WAREN** ist dafuer geeignet, solange klar bleibt: Er ist eine Startergruppe fuer den ersten Buchpfad und noch kein vollstaendiger Produktgruppenplan.

Erst danach folgt die Seite **Buchungsmatrix Einrichtung**. Dort werden beide Gruppen miteinander kombiniert. In der Liste sieht man unter anderem **Geschaeftsbuchungsgruppe**, **Produktbuchungsgruppe**, **Warenverkaufskonto** und **Wareneinkaufskonto**. Fuer den ersten Universaarl-Pfad liegt damit eine enge Zielkombination nahe: **INLAND** + **WAREN**, Verkauf auf **4400 Umsatzerloese Inland 19 Prozent**, Einkauf auf **5400 Wareneingang / Materialaufwand**.

Die beiden Grundgruppen sind jetzt in der Universaarl-Company vorhanden. Auf der Seite **Geschaeftsbuchungsgruppen** steht **INLAND** mit der Beschreibung **Inlaendische Geschaeftspartner**. Auf der Seite **Produktbuchungsgruppen** steht **WAREN** mit der Beschreibung **Waren**. Beide Werte sind nach dem erneuten Oeffnen der jeweiligen Liste sichtbar. Das ist der wichtige Kontrollpunkt: Die Werte stehen nicht nur in einer Eingabezeile, sondern werden von Business Central wieder angezeigt.

Die Seite **Buchungsmatrix Einrichtung** bleibt der naechste Schritt. Dort reicht es nicht, einfach von links nach rechts Werte in sichtbare Eingabefelder zu tippen. Zwischen dem **Warenverkaufskonto** und dem **Wareneinkaufskonto** liegen weitere Spalten wie Gutschrift- und Vorauszahlungskonten. Deshalb muss vor dem Eintragen der Kombination **INLAND** + **WAREN** eindeutig klar sein, welches Feld wirklich das Verkaufskonto **4400** und welches Feld wirklich das Einkaufskonto **5400** ist.

In der sichtbaren Matrix liegen die Spalten in einer fachlichen Reihenfolge: zuerst **Geschaeftsbuchungsgruppe** und **Produktbuchungsgruppe**, danach **Warenverkaufskonto**, dann weitere Verkaufsfelder wie Gutschrift und Vorauszahlung, danach **Wareneinkaufskonto** und weitere Einkaufsfelder. Fuer die Einrichtung bedeutet das: Man orientiert sich an den Spaltenueberschriften, nicht an der blossen Reihenfolge der Eingabefelder.

Wenn Business Central beim Bearbeiten einer Matrixzeile eine rote Fehlermeldung anzeigt, ist das noch kein gespeicherter Zielzustand. Dann wird die Seite erneut geoeffnet und geprueft, ob die Zeile wirklich vorhanden ist. Erst eine wieder sichtbar gespeicherte Zeile ist ein brauchbarer Kontrollpunkt.

Auf der Seite **Buchungsmatrix Einrichtung** kann der Button **Neu** sichtbar sein, ohne dass sofort eine editierbare Zeile in der Liste erscheint. Auch der Bearbeitungsmodus ist fuer sich allein noch kein Beweis, dass eine neue Matrixzeile angelegt wurde. Wichtig ist, ob unter den richtigen Spalten echte Eingabefelder sichtbar sind. Wenn keine Eingabefelder fuer **Geschaeftsbuchungsgruppe**, **Produktbuchungsgruppe**, **Warenverkaufskonto** und **Wareneinkaufskonto** erscheinen, werden keine Werte blind eingetragen.

In diesem Fall bleibt die richtige Arbeitsweise ruhig und kontrolliert: Die Seite wird erneut geoeffnet, der leere Zustand wird geprueft, und anschliessend wird ein anderer Weg gesucht. Je nach Business-Central-Oberflaeche kann das eine Zeilenkarte, eine Aktion fuer die Detailbearbeitung oder eine andere sichere Einrichtungsroute sein. Entscheidend ist immer der Kontrollpunkt nach dem Speichern: Die Kombination **INLAND** + **WAREN** muss mit **4400** und **5400** wieder sichtbar sein, bevor sie als eingerichtete Buchungsmatrix gilt.

Bis diese Matrixzeile sichtbar gespeichert ist, bleibt die Company noch nicht buchungsbereit. Die Gruppen **INLAND** und **WAREN** sind nur Bausteine fuer die Kontenfindung. Eine spaetere Verkaufs- oder Einkaufsbelegvorschau darf erst folgen, wenn auch die Buchungsmatrix, die USt-Einrichtung, Lagerlogik und Dimensionslogik passend vorbereitet sind.

Bei leeren Matrixseiten ist Geduld wichtiger als Tempo. Business Central zeigt in der Befehlsleiste mehrere naheliegende Aktionen: **Neu**, **Liste bearbeiten**, **Konten vorschlagen**, **Kopieren...** und **Weitere Optionen**. Diese Buttons sehen wie schnelle Wege aus, aber sie haben unterschiedliche Bedeutung. **Neu** muss eine echte Eingabezeile oder Karte erzeugen. **Liste bearbeiten** muss wirklich bearbeitbare Felder freigeben. **Weitere Optionen** kann auch nur die Befehlsleiste erweitern, ohne eine neue Bearbeitungsroute zu oeffnen.

Fuer die Universaarl GmbH ist deshalb der sichtbare Kontrollpunkt entscheidend. Auf der Seite **Buchungsmatrix Einrichtung** muss eine Zeile mit **INLAND** und **WAREN** wieder sichtbar sein. In dieser Zeile muessen die Konten **4400** und **5400** in den richtigen Spalten stehen. Wenn Business Central stattdessen eine andere Seite wie **MwSt.-Posten** oeffnet, ist das kein Weg zur Buchungsmatrix. Dann wird nicht geschrieben, sondern die Einrichtung wird bewusst geparkt oder ueber eine besser belegte Standardroute vorbereitet.

Dieser Zwischenstand ist fuer das Lernen trotzdem wertvoll. Man sieht daran, dass Business Central nicht nur aus Feldern besteht, die man der Reihe nach ausfuellt. Viele Seiten sind Listen, Karten oder Postenuebersichten mit eigener Logik. Eine Postenliste zeigt gebuchte Ergebnisse. Eine Einrichtungsliste veraendert Regeln fuer spaetere Buchungen. Diese beiden Dinge duerfen nicht verwechselt werden.

Solange diese Matrixzeile nicht sicher gespeichert ist, bleibt die Buchungsmatrix ein offener Einrichtungspunkt. Das bremst aber nicht jede andere Grundlage. Dimensionen, Dimensionswerte und spaetere Auswertungsmerkmale koennen als eigener Baustein vorbereitet werden. Sie machen eine Company noch nicht buchungsbereit, helfen aber dabei, spaetere Belege und Posten nach Produktlinie, Kostenstelle oder Vertriebskanal auszuwerten. Deshalb wird die Buchungsmatrix nicht mit unsicheren Eingaben erzwungen; sie bleibt offen, bis ein sauberer Weg sichtbar ist.

Auf der Artikelkarte gibt es eine zweite Stelle, an der die Produktlogik sichtbar wird. Im FastTab **Einstandspreise und Buchung** steht beim Artikel `U-ITEM-HW100` die **Produktbuchungsgruppe**. Dort ist jetzt `WAREN` eingetragen. Damit ist der Artikel auf der Produktseite fuer Waren vorbereitet.

Diese Eintragung ist nur ein Teil der Kontenfindung. Business Central braucht spaeter auch die Geschaeftsseite, zum Beispiel `INLAND` auf einem Kunden oder Lieferanten. Erst die Kombination `INLAND` + `WAREN` in der **Buchungsmatrix Einrichtung** entscheidet, auf welche Erlos- und Einkaufskonten ein Beleg laeuft.

Fuer den ersten Warenfall sind die Zielkonten bereits als Starterkonten vorhanden: `4400 Umsatzerloese Inland 19 Prozent` fuer Verkauf und `5400 Wareneingang / Materialaufwand` fuer Einkauf. Solange die Matrixzeile aber nicht sichtbar gespeichert ist, bleibt `WAREN` auf der Artikelkarte nur eine Vorbereitung. Es gibt dadurch noch keine Belegvorschau, keine Buchung und keine Sachposten.

Ein gutes Trainingsbeispiel ist deshalb noch kein freigegebener Prozess. Der Kunde `U-CUST-100` / `Saarland Maschinenbau AG` und der Artikel `U-ITEM-HW100` / `Steuerbox Standard U100` sehen wie echte Projektstammdaten aus und eignen sich gut, um die Karten, FastTabs, Preise und Buchungsgruppen zu erklaeren. Sie ersetzen aber nicht die fehlende Einrichtung darunter.

Fuer einen Verkauf an diesen Kunden liest Business Central die Kundenseite aus dem Debitor und die Produktseite aus dem Artikel. Der Debitor liefert zum Beispiel die Geschaeftsbuchungsgruppe `INLAND`. Der Artikel liefert die Produktbuchungsgruppe `WAREN`. Danach sucht Business Central in der **Buchungsmatrix Einrichtung** die passende Kombination. Wenn dort nur das Verkaufskonto `4400` nachvollziehbar ist, aber das Einkaufskonto `5400` noch nicht verlaesslich gespeichert wurde, ist die Verkaufsseite fuer das Lernen weiter als die Einkaufsseite. Ein Einkaufsprozess wird dadurch nicht freigegeben.

Fuer Kundenprojekte ist diese Grenze wichtig. Eine Fachabteilung kann schon mit realistischen Debitoren- und Artikeldaten ueben, ohne dass Finance bereits die gesamte Buchungslogik freigegeben hat. Sobald aber ein Beleg in Richtung **Buchungsvorschau** oder **Buchen** gehen soll, reicht diese Uebungsebene nicht mehr aus. Dann muessen Buchungsmatrix, USt-Buchungsmatrix, Lagerbuchung und Dimensionslogik zusammenpassen.
