# FIXEDASSETS-274 Post-acquisition OK Ergebnis-Review

Status: `labor`, `local-review`, `no-bc-run`, `no-preview`, `no-posting`, `not-final`.

## Ausgangspunkt

`FIXEDASSETS-273` hat `Calculate Depreciation` mit `HGB`, `31.01.2027`, `FADEP-273-OK` und `FA-CNC-01` ausgefuehrt. `OK` wurde genau einmal bestaetigt. Danach war `FADEP-273-OK` im sichtbaren `Fixed Asset G/L Journals`-Kontext nicht auffindbar.

## Einordnung

Der alte Blocker `AfA-Datum vor Zugang` ist fuer diesen Lauf nicht mehr ausreichend, weil `31.01.2027` nach dem Zugang `01.01.2027` liegt. Trotzdem ist keine AfA-Journalzeile bewiesen.

Plausible, aber noch nicht bewiesene Ursachen:

- Business Central erzeugt fuer `31.01.2027` keine Zeile, weil Start-/Enddatum, Restwert, Zeitraum oder AfA-Berechnung noch keine faellige Abschreibung ergeben.
- `Calculate Depreciation` schreibt in einen anderen Journal-Template-/Batch-Kontext als die aktuell sichtbare Seite.
- Die Journalansicht zeigt Spalten und Wertlisten, aber nicht den eigentlichen Batch mit der erwarteten Zeile.

## Entscheidung

Kein Repeat-OK, kein Preview Posting und kein Post. Der naechste sinnvolle Schritt ist ein read-only Lauf:

`FIXEDASSETS-275-FA-DEPRECIATION-ELIGIBILITY-AND-BATCH-TARGET-READONLY-DIAGNOSIS`

Dieser Lauf soll `FA-CNC-01/HGB` und den Journal-/Batch-Ausgabekontext gezielt lesen, ohne `OK`, Preview oder Post auszufuehren.

## Buchwirkung

Die Klickanleitung muss erklaeren: Ein Batch-`OK` ist nicht automatisch ein Erfolg. Nach `OK` muss man pruefen, ob Business Central tatsaechlich Journalzeilen erzeugt hat und in welchem Batch sie sichtbar sind. Wenn keine Zeile sichtbar ist, wird nicht wiederholt, sondern erst Ausgabeziel und AfA-Faelligkeit geprueft.
