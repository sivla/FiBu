# FIXEDASSETS-299 AfA-Hypothesenentscheidung

Status: route-decision, labor-blocked, next-readonly-hypothesis, needs-german-final-rebuild

## Ausgangslage

`FIXEDASSETS-291` und `FIXEDASSETS-295` haben `Calculate Depreciation` mit `HGB`, `31.01.2027`, `FA-CNC-01` und jeweils eigener Belegnummer kontrolliert ausgefuehrt. Danach war im geprueften `Fixed Asset G/L Journals`-Kontext keine passende AfA-Journalzeile sichtbar.

`FIXEDASSETS-297` grenzt die alte Ursache ein: `FADEP-267-OK` hatte ein Datumsproblem, weil `30.06.2026` vor dem Zugang `01.01.2027` lag. Fuer `FADEP-295-OK` ist die Ursache aber nicht feldsicher bewiesen.

## Neue nicht-wiederholende Hypothese

Die naechste sinnvolle Hypothese ist nicht ein weiterer `OK`-Lauf. Die neue Hypothese lautet:

> Die erzeugte AfA-Zeile wurde moeglicherweise nicht im `Fixed Asset G/L Journal` gesucht, sondern muesste wegen `HGB Depreciation Integration = visible-off` aus `FIXEDASSETS-231` zuerst read-only im nicht-G/L-Anlagenjournal / `Fixed Asset Journals` gesucht werden.

Das ist keine finale Business-Central-Regel und kein deutscher Nachweis. Es ist eine evidence-basierte Suchhypothese aus RM-DEMO: Wenn die AfA-G/L-Integration im Labor sichtbar aus ist, ist die ausschliessliche Suche im G/L-Anlagenjournal fachlich zu eng.

## Entscheidung

Naechster Case:

`FIXEDASSETS-300-FA-JOURNAL-DEPRECIATION-OUTPUT-TARGET-READONLY`

Dieser Case darf nur read-only pruefen:

- `Fixed Asset Journals` / nicht-G/L-Anlagenjournal-Kontext
- `FADEP-291-OK`
- `FADEP-295-OK`
- `FADEP-`
- `FA-CNC-01`
- `HGB`

## Nicht erlaubt

- Kein `Calculate Depreciation -> OK`.
- Kein Preview Posting.
- Kein Post.
- Kein Setup Change.
- Kein Company Switch.
- Kein API Shortcut.
- Keine deutsche Finalbehauptung.

## Warum das besser ist als Wiederholung?

Ein weiterer OK-Lauf wuerde dieselbe Aktion wiederholen, ohne den Suchraum zu verbessern. Die read-only Suche im alternativen Journal prueft dagegen eine neue fachliche Ursache: falscher Ausgabe-/Suchkontext statt fehlgeschlagene Batchberechnung.

## German-Final-Rebuild

In der deutschen Zielinstanz muss diese Logik neu aufgebaut werden: AfA-Buch, G/L-Integration, Zieljournal, AfA-Journalzeile, Preview Posting, Buchung, Sachposten, Anlagenposten und Anlagenspiegel brauchen deutsche Evidence.

