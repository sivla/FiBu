# USt-Einrichtung vor dem ersten Beleg

Bevor in Business Central eine Verkaufsrechnung oder Einkaufsrechnung mit deutscher Umsatzsteuer gebucht wird, muss die USt-Einrichtung stimmen. Business Central trennt dabei drei Bausteine:

- Die MwSt.-Geschaeftsbuchungsgruppen beschreiben, mit wem gehandelt wird, zum Beispiel Inland, EU oder Ausland.
- Die MwSt.-Produktbuchungsgruppen beschreiben, was verkauft oder eingekauft wird, zum Beispiel normal besteuerte Waren, ermaessigte Waren oder steuerfreie Leistungen.
- Die MwSt.-Buchungsmatrix verbindet beide Gruppen. Erst dort stehen der Steuersatz, die Berechnungsart und die USt-Konten.

Auf der Seite **MwSt.-Geschaeftsbuchungsgruppen** sieht man die Geschaeftsgruppen. Auf der Seite **MwSt.-Produktbuchungsgruppen** sieht man die Produktgruppen. Auf der Seite **MwSt.-Buchungsmatrix Einrichtung** sieht man die Kombination aus beiden Gruppen. Diese Kombination entscheidet spaeter, welche Umsatzsteuer berechnet wird und auf welche Konten Business Central bucht.

Die Sichtbarkeit dieser Seiten reicht noch nicht aus. Eine deutsche 19-Prozent-USt ist erst nachgewiesen, wenn die passenden Gruppen, der Steuersatz, die Konten, ein Beleg, die Buchungsvorschau und die USt-Posten zusammenpassen. Deshalb wird vor dem ersten Beleg nur gelesen und geprueft. Aenderungen an der USt-Einrichtung bekommen einen eigenen Schritt mit Vorher-Nachher-Bild und klarer Buchungswirkung.

Fuer Universaarl ist der aktuelle Stand: Die drei USt-Seiten sind in `UNIVERSAARL-DE` erreichbar. Es wurde nichts geaendert. Die Einrichtung ist damit als Kontext sichtbar, aber noch nicht als fachlich richtig oder buchungsbereit freigegeben.

Als erste kleine Zielstruktur verwenden wir zwei Gruppen: `INLAND` fuer Geschaefte innerhalb Deutschlands und `VAT19` fuer normal besteuerte Waren und Leistungen. Diese beiden Gruppen sind leichter zu verstehen als eine lange Liste aller denkbaren Steuerfaelle. Sobald sie in Business Central sichtbar angelegt sind, kann die MwSt.-Buchungsmatrix eine Zeile fuer `INLAND` + `VAT19` bekommen. In dieser Zeile stehen dann der Steuersatz, die Berechnungsart und die beiden USt-Konten.

Die Konten sind im Starterkontenplan vorbereitet: `3806 Umsatzsteuer 19 Prozent` fuer die Umsatzsteuer aus Verkaeufen und `1406 Abziehbare Vorsteuer 19 Prozent` fuer Vorsteuer aus Einkaeufen. Auch das ist noch kein Buchungsnachweis. Erst wenn Business Central diese Werte in der MwSt.-Buchungsmatrix speichert und ein spaeterer Beleg in der Buchungsvorschau die erwarteten Posten zeigt, ist der Ablauf fachlich belastbar.

Auf der Artikelkarte gehoert die USt-Produktlogik in das Feld **MwSt.-Produktbuchungsgruppe**. Fuer den Artikel `U-ITEM-HW100` steht dort jetzt `VAT19`. Das bedeutet: Der Artikel ist fuer die normale 19-Prozent-USt-Produktseite vorbereitet. Es bedeutet noch nicht, dass Business Central schon Steuer berechnen kann.

Die Steuerberechnung entsteht erst, wenn auch die Geschaeftsseite vorhanden ist. Ein inlaendischer Kunde oder Lieferant braucht eine passende **MwSt.-Geschaeftsbuchungsgruppe**, zum Beispiel `INLAND`. Danach muss die **MwSt.-Buchungsmatrix Einrichtung** die Kombination `INLAND` + `VAT19` enthalten. In dieser Matrixzeile stehen der Prozentsatz, die Berechnungsart und die Steuerkonten.

Das laesst sich an einem einfachen Universaarl-Beispiel erklaeren. Der Kunde `U-CUST-100` / `Saarland Maschinenbau AG` ist ein inlaendischer Geschaeftspartner fuer Trainingszwecke. Der Artikel `U-ITEM-HW100` / `Steuerbox Standard U100` ist ein Warenartikel mit der Produktseite `VAT19`. Damit sind zwei sichtbare Bausteine vorhanden: ein Kunde und ein Artikel. Fuer die Steuer reicht das aber noch nicht.

Business Central braucht eine vollstaendige Steuerkombination. Auf der Kundenseite muss klar sein, welche MwSt.-Geschaeftsbuchungsgruppe gilt. Auf der Artikelseite steht die MwSt.-Produktbuchungsgruppe. Die **MwSt.-Buchungsmatrix Einrichtung** verbindet beide Seiten. Erst dort wird aus den beiden Gruppen eine konkrete Steuerlogik mit Prozentsatz, Berechnungsart, Umsatzsteuerkonto und Vorsteuerkonto.

Wenn nur der Artikel `VAT19` traegt, kann ein Anwender zwar verstehen, welche Produktlogik gemeint ist. Er darf daraus aber noch keine fertige Verkaufsrechnung oder Einkaufsrechnung ableiten. Vor einer Belegvorschau muss die passende Matrixzeile sichtbar sein. Vor einer echten Buchung muessen ausserdem die Steuerwirkung, die Sachkonten und die spaeteren USt-Posten nachvollziehbar sein.

Darum ist die Reihenfolge wichtig:

1. USt-Produktgruppe am Artikel setzen.
2. USt-Geschaeftsgruppe am Kunden oder Lieferanten setzen.
3. USt-Buchungsmatrix fuer die Kombination einrichten.
4. Erst danach einen Beleg pruefen.
5. Vor dem Buchen die Buchungsvorschau lesen.

Wenn nur Schritt 1 erledigt ist, sieht der Artikel schon richtig vorbereitet aus. Trotzdem waere ein Verkaufs- oder Einkaufsbeleg noch zu frueh. Business Central braucht die ganze Kombination, sonst fehlt die Steuer- und Kontenfindung.

Fuer Schulung und Handbuch ist das ein guter Moment, um die Rollen zu trennen. Vertrieb und Einkauf koennen lernen, wo sie Kunde, Lieferant, Artikel, Preis und Menge sehen. Finance erklaert, warum Belege erst dann weiterlaufen, wenn USt- und Buchungsgruppen eingerichtet sind. Der Steuerberater oder die steuerverantwortliche Rolle prueft, ob die gewaehlte Steuerlogik fuer den konkreten Geschaeftsfall passt.
