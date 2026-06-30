# TARGET-024B Global Dimension Assignment

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

TARGET-024B proved 0/2 Global Dimension Code fields.

## Gepruefte Routen

- Direkte Kartenbearbeitung auf `Finanzbuchhaltung Einrichtung`: Der Bearbeiten-Modus wurde versucht, die Felder blieben nach Reopen leer.
- Aktion `Globale Dimensionen aendern...`: Die linke Eingabespalte nahm `PRODUCTLINE` und `COSTCENTER` sichtbar an.
- Die rechte Spalte der Aktion blieb leer bzw. wurde nicht sicher als wirksames Zielfeld getroffen. Nach `Fortlaufend`/Rueckkehr zur Einrichtung waren beide globalen Dimensionsfelder weiter leer.

## Felder

- Global Dimension Code 1: blocked - Global Dimension Code 1 did not show PRODUCTLINE after Change Global Dimensions sequential run and reopen.
- Global Dimension Code 2: blocked - Global Dimension Code 2 did not show COSTCENTER after Change Global Dimensions sequential run and reopen.

## Naechster sinnvoller Schritt

Nicht dieselbe Eingabe wiederholen. TARGET-024C soll die Action-Page technisch und visuell enger untersuchen: Page Inspection/Page Fields, linke vs. rechte Spalte, verfuegbare Actions, Tooltip/Role-Namen und moegliche Ausfuehrungsaktion.

## Grenzen

- Keine Stammdaten.
- Keine Standarddimensionen.
- Keine Preview und keine Buchung.
- Keine Reportingwirkung ohne spaetere gebuchte Posten.
