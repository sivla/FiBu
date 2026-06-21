# FIXEDASSETS-175 Helper-Review

Status: `local-review`, `judge_work`, `no-bc`, `no-playwright`, `no-posting`, `not-final`.

## Review-Frage

Reicht der neue `journal-grid-candidates`-Helper aus FA-174, um einen neuen Live-Retry im `Fixed Asset G/L Journal` freizugeben?

## Ergebnis

Nein, noch nicht. Der Helper ist als Richtung richtig, aber vor einem Live-Retry braucht er eine strengere Zielwert-Regel.

## Was wirklich besser wurde

- Sichtbare Header werden nicht mehr automatisch als Schreibfreigabe interpretiert.
- Ein Kandidat braucht Zielzeilen-Signale und Zielspalten-Signale.
- `K30000` wird als verbotenes Signal fuer die aktuelle G/L-Gegenkonto-Route erkannt.
- FA-172 wird korrekt als Blocker erkannt, weil kein editierbarer `Bal. Account No.`-Kandidat vorliegt.

## Kritischer Punkt

`already-visible` darf nicht nur aus dem globalen kombinierten Snapshot abgeleitet werden. In BC-Journalgrids koennen andere Zeilen, Header, Shelltexte oder alte Werte sichtbar sein. Ein sichtbares `82000` zaehlt erst, wenn es row-anchored zur Zielzeile `G05001 / FA-CNC-01 / HGB` und zur Zielspalte `Bal. Account No.` gehoert.

Ohne diese Verschärfung koennte ein spaeterer Live-Lauf einen fremden Wert als Zielnachweis akzeptieren.

## Entscheidung

Kein Live-Retry, keine Werteingabe, keine Preview Posting und keine Buchung nach FA-175.

Der naechste Schritt ist ein kleiner lokaler Helper-Refinement-Case:

`FIXEDASSETS-176-JOURNAL-GRID-CANDIDATE-HELPER-REFINEMENT`

## Akzeptanz fuer FA-176

- `already-visible` nur, wenn Zielwert in einem row-anchored Kandidaten oder einer row-anchored Zell-/Control-Kombination liegt.
- Selftest mit negativem Beispiel: `82000` ist irgendwo sichtbar, aber nicht in der Zielzeile. Erwartung: kein Erfolg.
- Selftest mit positivem Beispiel: `82000` ist in der Zielzeile/Zielspalte sichtbar. Erwartung: `already-visible`.
- Keine BC-Ausfuehrung.
- Kein Playwright-Lauf.

## Buchwirkung

Fuer Kapitel 21 bleibt wichtig: Ein Journalbild oder ein DOM-Texttreffer ist nur dann ein Buch-/Evidence-Beweis, wenn der konkrete Wert in der konkreten Zeile und Spalte sichtbar ist. Fuer Anfaenger bedeutet das: nicht nur schauen, ob `82000` irgendwo auf der Seite steht, sondern ob es beim richtigen Anlagenbeleg in der richtigen Gegenkonto-Spalte steht.
