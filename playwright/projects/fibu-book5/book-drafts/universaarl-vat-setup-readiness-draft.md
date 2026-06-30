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
