# FIXEDASSETS-135 - Readiness Field Gap Review

Status: `labor`, `local-review`, `judge-work`, `no-bc-run`, `no-playwright-run`, `no-setup`, `no-posting`, `not-final`.

| Punkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Bewertete Haupt-Evidence | FA-134 |
| Neue BC-Ausfuehrung | nein |
| Neue Playwright-Ausfuehrung | nein |
| Setup-Aenderung | nein |
| Buchung | nein |

## Entscheidung

FA-134 wird als `partial-labor-field-proof` akzeptiert: Der finale Screenshot zeigt die Anlagenkarte mit `Depreciation Book Code = HGB`, `Posting Group = EQUIPMENT`, AfA-Daten und `Book Value = 0,00`. Damit ist der Feld-/Kontrollpunkt fuer die Klickanleitung besser belegt als vorher.

FA-134 beweist aber keine Anschaffungsbereitschaft. `Acquire` ist sichtbar, aber deaktiviert; ein `Acquired`-/Ready-to-acquire-Signal fehlt; es gibt keine Preview, keine Anlagenposten und keine Sachposten.

## EQUIPMENT vs. MACHINES

`MACHINES` ist seit FA-016 als eigener CRONUS-USA-Laborfit der FA Posting Groups belegt. Das bedeutet: Die Buchungsgruppe existiert als Setup-Baustein.

FA-134 zeigt dagegen auf der konkreten Anlage `FA-CNC-01` sichtbar `Posting Group = EQUIPMENT` und nicht `MACHINES`. Daraus folgt:

- `MACHINES` darf nicht als aktuell zugewiesener Kartenwert fuer `FA-CNC-01` behauptet werden.
- `EQUIPMENT` ist der aktuelle sichtbare Kartenwert im Buch-Screenshot.
- Ein spaeterer Wechsel auf `MACHINES` waere eine eigene Setup-Entscheidung mit Vorher-/Nachher-Evidence, kein stiller Fix.

## Warum nicht direkt Acquire oder Setup?

Ein Klick auf `Acquire` bleibt nicht freigegeben, weil die Aktion deaktiviert ist. Ein Setup-Wechsel auf `MACHINES` bleibt ebenfalls nicht freigegeben, weil noch nicht technisch bewiesen ist, welches Feld auf welcher Tabelle den sichtbaren Wert liefert und ob `EQUIPMENT` fachlich bewusst aus Subclass/Standardlogik stammt.

## Naechster sinnvoller Schritt

`FIXEDASSETS-136-FA-CNC-01-PAGEINSPECTION-POSTING-GROUP-READONLY` soll die Anlagenkarte erneut read-only oeffnen und per Seitenpruefung technisch klaeren:

- Page Name / Page ID,
- Source Table,
- Feldkontext fuer Depreciation Book Code,
- Feldkontext fuer Posting Group / FA Posting Group,
- sichtbarer Wert `EQUIPMENT`,
- ob `Acquired` oder vergleichbare Erwerbsfelder technisch sichtbar sind.

Damit wird der naechste Screenshot- und Debugging-Baustein fuer Kapitel 21 und das spaetere Kapitel zu BC-Debugging/technischer Nachweisfuehrung vorbereitet.

## Buchwirkung

Kapitel 21 kann den FA-134-Screenshot als Pflichtfeldkontrolle nutzen, muss aber erklaeren: Ein vorhandenes Setup (`MACHINES`) ist nicht automatisch der Kartenwert einer konkreten Anlage. Anfaenger sollen lernen, zwischen Setup-Tabelle, Stammdatenkarte und Buchungsnachweis zu unterscheiden.

## Grenzen

- Kein deutscher Finalnachweis.
- Kein Anlagenzugang.
- Keine Anlagenposten.
- Kein Setup-Fit.
- Keine Aussage, dass `MACHINES` falsch oder richtig fuer `FA-CNC-01` waere.
