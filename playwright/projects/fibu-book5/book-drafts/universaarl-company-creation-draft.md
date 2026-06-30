# Universaarl GmbH: eigene Company in Business Central anlegen

Bevor Verkaufsaufträge, Einkaufsbelege, Lagerbewegungen oder Anlagenbuchungen entstehen, braucht die Universaarl GmbH einen eigenen Arbeitsbereich in Business Central. Dieser Arbeitsbereich heißt Company oder Mandant. Eine Company enthält eigene Stammdaten, eigene Einstellungen, eigene Belege und eigene Buchungen.

Für dieses Buch verwenden wir die Company `UNIVERSAARL-DE`. Sie gehört zur Musterfirma Universaarl GmbH. Die Company wird nicht aus einer CRONUS-Demofirma als fertige Zielwelt übernommen. Demodaten sind zum Lernen hilfreich, enthalten aber bereits Beispielkonten, Beispielartikel, Beispielkunden, Beispielsteuerlogik und Beispielbelege. Für eine durchgehende Fallstudie bauen wir die fachliche Welt kontrolliert auf.

## Richtiger Einstieg auf der Seite Mandanten

Die Anlage erfolgt über die Seite `Mandanten`. Dort ist der kleine Pfeil neben `Neu` entscheidend. Er öffnet das Dropdown, in dem `Neues Unternehmen erstellen` sichtbar ist. Dieser Menüeintrag ist der bevorzugte Buchpfad für `UNIVERSAARL-DE`.

Der Hauptbutton `Neu` ist ein anderes Bedienelement. Er kann eine leere Mandantenzeile öffnen. Eine leere Zeile ist noch kein geführter Anlageweg und keine fertige Company. Wenn nur diese Zeile sichtbar ist, wird zuerst geklärt, ob wirklich der gewünschte Pfad getroffen wurde.

## Environment und Company

Ein Environment ist die Business-Central-Umgebung. In einem Environment können mehrere Companies liegen. Das Environment ist also die technische Umgebung; die Company ist der fachliche Buchungsraum.

In der Company entstehen später:

- Debitoren und Kreditoren,
- Artikel, Anlagen und Lagerorte,
- Kontenplan und Buchungsgruppen,
- Umsatzsteuer- und Zahlungslogik,
- Verkaufs- und Einkaufsbelege,
- Sachposten, Nebenbuchposten und Auswertungen.

Wer in der falschen Company arbeitet, sieht andere Stammdaten und erzeugt andere Buchungen. Deshalb wird die aktive Company vor wichtigen Schritten immer kontrolliert.

## Seite Mandanten öffnen

Die Seite `Mandanten` zeigt alle Companies, die im Environment vorhanden sind. Sie ist der Startpunkt, wenn eine neue Company angelegt oder eine vorhandene Company geprüft wird.

Auf der Seite sind vor allem diese Aktionen wichtig:

| Aktion | Bedeutung | Einordnung für Universaarl |
| --- | --- | --- |
| `Neu` | kann eine neue Company-Zeile in der Mandantenliste öffnen | nur als Listenzeilenpfad geeignet, wenn Fokus, Datenbasis und Speichern eindeutig kontrolliert sind |
| `Neues Unternehmen erstellen` | startet eine geführte Anlage für eine neue Company | fachlich interessant, aber erst nach eigenem Sicherheitscheck ausführen |
| `Kopieren` | erstellt eine Company aus einer vorhandenen Company | nur geeignet, wenn die Quelle fachlich passt |
| `Testunternehmen` | erzeugt eine Demo- oder Testcompany | nicht geeignet als finale Universaarl-Zielwelt, wenn dadurch Demodaten entstehen |

Die erste Kontrolle ist immer die Liste selbst. In ihr muss sichtbar sein, welche Companies bereits vorhanden sind. Wenn `UNIVERSAARL-DE` fehlt, ist die Anlage noch nicht abgeschlossen. Wenn `UNIVERSAARL-DE` sichtbar ist, wird nicht erneut angelegt, sondern die neue Company wird als nächster Schritt geöffnet und über die Unternehmensinformationen geprüft.

