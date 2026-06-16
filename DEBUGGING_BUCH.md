# Business Central Debugging: Fehler systematisch verstehen, nachstellen und loesen

Stand: 16.06.2026

Dieses Buch ist ein praktisches Debugging-Buch fuer Microsoft Dynamics 365 Business Central. Es geht nicht darum, Fehler schnell wegzudruecken. Es geht darum, sie so zu untersuchen, dass die naechste Korrektur kleiner, sicherer und lehrreicher wird.

Die Beispiele stammen aus Business-Central- und Playwright-Arbeit, weil dort echte Fehler sichtbar wurden: falsche Klickziele, fehlende Felder, mehrdeutige Buttons, lokale Zahlenformate, Setup-Luecken, asynchrone UI-Zustaende und Screenshots, die mehr behaupteten als sie belegten.

Das zentrale Denkmodell lautet:

```text
Fehlermeldung -> Page -> Table -> Field -> Setup -> Posting Result -> Evidence -> Regressionstest -> Buchregel
```

## Inhaltsverzeichnis

1. Was BC-Debugging bedeutet
2. Wie Business Central denkt: Page, Table, Field, Entry
3. Oberflaeche debuggen: Suche, Filter, Personalisierung, Profile
4. Page Inspection: der Blick hinter die Maske
5. Kopf, Zeilen, Posten und gebuchte Belege
6. Feldherkunft: Stammdaten, Setup, FlowFields, Extensions
7. Berechtigungen debuggen
8. Posting Groups debuggen
9. Dimensionen debuggen
10. Nummernserien, Perioden und Statuslogik
11. Sales Debugging
12. Purchase Debugging
13. Inventory und Warehouse Debugging
14. Manufacturing Debugging
15. Service Debugging
16. Projects Debugging
17. Finance, Bank und Abschluss Debugging
18. USt, E-Rechnung und deutsche Nachweissicht
19. Reports, Layouts und Belegversand
20. Job Queue und Hintergrundprozesse
21. APIs, OData, Integrationen und MCP
22. Telemetry und Performance
23. Extensions und AppSource/PTE-Probleme
24. Sandbox, Repro und Regressionstests
25. Playwright fuer BC-Debugging
26. Kundentickets analysieren
27. Evidence Packs schreiben
28. Supporttickets fuer Entwickler vorbereiten
29. UAT- und Regressionstestbibliothek
30. Debugging-Checklisten und Entscheidungsbaeume

---

## Kapitelstruktur

Jedes Kapitel folgt dieser Struktur:

```md
# Kapitelname

## Ziel des Kapitels

## Typisches Kundenticket

## Was der User sieht

## Was BC wahrscheinlich im Hintergrund tut

## Betroffene Pages

## Betroffene Tabellen

## Relevante Felder

## Haeufige Ursachen

## Diagnosepfad

## Repro in Sandbox

## Evidence Pack

## Fix / Workaround

## Regressionstest

## Was man nicht tun darf

## Merksatz

## Mini-Uebung
```

---

## 1. Was BC-Debugging bedeutet

Debugging ist die Kunst, einen unerwuenschten Zustand so lange ernst zu nehmen, bis er erklaerbar wird. In Business Central bedeutet das: nicht nur die Maske anschauen, sondern die Verbindung zwischen Page, Table, Field, Setup, Status, Berechtigung und Postenlogik verstehen.

Ein Fehler ist nicht nur rot im Terminal. Ein Fehler kann auch sein:

- ein Button ist sichtbar, aber der Test klickt das falsche Element
- ein Screenshot ist technisch korrekt, zeigt aber nicht den behaupteten Zielzustand
- ein Feld existiert, ist aber durch Rolle, Profil, Ansicht oder Personalisierung ausgeblendet
- ein Setup-Wert fehlt und die Anwendung meldet den Fehler erst beim Buchen
- ein Test ist gruen, aber nur weil er nicht streng genug prueft
- ein Workaround funktioniert heute, macht den naechsten Lauf aber fragiler

Gutes Debugging fragt deshalb nicht zuerst: "Wie kriege ich das weg?" Es fragt: "Was ist hier wirklich passiert?"

## 2. Wie Business Central denkt: Page, Table, Field, Entry

Business Central zeigt fachliche Arbeit in Pages, speichert Daten in Tabellen, berechnet Werte ueber Felder, FlowFields und Logik, und schreibt beim Buchen Entries. Viele Fehler entstehen, weil diese Ebenen vermischt werden.

