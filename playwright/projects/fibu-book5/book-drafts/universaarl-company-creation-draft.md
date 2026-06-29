# Universaarl GmbH: eigene Company in Business Central anlegen

Bevor Verkaufsauftraege, Einkaufsbelege, Lagerbewegungen oder Anlagenbuchungen entstehen, braucht die Universaarl GmbH einen eigenen Arbeitsbereich in Business Central. Dieser Arbeitsbereich heisst Company oder Mandant. Eine Company enthaelt eigene Stammdaten, eigene Einstellungen, eigene Belege und eigene Buchungen.

Fuer dieses Buch verwenden wir die Company `UNIVERSAARL-DE`. Sie gehoert zur Musterfirma Universaarl GmbH. Die Company wird nicht aus einer CRONUS-Demofirma als fertige Zielwelt uebernommen. Demodaten sind zum Lernen hilfreich, enthalten aber bereits Beispielkonten, Beispielartikel, Beispielkunden, Beispielsteuerlogik und Beispielbelege. Fuer eine durchgehende Fallstudie bauen wir die fachliche Welt kontrolliert auf.

## Environment und Company

Ein Environment ist die Business-Central-Umgebung. In einem Environment koennen mehrere Companies liegen. Das Environment ist also die technische Umgebung; die Company ist der fachliche Buchungsraum.

In der Company entstehen spaeter:

- Debitoren und Kreditoren,
- Artikel, Anlagen und Lagerorte,
- Kontenplan und Buchungsgruppen,
- Umsatzsteuer- und Zahlungslogik,
- Verkaufs- und Einkaufsbelege,
- Sachposten, Nebenbuchposten und Auswertungen.

Wer in der falschen Company arbeitet, sieht andere Stammdaten und erzeugt andere Buchungen. Deshalb wird die aktive Company vor wichtigen Schritten immer kontrolliert.

## Seite Mandanten oeffnen

Die Seite `Mandanten` zeigt alle Companies, die im Environment vorhanden sind. Sie ist der Startpunkt, wenn eine neue Company angelegt oder eine vorhandene Company geprueft wird.

Auf der Seite sind vor allem drei Aktionen wichtig:

| Aktion | Bedeutung | Einordnung fuer Universaarl |
| --- | --- | --- |
| `Neu` | legt eine neue Company oder eine neue Mandantenzeile an | geeignet, wenn eine leere oder kontrollierbare Anlage entsteht |
| `Kopieren` | erstellt eine Company aus einer vorhandenen Company | nur geeignet, wenn die Quelle fachlich passt |
| `Testunternehmen` | erzeugt eine Demo- oder Testcompany | nicht geeignet als finale Universaarl-Zielwelt, wenn dadurch Demodaten entstehen |

## Vorhandene Companies pruefen

Vor der Neuanlage wird zuerst geprueft, ob `UNIVERSAARL-DE` bereits vorhanden ist. Wenn die Company noch nicht in der Liste steht, wird sie neu angelegt. Wenn sie bereits vorhanden ist, wird nicht erneut angelegt; dann wird als naechstes die Company Information geprueft.

`UNIVERSAARL-DE` steht fuer die deutsche Zielcompany der Universaarl GmbH. Der Name ist kurz, eindeutig und in allen spaeteren Schritten wiedererkennbar.

## Keine CRONUS-Kopie als Zielbasis

Eine Kopie aus CRONUS oder einer anderen Demofirma kann schnell funktionieren, sie bringt aber fremde Stammdaten mit. Dann erscheinen Kunden, Artikel, Konten, Steuerlogik und Belege, die nicht zur Universaarl GmbH gehoeren.

Fuer die Universaarl GmbH ist deshalb eine leere oder setup-nahe Anlage besser als eine Demo-Kopie. Wenn Business Central nur eine Demo- oder Kopierroute anbietet, wird die Anlage nicht unbesehen bestaetigt. Erst muss klar sein, welche Daten in die neue Company gelangen.

## Was beim Klick auf Neu passiert

Auf der Seite `Mandanten` oeffnet `Neu` eine neue, noch nicht gespeicherte Mandantenzeile. Eine leere Zeile ist noch keine fertige Company. Erst wenn ein Name eingetragen und gespeichert wurde, entsteht ein wirksamer neuer Mandant.

