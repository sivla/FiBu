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

## Suchen und Filtern sind verschiedene Dinge

Die Suche findet Seiten, Berichte oder Funktionen. Sie hilft, von einer Stelle in Business Central zu einer anderen Stelle zu springen.

Filter arbeiten innerhalb einer Liste, eines Reports oder einer Postenansicht. Sie begrenzen die angezeigten Zeilen. Ein Filter auf einen Kunden zeigt nur dessen Posten. Ein Datumsfilter zeigt nur Buchungen innerhalb eines Zeitraums. Ein Dimensionsfilter zeigt nur Werte einer bestimmten Auswertungssicht.

## Listen verstehen

Eine gute Listenansicht beantwortet drei Fragen:

1. Welche Datensaetze sind vorhanden?
2. Welche Spalten sind fuer die Entscheidung wichtig?
3. Welche Aktion wuerde Daten aendern?

Auf einer Debitorenliste sind zum Beispiel Nummer, Name, Saldo, Buchungsgruppe und Zahlungsbedingung wichtig. Auf Sachposten sind Buchungsdatum, Belegnummer, Sachkonto, Betrag und Dimensionen wichtig. Auf Artikelposten zaehlen Artikelnummer, Buchungsart, Menge, Lagerort und Belegnummer.

## Filter list by und Filter totals by

In Listen gibt es einfache Zeilenfilter. Sie begrenzen die sichtbaren Datensaetze, zum Beispiel auf einen Kunden, ein Datum oder einen Status. In manchen Bereichen gibt es zusaetzlich Summenfilter. Diese beeinflussen, welche Werte in berechneten Summen oder FlowFields erscheinen.

Der Unterschied ist wichtig:

- `Filter list by` steuert, welche Zeilen in der Liste sichtbar sind.
- `Filter totals by` steuert, welche Werte in berechneten Summen beruecksichtigt werden.

Bei der Universaarl GmbH wird dieser Unterschied spaeter an echten Kunden-, Artikel- und Sachposten gezeigt. Dafuer braucht die Company genuegend gebuchte Belege, offene Posten, geschlossene Posten, Dimensionen und mehrere Buchungsdaten.

## Filter in Reports

Viele Reports starten mit einer Request Page. Dort setzt man Optionen und Filter, bevor der Report laeuft. Ein Datumsfilter im Report kann andere Ergebnisse liefern als ein Listenfilter auf einer bereits geoeffneten Postenliste. Deshalb werden Reportfilter im Buch separat erklaert.

Ein Anfaenger soll vor dem Start eines Reports immer pruefen:

- Welcher Zeitraum wird ausgewertet?
- Welche Konten, Kunden, Lieferanten oder Artikel sind eingeschlossen?
- Gibt es Dimensionsfilter?
- Wird nur angezeigt, gedruckt, exportiert oder werden Daten veraendert?

## Arbeiten mit Posten

Posten sind die Spur der Buchung. Nach einem Verkaufsprozess entstehen zum Beispiel Debitorenposten, Sachposten und Umsatzsteuerposten. Nach einem Lagerprozess entstehen Artikelposten und Wertposten. Nach einer Zahlung entstehen Bankposten und Ausgleichseintraege.

Listenfilter helfen, diese Spur zu lesen. Man filtert nach Belegnummer, Buchungsdatum, Konto, Debitor, Kreditor, Artikel oder Dimension. Danach prueft man, ob die Zeilen zusammenpassen.

## Datenbasis fuer das endgueltige Kapitel

Das endgueltige Kapitel braucht Universaarl-Daten, die mehr zeigen als eine leere Startcompany. Fuer die Buchfassung werden mindestens diese Beispiele aufgebaut:

- mehrere Debitoren mit unterschiedlichen offenen Posten,
- mehrere Kreditoren mit Einkaufsbelegen und Zahlungen,
- Artikel mit Lagerbewegungen und Wertposten,
- Sachposten ueber mehrere Konten und Monate,
- Dimensionen fuer Produktlinie, Kanal oder Kostenstelle,
- Reports mit Datums- und Dimensionsfiltern.

Erst dann werden die Screenshot-Platzhalter durch echte Universaarl-Bilder ersetzt.

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
