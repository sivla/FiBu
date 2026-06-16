# Buchkapitel-Entwurf: Fehlende Spalten debuggen

## Ziel des Kapitels

Leser lernen, fehlende Felder oder Spalten in Business Central zuerst als Sichtbarkeits- und Kontextproblem zu behandeln, nicht als fehlende Funktion.

## Typisches Kundenticket

"Die Spalte Lagerortcode fehlt in den Verkaufszeilen. Ich kann den Auftrag nicht wie in der Anleitung erfassen."

## Was der User sieht

Der Verkaufsauftrag ist geoeffnet, aber die benoetigte Spalte ist im Zeilenbereich nicht sichtbar.

## Was BC wahrscheinlich im Hintergrund tut

BC rendert die Page anhand von Page-Design, Profil, Personalisierung, Rolle, Sprache, Berechtigung und moeglichen Extensions.

## Betroffene Pages

- Sales Order / Verkaufsauftrag
- Personalisieren
- Page Inspection

## Betroffene Tabellen

- Sales Header, Annahme
- Sales Line, Annahme

## Relevante Felder

- `Location Code` / `Lagerortcode`

## Haeufige Ursachen

- Spalte ist ausgeblendet.
- Profil/Rollenlayout zeigt eine reduzierte Ansicht.
- User-Personalisierung weicht von Anleitung ab.
- Page Extension veraendert Layout.
- Berechtigung oder Feature beeinflusst Sichtbarkeit.

## Diagnosepfad

1. Screenshot als Sichtbarkeitsbefund sichern.
2. Page Inspection fuer Page/Table/Feldkontext nutzen.
3. Personalisieren pruefen.
4. Profil/Rolle vergleichen.
5. Berechtigungen nur pruefen, wenn Hinweise darauf bestehen.

## Repro in Sandbox

Mit Testuser und Testprofil Sales Order oeffnen, Verkaufszeilen fotografieren und Sichtbarkeit von `Location Code` pruefen.

## Evidence Pack

Der Sample-Fall `debugging-book/evidence/SAMPLE-001-missing-field/` zeigt die komplette Struktur.

## Fix / Workaround

Kurzfristig Spalte per Personalisieren einblenden, wenn erlaubt. Dauerhaft Anleitung oder Profil/Rollenlayout anpassen.

## Regressionstest

Die Anleitung gilt nur als robust, wenn sie entweder die Spalte sichtbar zeigt oder erklaert, wie der User sie sicher einblendet.

## Was man nicht tun darf

Nicht direkt von "Spalte fehlt" auf "Funktion fehlt" schliessen. Nicht produktive Profile ohne Freigabe aendern.

## Merksatz

Eine unsichtbare Spalte ist zuerst ein Layoutbefund, kein Funktionsbeweis.

## Mini-Uebung

Oeffne eine Test-Sales-Order, blende eine nicht kritische Spalte aus und dokumentiere danach, welche Evidence beweist: Layout geaendert, Feld technisch weiterhin vorhanden.