Vor dem Speichern muessen diese Punkte klar sein:

- Der Name lautet `UNIVERSAARL-DE`.
- Die Company gehoert zur Universaarl GmbH.
- Es wird keine Demo- oder CRONUS-Kopie bestaetigt.
- Die sichtbare Aktion speichert wirklich die neue Company und wechselt nicht ungefragt in eine andere Umgebung.
- Nach dem Speichern erscheint `UNIVERSAARL-DE` in der Mandantenliste.

In der aktuellen `playthru`-Umgebung ist die direkte Listenzeile nicht der saubere Weg fuer die Universaarl-Musterfirma. Business Central zeigt auf der Mandantenliste zwar `Neu`, `Kopieren` und `Testunternehmen`. Eine ausdrueckliche Aktion `Create New Company` ist dort aber noch nicht sichtbar. Deshalb wird an dieser Stelle nicht gespeichert und kein Assistent abgeschlossen.

Fuer die Universaarl GmbH ist das die richtige Vorsicht: Eine neue Company ist der fachliche Ausgangspunkt fuer alle spaeteren Buchungen. Wenn hier versehentlich eine Demo-, Kopier- oder Testcompany entsteht, waeren Konten, Stammdaten und spaetere Screenshots nicht mehr sauber erklaerbar. Der naechste Schritt ist deshalb, die Aktionen und Menues auf der Mandantenliste genauer zu pruefen und nur eine Route zu verwenden, die als leere oder setup-nahe Company-Anlage erkennbar ist.

## Wenn die Menues keine saubere Anlage zeigen

Auf der Seite `Mandanten` gibt es neben dem Hauptbutton `Neu` auch kleine Menuepfeile und `Weitere Optionen`. Diese Menues koennen weitere Aktionen sichtbar machen. Fuer die Universaarl GmbH werden sie vorsichtig geoeffnet, ohne einen Eintrag auszufuehren, der Daten speichert oder eine Company kopiert.

In `playthru` zeigen diese Menues weiterhin keinen eindeutigen, sicheren Pfad `Create New Company`. Sichtbar bleiben vor allem die bekannten Moeglichkeiten rund um `Neu`, `Kopieren`, `Testunternehmen` und die bestehende Demofirma. Damit ist die Entscheidung klar: Wir speichern keine direkte Listenzeile und kopieren keine Demofirma.

Der naechste sinnvolle Weg ist eine quellenbasierte alternative Route. Das kann zum Beispiel eine von Microsoft dokumentierte Einrichtungsseite oder ein klar benannter Assistent sein. Erst wenn dort sichtbar ist, ob eine leere Company, eine setup-nahe Company oder eine Demo-Company entsteht, darf der naechste Schritt vorbereitet werden.

Fuer den Anwender heisst das: Nicht jeder sichtbare Button ist automatisch der richtige Buchpfad. Bei der Company-Anlage zaehlt nicht nur, dass eine Company entsteht, sondern auch, welche Datenbasis sie bekommt.

## Nach der Anlage

Nach der erfolgreichen Anlage ist die Company noch nicht fachlich fertig. Eine neue Company ist zuerst nur der leere Buchungsraum. Danach folgen die Grundlagen:

1. Company Information pflegen.
2. Sprache, Land/Region und Grundeinstellungen pruefen.
3. Nummernserien festlegen.
4. Kontenplan und Buchungsgruppen pruefen.
5. Umsatzsteuerlogik einrichten.
6. Dimensionen anlegen.
7. Stammdaten fuer Debitoren, Kreditoren, Artikel, Anlagen und Lagerorte aufbauen.
8. Erst danach werden die ersten Belege gebucht.

## Typischer Fehler

Ein haeufiger Fehler ist, eine Test- oder Democompany zu verwenden, weil sie sofort viele Daten enthaelt. Das fuehlt sich am Anfang bequem an, macht spaeter aber jeden Screenshot und jede Buchung schwerer erklaerbar.

Der bessere Weg ist langsamer, aber sauberer: eigene Company anlegen, Pflichtdaten bewusst setzen und jeden Prozess aus der gleichen Universaarl-Welt aufbauen.
