# Business Central bedienen: Oberflaeche, Listen, Filter und viele Daten

Status: `labor-draft`, `needs-universaarl-evidence`, `needs-data-richness`

Aktive Buchwelt:

- Instanz: `playthru`
- Company: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`

## Der erste Blick auf Business Central

Business Central startet fuer Anwender meistens im Role Center. Das Role Center ist die persoenliche Startseite. Es zeigt Aufgaben, Kacheln, Listen, Erinnerungen und haeufig genutzte Aktionen. Von dort aus oeffnet man Karten, Listen, Journale, Berichte und Einrichtungen.

Eine Liste zeigt viele Datensaetze nebeneinander: Kunden, Lieferanten, Artikel, Sachposten oder Belege. Eine Karte zeigt einen einzelnen Datensatz mit Details, zum Beispiel eine Debitorenkarte, eine Artikelkarte oder eine Einkaufsbestellung. Auf Karten sind Informationen in FastTabs gruppiert. FastTabs lassen sich auf- und zuklappen, damit der sichtbare Bereich nicht zu voll wird.

Rechts koennen FactBoxes stehen. Sie zeigen zusaetzliche Informationen zum aktuell markierten Datensatz. Wenn eine Tabelle zu schmal wirkt, kann man FactBoxes ausblenden, FastTabs einklappen, den Fokusmodus nutzen oder horizontal scrollen.

## Buttons genau lesen

Viele Buttons in Business Central bestehen aus zwei Teilen. Die grosse Flaeche fuehrt die Hauptaktion aus. Der kleine Pfeil daneben oeffnet ein Menue mit weiteren Moeglichkeiten. Das ist wichtig, weil ein Klick auf die grosse Flaeche etwas anderes tun kann als ein Klick auf den Pfeil.

Auf der Seite `Mandanten` sieht man das gut am Button `Neu`. Die Hauptaktion kann eine neue Eingabezeile oder einen Erstellungsbereich oeffnen. Der Pfeil neben `Neu` zeigt weitere Eintraege, zum Beispiel `Neues Unternehmen erstellen`. Fuer eine eigene Universaarl-Company muss genau dieser Unterschied verstanden werden. `Neu`, `Neues Unternehmen erstellen`, `Kopieren` und `Testunternehmen` sind nicht dasselbe.

Wenn ein Button unklar ist, hilft der Tooltip. Man bewegt den Mauszeiger auf den Button und wartet kurz. Business Central zeigt dann oft, wie die Aktion heisst und was sie tut. Erst wenn der richtige Button eindeutig ist, wird geklickt.

## Sichtbar ist nicht immer gespeichert

Eine neue Zeile in einer Liste bedeutet nicht automatisch, dass der Datensatz schon vorhanden ist. Sie kann nur ein Eingabebereich sein. Eine Company ist erst dann vorhanden, wenn sie als gespeicherte Zeile in der Mandantenliste sichtbar ist und danach auch als Company-Kontext ausgewaehlt werden kann.

Darum prueft man nach einer Anlage immer:

1. Ist die neue Zeile noch ein Eingabebereich?
2. Gibt es einen Fehler oder Hinweis?
3. Ist der neue Datensatz nach dem Aktualisieren oder Zurueckkehren in der Liste sichtbar?
4. Kann Business Central den Datensatz als Kontext verwenden?

Bei `UNIVERSAARL-DE` ist dieser Nachweis noch offen. Die Anlage wird erst fortgesetzt, wenn die benoetigten Rechte vorhanden sind.

## Suchen und Filtern sind verschiedene Dinge

Die Suche findet Seiten, Berichte oder Funktionen. Sie hilft, von einer Stelle in Business Central zu einer anderen Stelle zu springen. Wer `Debitoren`, `Artikel` oder `Sachposten` in die Suche eingibt, oeffnet damit eine passende Seite. Die Suche ist deshalb ein Navigationswerkzeug.

Filter arbeiten innerhalb einer Liste, eines Reports oder einer Postenansicht. Sie begrenzen die angezeigten Zeilen. Ein Filter auf einen Kunden zeigt nur dessen Posten. Ein Datumsfilter zeigt nur Buchungen innerhalb eines Zeitraums. Ein Dimensionsfilter zeigt nur Werte einer bestimmten Auswertungssicht.

Darum werden Suche und Filter im Buch getrennt verwendet:

- Mit der Suche oeffnet man die richtige Seite.
- Mit einem Listenfilter findet man innerhalb der geoeffneten Seite die richtigen Zeilen.
- Mit einem Reportfilter begrenzt man die Daten, bevor ein Bericht laeuft.

## Listen verstehen

Eine gute Listenansicht beantwortet drei Fragen:

1. Welche Datensaetze sind vorhanden?
2. Welche Spalten sind fuer die Entscheidung wichtig?
3. Welche Aktion wuerde Daten aendern?

Auf einer Debitorenliste sind zum Beispiel Nummer, Name, Saldo, Buchungsgruppe und Zahlungsbedingung wichtig. Auf Sachposten sind Buchungsdatum, Belegnummer, Sachkonto, Betrag und Dimensionen wichtig. Auf Artikelposten zaehlen Artikelnummer, Buchungsart, Menge, Lagerort und Belegnummer.

Listen sind nur dann gute Lernbilder, wenn genug Daten sichtbar sind. Eine Liste mit einer einzigen Zeile zeigt kaum, wie Sortieren, Filtern oder Vergleichen funktioniert. Fuer die Universaarl GmbH brauchen die Listen deshalb mehrere Kunden, Lieferanten, Artikel, Belege, Buchungsdaten und Posten.

## Filter list by und Filter totals by

In Listen gibt es einfache Zeilenfilter. Sie begrenzen die sichtbaren Datensaetze, zum Beispiel auf einen Kunden, ein Datum oder einen Status. In manchen Bereichen gibt es zusaetzlich Summenfilter. Diese beeinflussen, welche Werte in berechneten Summen oder FlowFields erscheinen.

Der Unterschied ist wichtig:

- `Filter list by` steuert, welche Zeilen in der Liste sichtbar sind.
- `Filter totals by` steuert, welche Werte in berechneten Summen beruecksichtigt werden.

Ein Beispiel: Auf einer Debitorenliste kann ein Listenfilter die sichtbaren Kunden auf eine Kundengruppe begrenzen. Ein Summenfilter kann den angezeigten Saldo auf einen Zeitraum oder eine Dimension begrenzen. Der gleiche Datensatz kann dadurch sichtbar bleiben, aber mit einem anderen berechneten Betrag erscheinen.

## Ansichten und gespeicherte Filter

Business Central kann Listenansichten verwenden. Eine Ansicht ist eine vorbereitete Sicht auf eine Liste: bestimmte Filter, Sortierungen oder Spalten sind bereits eingestellt. Fuer einen Anfaenger ist das praktisch, weil er nicht jedes Mal von vorne filtern muss.

Ansichten sind aber kein Buchungsnachweis. Sie helfen beim Arbeiten und Auswerten. Wenn eine Ansicht gespeichert oder personalisiert wird, kann das die Benutzeroberflaeche veraendern. Deshalb wird im Buch unterschieden:

- Eine Ansicht oeffnen oder lesen ist eine Navigations- und Analysehandlung.
- Eine Ansicht speichern oder die Oberflaeche personalisieren ist eine Aenderung am Benutzerkontext.
- Eine gefilterte Liste beweist nur die sichtbaren Zeilen, nicht automatisch eine Buchungswirkung.

## Filter in Reports

Viele Reports starten mit einer Request Page. Dort setzt man Optionen und Filter, bevor der Report laeuft. Ein Datumsfilter im Report kann andere Ergebnisse liefern als ein Listenfilter auf einer bereits geoeffneten Postenliste. Deshalb werden Reportfilter im Buch separat erklaert.

Ein Anfaenger soll vor dem Start eines Reports immer pruefen:

- Welcher Zeitraum wird ausgewertet?
- Welche Konten, Kunden, Lieferanten oder Artikel sind eingeschlossen?
- Gibt es Dimensionsfilter?
- Wird nur angezeigt, gedruckt, exportiert oder werden Daten veraendert?

Eine Request Page ist deshalb ein eigener Kontrollpunkt. Vor dem Start sieht man, welche Daten in den Report eingehen sollen. Nach dem Start prueft man, ob der Report nur angezeigt wurde oder ob Business Central dadurch Daten erzeugt, aktualisiert oder bucht.

## Analysemodus

Der Analysemodus hilft, Listendaten direkt in Business Central auszuwerten. Man kann Daten gruppieren, filtern und Summen bilden, ohne sofort einen festen Bericht zu bauen. Das ist besonders hilfreich, wenn man Posten verstehen will: Welche Kunden haben offene Betraege? Welche Artikel hatten Bewegungen? Welche Dimension verursacht den groessten Betrag?

Der Analysemodus ersetzt keine Postenspur. Er ist ein Lesewerkzeug. Die eigentliche Buchungswahrheit liegt weiterhin in den gebuchten Posten: Sachposten, Debitorenposten, Kreditorenposten, Artikelposten, Wertposten, Bankposten oder Anlagenposten.

## Arbeiten mit Posten

Posten sind die Spur der Buchung. Nach einem Verkaufsprozess entstehen zum Beispiel Debitorenposten, Sachposten und Umsatzsteuerposten. Nach einem Lagerprozess entstehen Artikelposten und Wertposten. Nach einer Zahlung entstehen Bankposten und Ausgleichseintraege.

Listenfilter helfen, diese Spur zu lesen. Man filtert nach Belegnummer, Buchungsdatum, Konto, Debitor, Kreditor, Artikel oder Dimension. Danach prueft man, ob die Zeilen zusammenpassen.

## Beispiele mit echten Universaarl-Daten

Die Universaarl-Beispiele brauchen Daten, die mehr zeigen als eine leere Startcompany:

- mehrere Debitoren mit unterschiedlichen offenen Posten,
- mehrere Kreditoren mit Einkaufsbelegen und Zahlungen,
- Artikel mit Lagerbewegungen und Wertposten,
- Sachposten ueber mehrere Konten und Monate,
- Dimensionen fuer Produktlinie, Kanal oder Kostenstelle,
- Reports mit Datums- und Dimensionsfiltern.

Mit dieser Datenbasis werden die Listen im Buch aussagekraeftig. Man sieht dann nicht nur, dass eine Seite existiert, sondern auch, wie man aus vielen Zeilen die richtige Information findet.

## Screenshot-Plan

| Screenshot | Zweck | Status |
| --- | --- | --- |
| Role Center Universaarl | Einstieg, Startseite, Navigation | `planned` |
| Debitorenliste mit mehreren Kunden | Suchfeld, Sortierung, Listenfilter | `needs-data-richness` |
| Debitorenposten mit offenen und geschlossenen Posten | Postenfilter und Erfolgskontrolle | `needs-data-richness` |
| Sachposten mit Datums- und Dimensionsfilter | Buchungsspur lesen | `needs-data-richness` |
| Artikelliste und Artikelposten | Lagerdaten filtern | `needs-data-richness` |
| Report Request Page | Reportfilter vor Ausfuehrung verstehen | `needs-data-richness` |
| Analysis Mode / Analysemodus | Daten ohne Buchung untersuchen | `needs-data-richness` |