## Vorhandene Companies prüfen

Vor der Neuanlage wird zuerst geprüft, ob `UNIVERSAARL-DE` bereits vorhanden ist. Wenn die Company noch nicht in der Liste steht, wird sie neu angelegt. Wenn sie bereits vorhanden ist, wird nicht erneut angelegt; dann wird als nächstes die Company Information geprüft.

`UNIVERSAARL-DE` steht für die deutsche Zielcompany der Universaarl GmbH. Der Name ist kurz, eindeutig und in allen späteren Schritten wiedererkennbar.

## Keine CRONUS-Kopie als Zielbasis

Eine Kopie aus CRONUS oder einer anderen Demofirma kann schnell funktionieren, sie bringt aber fremde Stammdaten mit. Dann erscheinen Kunden, Artikel, Konten, Steuerlogik und Belege, die nicht zur Universaarl GmbH gehören.

Für die Universaarl GmbH ist deshalb eine leere oder setup-nahe Anlage besser als eine Demo-Kopie. Wenn Business Central nur eine Demo- oder Kopierroute anbietet, wird die Anlage nicht unbesehen bestätigt. Erst muss klar sein, welche Daten in die neue Company gelangen.

## Was beim Klick auf den Hauptbutton Neu passiert

Auf der Seite `Mandanten` ist der Hauptbutton `Neu` nicht dasselbe wie der Menüeintrag `Neues Unternehmen erstellen`. Der Hauptteil des Buttons kann eine neue, noch nicht gespeicherte Mandantenzeile in der Liste öffnen. Eine leere Zeile ist aber noch keine fertige Company und auch kein Nachweis für den geführten Anlageweg.

Vor dem Speichern müssen diese Punkte klar sein:

- Der Name lautet `UNIVERSAARL-DE`.
- Die Company gehört zur Universaarl GmbH.
- Es wird keine Demo- oder CRONUS-Kopie bestätigt.
- Die sichtbare Aktion speichert wirklich die neue Company und wechselt nicht ungefragt in eine andere Umgebung.
- Nach dem Speichern erscheint `UNIVERSAARL-DE` in der Mandantenliste.

Für die Universaarl GmbH ist dieser Zustand nur ein Erklär- und Prüfpunkt. Wenn nach einem Klick auf den Hauptbutton nur eine leere Zeile sichtbar wird, wird nicht weiter geraten. Dann wird zuerst geklärt, ob wirklich der gewünschte Anlageweg getroffen wurde. Für den nächsten Rechte-Lauf ist der Zielpfad der kleine Pfeil neben `Neu` und danach der Menüeintrag `Neues Unternehmen erstellen`.

Beim Ausfüllen ist der Fokus wichtig. Business Central arbeitet in Listen oft mit einer aktiven Zelle. Es reicht nicht, dass irgendwo eine leere Zeile sichtbar ist. Der Cursor muss in der Namenszelle der neuen Zeile stehen. Erst dann wird `UNIVERSAARL-DE` wirklich in die neue Company-Zeile geschrieben.

Nach der Eingabe wird nicht geraten, ob gespeichert wurde. Die Mandantenliste wird erneut gelesen. Der erfolgreiche Zustand ist einfach: `UNIVERSAARL-DE` steht als eigene Zeile in der Liste.

## Der Pfeil neben Neu

Neben dem Hauptbutton `Neu` gibt es einen kleinen Pfeil. Dieser Pfeil ist wichtig, weil er nicht dasselbe tut wie der Hauptbutton. Der Hauptbutton startet die neue Zeile. Der Pfeil öffnet ein Dropdown mit weiteren Aktionen.

Im geöffneten Dropdown sind `Neu` und `Neues Unternehmen erstellen` sichtbar. `Neu` gehört zum Listenzeilenpfad. `Neues Unternehmen erstellen` klingt nach einem geführten Anlageweg und ist deshalb fachlich interessant. Weil diese Aktion eine wirksame Anlage starten kann, wird sie nicht nebenbei angeklickt, sondern nur in einem eigenen Schritt mit klarer Entscheidung.

