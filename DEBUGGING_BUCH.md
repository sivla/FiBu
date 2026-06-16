# Debugging: Fehler verstehen, bevor man sie repariert

Stand: 16.06.2026

Dieses Buch ist ein praktisches Debugging-Buch. Es geht nicht darum, Fehler schnell wegzudruecken. Es geht darum, sie so zu untersuchen, dass die naechste Korrektur kleiner, sicherer und lehrreicher wird.

Die Beispiele stammen zuerst aus Business-Central- und Playwright-Arbeit, weil dort echte Fehler sichtbar wurden: falsche Klickziele, fehlende Felder, mehrdeutige Buttons, lokale Zahlenformate, Setup-Luecken, asynchrone UI-Zustaende und Screenshots, die mehr behaupteten als sie belegten. Die Regeln gelten aber breiter: fuer Web-UIs, Tests, Automatisierung, Datenmigrationen, ERP-Prozesse und technische Dokumentation.

## Inhaltsverzeichnis

1. Was Debugging eigentlich ist
2. Der Debugging-Loop
3. Symptom, Ursache, Fix und Regel
4. Reproduzierbarkeit
5. Evidence: Beweise statt Bauchgefuehl
6. UI-Debugging
7. Test-Debugging
8. Daten- und Setup-Debugging
9. Screenshot- und Dokumentations-Debugging
10. Fehlerjournal schreiben
11. Kleine Fixes, grosse Sicherheit
12. Debugging als Lernsystem

---

## 1. Was Debugging eigentlich ist

Debugging ist die Kunst, einen unerwuenschten Zustand so lange ernst zu nehmen, bis er erklaerbar wird.

Ein Fehler ist nicht nur rot im Terminal. Ein Fehler kann auch sein:

- ein Button ist sichtbar, aber der Test klickt das falsche Element
- ein Screenshot ist technisch korrekt, zeigt aber nicht den behaupteten Zielzustand
- ein Feld existiert, ist aber durch Rolle, Profil, Ansicht oder Personalisierung ausgeblendet
- ein Setup-Wert fehlt und die Anwendung meldet den Fehler erst beim Buchen
- ein Test ist gruen, aber nur weil er nicht streng genug prueft
- ein Workaround funktioniert heute, macht den naechsten Lauf aber fragiler

Gutes Debugging fragt deshalb nicht zuerst: "Wie kriege ich das gruen?" Es fragt: "Was ist hier wirklich passiert?"

## 2. Der Debugging-Loop

Der stabile Loop besteht aus sechs Schritten:

1. Beobachten: Was sehe ich wirklich?
2. Eingrenzen: Was ist Symptom, was ist Kontext?
3. Reproduzieren: Kann ich den Zustand erneut erzeugen?
4. Hypothese bilden: Welche Ursache erklaert alle sichtbaren Fakten?
5. Klein korrigieren: Was ist der kleinste reversible Fix?
6. Nachweisen: Welche Evidence zeigt, dass die Ursache weg ist?

Ein Loop ist erst fertig, wenn eine neue Regel entstanden ist. Sonst wurde nur ein Einzelfall geloest.

## 3. Symptom, Ursache, Fix und Regel

Viele Debugging-Probleme entstehen, weil diese vier Ebenen vermischt werden.

| Ebene | Frage | Beispiel |
|---|---|---|
| Symptom | Was faellt sichtbar auf? | `New` wird nicht gefunden |
| Ursache | Warum passiert es? | Der Button ist nur als Icon mit Tooltip gerendert |
| Fix | Was aendere ich jetzt? | Locator bewertet auch `title` und Seitenkontext |
| Regel | Was machen wir kuenftig anders? | Aktionen nie ohne fachlichen Containeranker klicken |

Der Fix ist fuer heute. Die Regel ist fuer alle spaeteren Laeufe.

## 4. Reproduzierbarkeit

Ein Fehler, der nur im Chat beschrieben wird, ist fluechtig. Ein reproduzierbarer Fehler hat mindestens:

- eine Umgebung
- einen Startzustand
- konkrete Schritte
- ein erwartetes Ergebnis
- ein tatsaechliches Ergebnis
- Evidence

Reproduzierbarkeit heisst nicht, dass der Fehler immer auftreten muss. Es reicht oft, den unsicheren Bereich so eng zu beschreiben, dass ein anderer Mensch oder Agent ihn wieder untersuchen kann.

## 5. Evidence: Beweise statt Bauchgefuehl

Evidence ist alles, was eine Aussage pruefbar macht:

- Screenshot
- Trace
- Logauszug
- Seitentext
- API-Antwort
- DOM-Snapshot
- Datenbankauszug
- Vorher/Nachher-Datei
- Testresultat

