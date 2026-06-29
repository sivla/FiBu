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

Auf der Seite sind vor allem diese Aktionen wichtig:

| Aktion | Bedeutung | Einordnung fuer Universaarl |
| --- | --- | --- |
| `Neu` | legt eine neue Company oder eine neue Mandantenzeile an | geeignet, wenn eine leere oder kontrollierbare Anlage entsteht |
| `Neues Unternehmen erstellen` | startet eine gefuehrte Anlage fuer eine neue Company | fachlich interessant, aber erst nach eigenem Sicherheitscheck ausfuehren |
| `Kopieren` | erstellt eine Company aus einer vorhandenen Company | nur geeignet, wenn die Quelle fachlich passt |
| `Testunternehmen` | erzeugt eine Demo- oder Testcompany | nicht geeignet als finale Universaarl-Zielwelt, wenn dadurch Demodaten entstehen |

## Vorhandene Companies pruefen

Vor der Neuanlage wird zuerst geprueft, ob `UNIVERSAARL-DE` bereits vorhanden ist. Wenn die Company noch nicht in der Liste steht, wird sie neu angelegt. Wenn sie bereits vorhanden ist, wird nicht erneut angelegt; dann wird als naechstes die Company Information geprueft.

`UNIVERSAARL-DE` steht fuer die deutsche Zielcompany der Universaarl GmbH. Der Name ist kurz, eindeutig und in allen spaeteren Schritten wiedererkennbar.

## Keine CRONUS-Kopie als Zielbasis

Eine Kopie aus CRONUS oder einer anderen Demofirma kann schnell funktionieren, sie bringt aber fremde Stammdaten mit. Dann erscheinen Kunden, Artikel, Konten, Steuerlogik und Belege, die nicht zur Universaarl GmbH gehoeren.

Fuer die Universaarl GmbH ist deshalb eine leere oder setup-nahe Anlage besser als eine Demo-Kopie. Wenn Business Central nur eine Demo- oder Kopierroute anbietet, wird die Anlage nicht unbesehen bestaetigt. Erst muss klar sein, welche Daten in die neue Company gelangen.

## Was beim Klick auf Neu passiert

Auf der Seite `Mandanten` ist `Neu` der direkte Einstieg fuer eine neue Company. Der Hauptteil des Buttons beginnt die Neuanlage. Business Central zeigt dann eine neue, noch nicht gespeicherte Mandantenzeile. Eine leere Zeile ist noch keine fertige Company. Erst wenn ein Name eingetragen und gespeichert wurde, entsteht ein wirksamer neuer Mandant.

Vor dem Speichern muessen diese Punkte klar sein:

- Der Name lautet `UNIVERSAARL-DE`.
- Die Company gehoert zur Universaarl GmbH.
- Es wird keine Demo- oder CRONUS-Kopie bestaetigt.
- Die sichtbare Aktion speichert wirklich die neue Company und wechselt nicht ungefragt in eine andere Umgebung.
- Nach dem Speichern erscheint `UNIVERSAARL-DE` in der Mandantenliste.

Fuer die Universaarl GmbH ist der Hauptbutton `Neu` deshalb der naheliegende Weg. Er beginnt mit einer eigenen Zeile und nicht mit einer Kopie aus einer bestehenden Demofirma.

## Der Pfeil neben Neu

Neben dem Hauptbutton `Neu` gibt es einen kleinen Pfeil. Dieser Pfeil ist wichtig, weil er nicht dasselbe tut wie der Hauptbutton. Der Hauptbutton startet die neue Zeile. Der Pfeil oeffnet ein Dropdown mit weiteren Aktionen.

Im geoeffneten Dropdown sind `Neu` und `Neues Unternehmen erstellen` sichtbar. `Neu` bleibt der direkte Einstieg in die Listenanlage. `Neues Unternehmen erstellen` klingt nach einem gefuehrten Anlageweg und ist deshalb fachlich interessant. Weil diese Aktion eine wirksame Anlage starten kann, wird sie nicht nebenbei angeklickt, sondern nur in einem eigenen Schritt mit klarer Entscheidung.

`Kopieren` steht in der Aktionsleiste der Mandantenliste. Es verwendet eine vorhandene Company als Vorlage. Das kann in Projekten sinnvoll sein, wenn die Quelle fachlich passt. Fuer die Universaarl GmbH ist es aber riskant, weil eine Kopie auch fremde Stammdaten, Einstellungen oder Demodaten uebernehmen kann.

`Testunternehmen` erstellt eine Demo- oder Testcompany. Das ist zum Ausprobieren nuetzlich, aber nicht die saubere Grundlage fuer eine durchgehende Musterfirma, wenn die Buchungen spaeter aus der Universaarl-Welt erklaert werden sollen.

Fuer die Anlage von `UNIVERSAARL-DE` kommen damit zwei saubere Kandidaten in Frage: der Hauptbutton `Neu` und der sichtbare Dropdown-Eintrag `Neues Unternehmen erstellen`. Beide duerfen erst dann ausgefuehrt werden, wenn klar ist, welche Datenbasis entsteht und wie Business Central speichert.

## Warum die Alternativen trotzdem wichtig sind

Ein Anfaenger sieht auf der Seite `Mandanten` mehrere Moeglichkeiten und kann leicht den falschen Weg nehmen. Deshalb lohnt es sich, das Dropdown neben `Neu` einmal bewusst anzusehen.

Die Regel ist einfach:

- `Neu` beginnt die neue Company direkt in der Mandantenliste.
- `Neues Unternehmen erstellen` startet wahrscheinlich einen gefuehrten Anlageweg.
- `Kopieren` uebernimmt eine bestehende Company als Vorlage.
- `Testunternehmen` kennzeichnet Demo- oder Testbasis.

Fuer dieses Buch soll die Universaarl GmbH eine eigene, nachvollziehbare Company bekommen. Deshalb werden `Neu` und `Neues Unternehmen erstellen` kontrolliert geprueft; Kopier- und Demooptionen werden nur erklaert.

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

## Wenn die neue Company nicht gespeichert wird

Nicht jeder Benutzer darf in Business Central neue Companies anlegen. Wenn nach `Neu` oder `Neues Unternehmen erstellen` keine neue Company in der Mandantenliste erscheint, ist das kein Grund fuer einen blinden zweiten Versuch.

Zuerst wird geprueft:

- Ist der Benutzer fuer die Anlage von Companies berechtigt?
- Steht `UNIVERSAARL-DE` nach dem Speichern wirklich in der Mandantenliste?
- Zeigt Business Central eine Meldung wie `Nicht gespeichert`, eine rote Fehlermeldung oder einen Hinweis auf fehlende Berechtigung?
- Wurde versehentlich nur eine leere Zeile geoeffnet, aber kein Feld in dieser Zeile beschrieben?

Erst wenn die Berechtigung vorhanden ist und `UNIVERSAARL-DE` sichtbar in der Mandantenliste steht, geht es weiter mit dem Wechsel in die neue Company und der Seite `Unternehmensinformationen`.
