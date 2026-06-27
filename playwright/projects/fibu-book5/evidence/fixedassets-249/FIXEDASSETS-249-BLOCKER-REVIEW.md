# FIXEDASSETS-249 AfA-Blocker-Review nach OK ohne sichtbare Journalzeile

Status: `local-review`, `labor`, `blocked`, `no-bc-run`, `no-playwright-run`, `no-preview`, `no-posting`, `not-final`.

## Was FA-248 bewiesen hat

- Umgebung: `MCP_1_20260210`
- Company: `RM-DEMO`
- Einstieg: `Tell-Me/Search -> Calculate Depreciation`
- Request Page: `Calculate Depreciation` wurde erkannt.
- `Document No.` wurde auf `FADEP-20260627-2158` gesetzt.
- `OK` wurde genau einmal bestaetigt.
- Danach war `Fixed Asset G/L Journals` sichtbar.
- Kein `Preview Posting` und kein `Post` wurden ausgefuehrt.

## Was FA-248 nicht bewiesen hat

- Keine sichtbare Journalzeile mit `FADEP-20260627-2158`.
- Keine sichtbare erzeugte AfA-Zeile.
- Keine Preview-Posting-Evidence.
- Keine AfA-Buchung.
- Keine FA-/G/L-Postenspur fuer AfA.
- Kein deutscher Finalnachweis.

## Wahrscheinlichste Ursachenklassen

1. Die Journalzeile wurde erzeugt, war aber auf der ersten sichtbaren Journalansicht nicht sichtbar.
2. Die Journalzeile wurde in einem anderen Batch, Filterzustand oder nicht im sichtbaren Gridbereich abgelegt.
3. Die Request-Page-Parameter reichten nicht fuer eine faellige Abschreibung, z. B. Posting Date, AfA-Buch, Anlagenfilter oder Zeitraum.
4. Business Central hatte keine berechenbare Abschreibung fuer `FA-CNC-01`, obwohl Anschaffung und HGB-Kontext vorhanden sind.
5. Der Playwright-Trace war zu schwach, weil er nicht gezielt nach dem Dokumentnummernwert im Journal suchte.

## Entscheidung

Kein zweiter `OK`-Klick ohne besseren Nachweis. Der naechste sichere Schritt ist ein read-only Journal-Such-/Filterlauf nach `FADEP-20260627-2158` auf `Fixed Asset G/L Journals`.

Wenn dieser Suchlauf keine Zeile findet, ist danach eine Request-Page-Parameterdiagnose sinnvoll: konkrete Werte fuer `Depreciation Book`, `Posting Date`, `Document No.`, Filter und sichtbare Optionen dokumentieren, aber weiter ohne `OK`.

## Buchwirkung

Die Klickanleitung darf `OK` noch nicht als erfolgreiche AfA-Zeilenerzeugung beschreiben. Sie muss stattdessen erklaeren: Nach einem Batchjob prueft man zuerst, ob Business Central eine Journalzeile erzeugt hat. Erst diese Zeile ist der naechste fachliche Kontrollpunkt.

## Naechster Schritt

`FIXEDASSETS-250-FA-DEPRECIATION-JOURNAL-SEARCH-READONLY`: `Fixed Asset G/L Journals` read-only oeffnen und gezielt nach `FADEP-20260627-2158` bzw. `FADEP-` suchen; kein `OK`, kein Preview Posting, kein Post, keine manuelle Journalzeilen-Aenderung.