Wichtig ist die Grenze der Evidence. Ein Screenshot einer leeren Karte beweist, dass die Karte geoeffnet wurde. Er beweist nicht, dass ein Zielcode angelegt wurde. Ein gruenes Testergebnis beweist, dass die Assertions bestanden haben. Es beweist nicht automatisch, dass die fachliche Absicht erfuellt ist.

## 6. UI-Debugging

UIs sind selten so eindeutig, wie sie aussehen. Eine Business-Anwendung kann mehrere Schichten gleichzeitig zeigen: Shell, Rolle, Liste, Karte, Dialog, FactBox, Teaching Tip, Menue, eingebetteter Frame.

Praktische Regeln:

- Sichtbarer Text allein ist kein sicheres Klickziel.
- `New`, `OK`, `Post` und aehnliche Aktionen brauchen einen Seiten- oder Dialoganker.
- Fehlende Felder zuerst auf Sichtbarkeit, Rolle, Ansicht und Personalisierung pruefen.
- Bei unklarem Page-/Tabellenkontext technische Inspektion nutzen.
- Nach jedem Klick den Zielkontext pruefen, nicht dem Klick vertrauen.

## 7. Test-Debugging

Ein Test ist ein Messinstrument. Wenn das Messinstrument unscharf ist, erzeugt es falsche Sicherheit.

Typische Testfehler:

- zu breite Regex erkennt Seitentitel statt Zielwert
- erster Treffer wird geklickt, obwohl mehrere Treffer sichtbar sind
- Grid-Felder werden per Index gefuellt und landen in der falschen Spalte
- asynchrone UI-Zustaende werden zu frueh gelesen
- Cleanup laeuft ueber globale Tastaturbefehle und verlaesst den Kontext

Ein guter Test prueft Zielwert, Kontext und Grenze. Er sagt nicht nur "gefunden", sondern "genau dieser Wert ist an genau dieser Stelle sichtbar oder persistiert".

## 8. Daten- und Setup-Debugging

Viele scheinbare Bedienfehler sind Setup-Fehler.

Beispiel: Eine Buchungsvorschau stoppt mit fehlendem Bestandskonto. Dann ist nicht der Verkaufsauftrag kaputt. Die Anwendung sagt: Fuer diese Kombination aus Lagerort und Lagerbuchungsgruppe fehlt die Kontenfindung.

Regel:

- Erst den fachlichen Zusammenhang verstehen.
- Kein Feld setzen, nur damit die Fehlermeldung verschwindet.
- Setup-Fixes als Labor- oder Ziel-Setup kennzeichnen.
- Nach dem Fix beweisen, dass der alte Fehler weg ist und kein neuer verdeckt wurde.

## 9. Screenshot- und Dokumentations-Debugging

Dokumentation kann ebenfalls Bugs enthalten.

Ein Screenshot darf nur behaupten, was er sichtbar zeigt. Wenn der Text sagt "Der Code `MACHINES` ist angelegt", muss der Code sichtbar sein oder durch eine andere Evidence belegt werden. Wenn nur die leere Anlagekarte sichtbar ist, ist das ein Formular-Preflight, kein Zielzustand.

Gute Bildunterschriften beantworten:

- Was sieht man?
- Was ist damit bewiesen?
- Was ist nicht bewiesen?
- Welche naechste Pruefung fehlt?

## 10. Fehlerjournal schreiben

Jeder relevante Fehler bekommt denselben Aufbau:

| Feld | Bedeutung |
|---|---|
| Problem | Was ist passiert? |
| Symptom | Woran wurde es sichtbar? |
| Beleg | Welche Evidence gibt es? |
| Ursache | Warum ist es passiert? |
| Fix | Was wurde geaendert? |
| Nachweis | Woran erkennt man, dass der Fix wirkt? |
| Regel | Was machen wir kuenftig anders? |

Das Journal ist kein Schandregister. Es ist die Wissensbasis des Projekts.

## 11. Kleine Fixes, grosse Sicherheit

Der beste Fix ist oft klein:

- einen Locator scopen
- eine Assertion verschaerfen
- eine Wartebedingung an den richtigen Zustand binden
- einen Screenshot als Laborbild statt Buchbild kennzeichnen
- einen Setup-Schritt vor die Buchung ziehen
- einen unsicheren Lauf abbrechen und als Befund dokumentieren

Klein heisst nicht oberflaechlich. Klein heisst: Die Aenderung passt zur belegten Ursache.

## 12. Debugging als Lernsystem

Ein Team wird besser, wenn Fehler nicht verschwinden, sondern verdichtet werden.

Aus einem Fehler entsteht:

- ein besserer Test
- ein genauerer Begriff
- eine robustere Checkliste
- eine bessere Dokumentation
- ein sichererer naechster Lauf

Das ist der eigentliche Gewinn. Debugging repariert nicht nur Software. Es repariert das Verstaendnis.