`Kopieren` steht in der Aktionsleiste der Mandantenliste. Es verwendet eine vorhandene Company als Vorlage. Das kann in Projekten sinnvoll sein, wenn die Quelle fachlich passt. Für die Universaarl GmbH ist es aber riskant, weil eine Kopie auch fremde Stammdaten, Einstellungen oder Demodaten übernehmen kann.

`Testunternehmen` erstellt eine Demo- oder Testcompany. Das ist zum Ausprobieren nützlich, aber nicht die saubere Grundlage für eine durchgehende Musterfirma, wenn die Buchungen später aus der Universaarl-Welt erklärt werden sollen.

Für die Anlage von `UNIVERSAARL-DE` ist damit nur ein Zielpfad aktiv: der Dropdown-Eintrag `Neues Unternehmen erstellen`. Der Hauptbutton `Neu` bleibt im Buch wichtig, weil er den Unterschied zwischen Listenanlage und geführtem Anlageweg erklärt. Er ist aber nicht der Klick, mit dem `UNIVERSAARL-DE` angelegt wird.

Wenn man mit der Maus über `Neu` oder den Pfeil neben `Neu` fährt, zeigt Business Central einen Tooltip. Solche Tooltips sind nützlich, weil sie den Zweck einer Aktion direkt in der Oberfläche bestätigen. Für eine Klickanleitung ist der Tooltip ein guter Kontrollpunkt: Er hilft zu unterscheiden, ob der Hauptbutton, der kleine Dropdown-Pfeil oder ein Eintrag im geöffneten Menü gemeint ist.

## Der Anlageassistent

Nach dem Klick auf `Neues Unternehmen erstellen` öffnet Business Central einen Assistenten. Der Assistent führt durch die Anlage der neuen Company. Wenn der Assistent rechts als schmale Karte erscheint, kann er über das Symbol mit den Pfeilen vergrößert werden. Das ist für Anfänger hilfreich, weil die Auswahlfelder und Hinweise besser lesbar sind.

Der erste Schritt ist eine Willkommensseite. Danach führt `Weiter` zur eigentlichen Auswahl für die neue Company. Dort ist der Name `UNIVERSAARL-DE` wichtig. Business Central verwendet diesen Namen später in der Mandantenliste und im Company-Kontext.

Für die Universaarl GmbH wird die Datenbasis `Neu erstellen - Keine Daten` verwendet. Diese Auswahl ist der saubere Startpunkt für dieses Buch:

- keine Beispieldaten,
- keine Einrichtungsdaten,
- keine CRONUS-Kopie,
- keine Testcompany,
- keine fremden Kunden, Artikel, Konten oder Belege.

Damit beginnt die Universaarl GmbH wirklich leer. Das ist langsamer als eine Demofirma, aber fachlich sauberer: Jeder Debitor, jeder Kreditor, jeder Artikel, jede Buchungsgruppe und jede Buchung entsteht später bewusst im Buch.

Nach der Eingabe von `UNIVERSAARL-DE` führt der Assistent über weitere `Weiter`-Schritte bis zu `Fertig stellen`. Erst nach `Fertig stellen` wird die Mandantenliste erneut geprüft. Der erfolgreiche Zustand ist sichtbar: In der Liste steht `UNIVERSAARL-DE`, und der Einrichtungsstatus ist `Completed`.

`Completed` bedeutet an dieser Stelle nur, dass die technische Company-Anlage abgeschlossen ist. Es bedeutet noch nicht, dass Finanzbuchhaltung, Umsatzsteuer, Nummernserien, Buchungsgruppen oder Stammdaten eingerichtet sind. Diese Arbeit beginnt erst im nächsten Schritt.

## Warum die Alternativen trotzdem wichtig sind

Ein Anfänger sieht auf der Seite `Mandanten` mehrere Möglichkeiten und kann leicht den falschen Weg nehmen. Deshalb lohnt es sich, das Dropdown neben `Neu` einmal bewusst anzusehen.