| Ebene | Leitfrage |
|---|---|
| Oberflaeche | Ist die richtige Page sichtbar? Sind Filter, Profil oder Personalisierung aktiv? |
| Rolle/Berechtigung | Darf der User die Page, Tabelle oder Aktion nutzen? |
| Prozessstatus | Ist der Beleg offen, freigegeben, gebucht, storniert, archiviert oder blockiert? |
| Stammdaten | Sind Kunde, Lieferant, Artikel, Sachkonto, Ressource oder Anlage korrekt gepflegt? |
| Setup | Stimmen Posting Groups, Nummernserien, USt, Dimensionen, Lagerort, Bank oder Workflow? |
| Datenlogik | Kommt der Wert aus Stammdaten, Beleg, Zeile, Setup, Dimension, FlowField oder Extension? |
| Buchungslogik | Welche Entries sollten entstehen? Welche fehlen? |
| Extension | Ist Standard-BC betroffen oder eine App/PTE/Customization? |
| Integration | Kommt das Problem aus API, OData, EDI, Power Automate, Job Queue oder Bankimport? |
| Telemetry | Gibt es Fehler, Timeouts, AL Exceptions oder API-Fehler? |

## 3. Der Debugging-Loop

Der stabile Loop besteht aus sechs Schritten:

1. Beobachten: Was sehe ich wirklich?
2. Eingrenzen: Was ist Symptom, was ist Kontext?
3. Reproduzieren: Kann ich den Zustand erneut erzeugen?
4. Hypothese bilden: Welche Ursache erklaert alle sichtbaren Fakten?
5. Klein korrigieren: Was ist der kleinste reversible Fix?
6. Nachweisen: Welche Evidence zeigt, dass die Ursache weg ist?

Ein Loop ist erst fertig, wenn eine neue Regel, Checkliste oder Regressionstest-Idee entstanden ist. Sonst wurde nur ein Einzelfall geloest.

## 4. Symptom, Ursache, Fix und Regel

Viele Debugging-Probleme entstehen, weil diese vier Ebenen vermischt werden.

| Ebene | Frage | Beispiel |
|---|---|---|
| Symptom | Was faellt sichtbar auf? | `New` wird nicht gefunden |
| Ursache | Warum passiert es? | Der Button ist nur als Icon mit Tooltip gerendert |
| Fix | Was aendere ich jetzt? | Locator bewertet auch `title` und Seitenkontext |
| Regel | Was machen wir kuenftig anders? | Aktionen nie ohne fachlichen Containeranker klicken |

Der Fix ist fuer heute. Die Regel ist fuer alle spaeteren Laeufe.

## 5. Reproduzierbarkeit

Ein Fehler, der nur im Chat beschrieben wird, ist fluechtig. Ein reproduzierbarer Fehler hat mindestens:

- eine Umgebung
- einen Startzustand
- konkrete Schritte
- ein erwartetes Ergebnis
- ein tatsaechliches Ergebnis
- Evidence

Reproduzierbarkeit heisst nicht, dass der Fehler immer auftreten muss. Es reicht oft, den unsicheren Bereich so eng zu beschreiben, dass ein anderer Mensch oder Agent ihn wieder untersuchen kann.

## 6. Evidence: Beweise statt Bauchgefuehl

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

## 7. UI-Debugging

UIs sind selten so eindeutig, wie sie aussehen. Eine Business-Anwendung kann mehrere Schichten gleichzeitig zeigen: Shell, Rolle, Liste, Karte, Dialog, FactBox, Teaching Tip, Menue, eingebetteter Frame.

Praktische Regeln:

- Sichtbarer Text allein ist kein sicheres Klickziel.
- `New`, `OK`, `Post` und aehnliche Aktionen brauchen einen Seiten- oder Dialoganker.
- Fehlende Felder zuerst auf Sichtbarkeit, Rolle, Ansicht und Personalisierung pruefen.
- Bei unklarem Page-/Tabellenkontext technische Inspektion nutzen.
- Nach jedem Klick den Zielkontext pruefen, nicht dem Klick vertrauen.

## 8. Test-Debugging

Ein Test ist ein Messinstrument. Wenn das Messinstrument unscharf ist, erzeugt es falsche Sicherheit.

Typische Testfehler:

- zu breite Regex erkennt Seitentitel statt Zielwert
- erster Treffer wird geklickt, obwohl mehrere Treffer sichtbar sind
- Grid-Felder werden per Index gefuellt und landen in der falschen Spalte
- asynchrone UI-Zustaende werden zu frueh gelesen
- Cleanup laeuft ueber globale Tastaturbefehle und verlaesst den Kontext

Ein guter Test prueft Zielwert, Kontext und Grenze. Er sagt nicht nur "gefunden", sondern "genau dieser Wert ist an genau dieser Stelle sichtbar oder persistiert".

