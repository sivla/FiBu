# FIXEDASSETS-176 Helper-Refinement

Status: `local-helper-refinement`, `wizard_work`, `no-bc`, `no-playwright`, `no-posting`, `not-final`.

## Ziel

FA-175 hat entschieden: Ein sichtbares `82000` darf im FA-G/L-Journal nicht global aus dem Seitentext oder Gesamtgrid zaehlen. Der Wert muss zur Zielzeile `G05001 / FA-CNC-01 / HGB` und zur Zielspalte `Bal. Account No.` gehoeren.

## Aenderung

`playwright/core/bc/journal-grid-candidates.ts` wertet `expectedValueVisible` jetzt nur noch ueber row-anchored Kandidaten aus. Ein Kandidat entsteht erst, wenn Zielspalten-Signal und Zielzeilen-Signale zusammenpassen.

Zusätzlich wird `no-editable-control-candidate` nicht mehr als Blocker gesetzt, wenn der Zielwert bereits row-anchored sichtbar ist. Das ist wichtig fuer read-only oder bereits befuellte BC-Zellen.

## Selftest

`core:journal-grid:selftest` deckt jetzt diese Faelle ab:

- FA-172 bleibt blockiert: Spalte sichtbar, aber keine isolierte Zielzeile und kein editierbarer Kandidat.
- Synthetische leere Zielzelle mit row-anchored editierbarem `Bal. Account No.` wird als `single-editable-candidate` akzeptiert.
- `82000` in einer anderen Zeile wird nicht als Erfolg akzeptiert.
- `82000` in der Zielzeile/Zielspalte wird als `already-visible` akzeptiert.
- `K30000` bleibt als verbotenes Signal fuer die aktuelle G/L-Gegenkonto-Route blockierend.

## Grenze

Das ist weiterhin nur lokale Helper-Evidence. Kein Business Central wurde geoeffnet, kein Playwright-Live-Test lief, kein Journalwert wurde eingetragen, keine Preview Posting und keine Buchung.

## Naechster Schritt

Der naechste sinnvolle Schritt ist kein Write-Retry, sondern ein read-only Live-Probe:

`FIXEDASSETS-177-FA-GL-JOURNAL-REFINED-CANDIDATE-READONLY`

Dieser Live-Probe soll den verfeinerten Helper gegen die aktuelle BC-Journalzone anwenden, ohne Werte einzugeben.