Die Regel ist einfach:

- `Neu` kann eine neue Zeile in der Mandantenliste öffnen.
- `Neues Unternehmen erstellen` ist der Zielpfad für den geführten Anlageweg.
- `Kopieren` übernimmt eine bestehende Company als Vorlage.
- `Testunternehmen` kennzeichnet Demo- oder Testbasis.

Für dieses Buch soll die Universaarl GmbH eine eigene, nachvollziehbare Company bekommen. Deshalb wird `Neues Unternehmen erstellen` als Zielpfad vorbereitet. `Neu`, `Kopieren` und `Testunternehmen` werden erklärt, aber nicht als unbemerkter Ersatz für den Zielpfad verwendet.

## Nach der Anlage

Nach der erfolgreichen Anlage ist die Company noch nicht fachlich fertig. Eine neue Company ist zuerst nur der leere Buchungsraum. Danach folgen die Grundlagen:

1. Company Information pflegen.
2. Sprache, Land/Region und Grundeinstellungen prüfen.
3. Nummernserien festlegen.
4. Kontenplan und Buchungsgruppen prüfen.
5. Umsatzsteuerlogik einrichten.
6. Dimensionen anlegen.
7. Stammdaten für Debitoren, Kreditoren, Artikel, Anlagen und Lagerorte aufbauen.
8. Erst danach werden die ersten Belege gebucht.

## Typischer Fehler

Ein häufiger Fehler ist, eine Test- oder Democompany zu verwenden, weil sie sofort viele Daten enthält. Das fühlt sich am Anfang bequem an, macht später aber jeden Screenshot und jede Buchung schwerer erklärbar.

Der bessere Weg ist langsamer, aber sauberer: eigene Company anlegen, Pflichtdaten bewusst setzen und jeden Prozess aus der gleichen Universaarl-Welt aufbauen.

## Wenn die neue Company nicht gespeichert wird

Nicht jeder Benutzer darf in Business Central neue Companies anlegen. Wenn nach `Neu` oder `Neues Unternehmen erstellen` keine neue Company in der Mandantenliste erscheint, ist das kein Grund für einen blinden zweiten Versuch.

Zuerst wird geprüft:

- Ist der Benutzer für die Anlage von Companies berechtigt?
- Steht `UNIVERSAARL-DE` nach dem Speichern wirklich in der Mandantenliste?
- Zeigt Business Central eine Meldung wie `Nicht gespeichert`, eine rote Fehlermeldung oder einen Hinweis auf fehlende Berechtigung?
- Wurde versehentlich nur eine leere Zeile geöffnet, aber kein Feld in dieser Zeile beschrieben?

Erst wenn die Berechtigung vorhanden ist und `UNIVERSAARL-DE` sichtbar in der Mandantenliste steht, geht es weiter mit dem Wechsel in die neue Company und der Seite `Unternehmensinformationen`.

## Berechtigungen gehören zum Prozess

Eine neue Company ist kein normaler Stammdatensatz. Sie ist ein neuer Buchungsraum mit eigenen Einstellungen und eigenen Daten. Deshalb kann Business Central die Anlage verhindern, wenn dem Benutzer die passenden Rechte fehlen.

In diesem Fall wird nicht auf `Kopieren`, `Testunternehmen` oder eine technische Abkürzung ausgewichen. Der richtige Ablauf ist:

1. Rechte klären.
2. Mandantenliste erneut öffnen.
3. Prüfen, dass `UNIVERSAARL-DE` noch fehlt.
4. Den Pfeil neben `Neu` öffnen und `Neues Unternehmen erstellen` bewusst verwenden.
5. `UNIVERSAARL-DE` eintragen.
6. Speichern oder die genaue Fehlermeldung lesen.
7. Erst nach sichtbarem Erfolg in die neue Company wechseln.

So bleibt die Fallstudie sauber. Das Buch erklärt nicht nur, wo man klickt, sondern auch, warum eine administrative Aktion erst nach Berechtigung und sichtbarer Kontrolle abgeschlossen ist.