## 9. Daten- und Setup-Debugging

Viele scheinbare Bedienfehler sind Setup-Fehler.

Beispiel: Eine Buchungsvorschau stoppt mit fehlendem Bestandskonto. Dann ist nicht der Verkaufsauftrag kaputt. Die Anwendung sagt: Fuer diese Kombination aus Lagerort und Lagerbuchungsgruppe fehlt die Kontenfindung.

Regel:

- Erst den fachlichen Zusammenhang verstehen.
- Kein Feld setzen, nur damit die Fehlermeldung verschwindet.
- Setup-Fixes als Labor- oder Ziel-Setup kennzeichnen.
- Nach dem Fix beweisen, dass der alte Fehler weg ist und kein neuer verdeckt wurde.

## 10. Screenshot- und Dokumentations-Debugging

Dokumentation kann ebenfalls Bugs enthalten.

Ein Screenshot darf nur behaupten, was er sichtbar zeigt. Wenn der Text sagt "Der Code `MACHINES` ist angelegt", muss der Code sichtbar sein oder durch eine andere Evidence belegt werden. Wenn nur die leere Anlagekarte sichtbar ist, ist das ein Formular-Preflight, kein Zielzustand.

Gute Bildunterschriften beantworten:

- Was sieht man?
- Was ist damit bewiesen?
- Was ist nicht bewiesen?
- Welche naechste Pruefung fehlt?

## 11. Fehlerjournal schreiben

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

## 12. Kleine Fixes, grosse Sicherheit

Der beste Fix ist oft klein:

- einen Locator scopen
- eine Assertion verschaerfen
- eine Wartebedingung an den richtigen Zustand binden
- einen Screenshot als Laborbild statt Buchbild kennzeichnen
- einen Setup-Schritt vor die Buchung ziehen
- einen unsicheren Lauf abbrechen und als Befund dokumentieren

Klein heisst nicht oberflaechlich. Klein heisst: Die Aenderung passt zur belegten Ursache.

## 13. Debugging als Lernsystem

Ein Team wird besser, wenn Fehler nicht verschwinden, sondern verdichtet werden.

Aus einem Fehler entsteht:

- ein besserer Test
- ein genauerer Begriff
- eine robustere Checkliste
- eine bessere Dokumentation
- ein sichererer naechster Lauf

Das ist der eigentliche Gewinn. Debugging repariert nicht nur Software. Es repariert das Verstaendnis.

---

## Kapitel-Backlog

Die folgenden Kapitel werden als naechstes ausgebaut:

| Kapitel | Status | Naechster Inhalt |
|---|---|---|
| 3 Oberflaeche debuggen | Entwurf | Suche, Filter, Personalisierung, Profile, sichtbare vs. technische Elemente |
| 4 Page Inspection | Entwurf | Page Caption, Page Name, Page ID, Source Table, Extensions |
| 7 Berechtigungen debuggen | Backlog | Permission Sets, Effective Permissions, TableData-Fehler |
| 8 Posting Groups debuggen | Backlog | General, VAT, Inventory, Customer/Vendor, FA Posting Groups |
| 9 Dimensionen debuggen | Backlog | Default Dimensions, Dimension Set ID, Beleg vs. Posten |
| 21 APIs/OData/MCP | Backlog | UI reicht nicht, strukturierte Datenabfragen |
| 22 Telemetry | Backlog | AL Exceptions, Job Queue, API Calls, Correlation ID |
| 25 Playwright | Entwurf | reproduzierbare Klickpfade, Screenshots, Regression |
| 26 Kundentickets | Entwurf | Ticketanalyse-Schema |
| 27 Evidence Packs | Entwurf | Pflichtdateien, Datenschutz, Root Cause |

## Projektartefakte fuer Agenten

| Artefakt | Rolle im System |
|---|---|
| `DEBUGGING_AGENT_RUNBOOK.md` | konkrete Schrittfolge vom Ticket bis zur Buchregel |
| `SAFE_ACTION_POLICY.md` | Sicherheitsmatrix und Abbruchregeln |
| `PLAYWRIGHT_DEBUGGING_FOUNDATION.md` | UI-/Playwright-Regeln fuer reproduzierbare Evidence |
| `BC_DATA_ACCESS_STRATEGY.md` | Entscheidung, welche Datenquelle welche Frage beantwortet |
| `OBJECT_MAPPING_STARTER.md` | Startpunkt fuer Page/Table/Entry-Mapping |
| `evidence/SAMPLE-001-missing-field/` | Demo fuer fehlende Spalte, Personalisierung und Page Inspection |
