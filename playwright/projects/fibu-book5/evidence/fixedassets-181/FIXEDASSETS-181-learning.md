# FIXEDASSETS-181 - Lernnotiz zum Journal-Grid-Kandidaten

## Situation

Im Anlagenprozess `FA-CNC-01` ist der normale Acquire-Weg blockiert. Der alternative Weg ueber das `Fixed Asset G/L Journal` benoetigt in der bestehenden Laborzeile ein sicheres Gegenkonto. Aus dem Setup-Fit ist `82000` als CRONUS-USA-Laborwert fuer `MACHINES / Acquisition Cost Bal. Acc.` belegt.

## Warum der Review noetig war

Business Central Journalgrids sind stark virtualisiert. Sichtbare Spaltenueberschriften und Seitentext reichen nicht aus, um ein Feld sicher zu fuellen. FA-177 hatte deshalb korrekt blockiert. FA-180 verbesserte den Helper: Der Zielkandidat wird nicht mehr nur ueber Text, sondern ueber Header-Geometrie und Row-Control-Signale bestimmt.

## Bewertung

FA-180 zeigt genau einen editierbaren Kandidaten:

- Spalte: `Bal. Account No.`
- Kandidat: Control Index `14`
- Zeile: durch Controls mit `G05001`, `FA-CNC-01`, `HGB` verbunden
- Status: leer, editierbar, keine verbotenen Signale

Das ist ausreichend fuer einen schmalen Werteingabe-Preflight, aber nicht fuer Buchungsreife.

## Grenze

Der Wert `82000` ist im Journal noch nicht sichtbar. Preview Posting, Post und Postenspur bleiben gesperrt. FA-182 darf nur den Zielwert in genau den wiedergefundenen Kandidaten eintragen und den sichtbaren Feldwert sichern.

## Buchwirkung

Fuer Kapitel 21 ist das ein wichtiger technischer Lernfall: Bei BC-Journalen muss die Anleitung erklaeren, dass ein Screenshot der Spalten nicht automatisch beweist, dass Playwright oder ein Anwender das richtige Feld trifft. Der naechste Buchkandidat braucht den sichtbaren Wert im Journalfeld, nicht nur die Spalte.
