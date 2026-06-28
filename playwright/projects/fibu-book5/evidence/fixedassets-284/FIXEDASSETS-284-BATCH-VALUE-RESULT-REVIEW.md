# FIXEDASSETS-284 Batchwert-Review

Status: `labor`, `local-review`, `no-bc`, `no-playwright`, `no-ok`, `no-preview`, `no-post`, `not-final`.

## Review-Frage

`FIXEDASSETS-283` hat auf `Fixed Asset G/L Journals` das Label `Batch Name` und zwei Lookup-/Button-Kandidaten gezeigt, aber keinen konkreten ausgewaehlten Batchwert. Die Frage ist, ob daraus ein weiterer Live-Schritt folgen darf.

## Entscheidung

Ein sichtbarer Lookup-Button darf nicht als Batchwert interpretiert werden. Er beweist nur, dass Business Central eine Auswahl-/Lookup-Aktion anbietet.

Der naechste kleinste sinnvolle Schritt ist deshalb ein eigener no-select Lookup-Listen-Probe:

- `Batch Name`-Lookup oeffnen.
- sichtbare Listen-/Dropdowntexte sichern.
- keine Zeile auswaehlen.
- kein `OK`, kein `Enter`, kein Speichern.
- danach mit `Escape` oder sicherem Seitenkontext schliessen.

## Warum nicht sofort Calculate Depreciation oder Preview?

Ohne konkretes Journal-/Batch-Ziel bleibt unklar, wo Business Central eine AfA-Zeile erzeugen wuerde. Ein erneutes `Calculate Depreciation -> OK` oder Preview Posting waere Wiederholung ohne Zielnachweis.

## Anfaenger-Lernwert

In Business Central sind drei Dinge getrennt:

1. Feldbeschriftung: `Batch Name`
2. Lookup-/Auswahlknopf: Auswahl ist moeglich
3. ausgewaehlter Wert: fachlich relevanter Nachweis

Fuer eine Klickanleitung reicht Stufe 1 oder 2 nicht aus. Vor Buchung oder Preview muss der Anwender sehen, welcher Wert oder welche Journalzeile wirklich aktiv ist.

## Grenzen

- Keine neue BC-Ausfuehrung.
- Keine Playwright-Ausfuehrung.
- Kein Batch wurde ausgewaehlt oder geaendert.
- Keine Journalzeile wurde angelegt, bearbeitet oder geloescht.
- Kein `Calculate Depreciation -> OK`.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-285-FA-DEPRECIATION-BATCH-LOOKUP-LIST-NO-SELECT`: no-select Lookup-Listen-Probe fuer `Batch Name` auf `Fixed Asset G/L Journals`.

