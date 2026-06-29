# Grids Skill

Use for: Business-Central-Listen, Subforms und Journal Lines lesen, Spalten finden und Zeilenwerte beweisen.

Do not use for: ungesicherte Eingaben in Buchungszeilen ohne sichtbaren Nachherwert.

Inputs: erwartete Page, Zielspalten, Zielwerte, erlaubte Editierfelder.

Outputs: Grid-Snapshot mit Spalten, Zeilen, x/y-Kandidaten, sichtbaren Zielwerten.

Safety: Geometry-Fallbacks nur mit Page-Kontext und sichtbarer Nachbedingung.

BC-Layout-Regel: Wenn Spalten, Codes oder Werte nicht eindeutig sichtbar sind, zuerst harmlose UI-Vergrößerungen nutzen:

- Page/Karte auf `Breite Layoutansicht anzeigen` stellen, wenn der Button sichtbar ist.
- Den betroffenen Seitenteil/Subform mit `Fokusmodus umschalten` vergrößern.
- FactBox ausblenden, wenn sie die Tabelle unnötig verengt.

Ein Screenshot ist erst Buch-/Feldbeweis, wenn die Zielcodes oder Zielwerte im Bild lesbar sind. Wenn nach breiter Layoutansicht und Fokusmodus nur Header oder die Meldung `In dieser Ansicht kann nichts angezeigt werden` sichtbar sind, ist das ein Blocker-/Debugging-Screenshot, kein Prozessbeweis.

P2P-007/P2P-009-Regel: Bei BC-Subforms kann die sichtbare Grid-Zeile in einem iframe liegen. Grid-Geometrie muss deshalb frameuebergreifend gesucht und mit Frame-Offset dokumentiert werden. Fuer einfache Zahlenwerte reicht ein Treffer in der gesamten Zeilenzeichenkette nicht aus, weil Datums-/Betragswerte falsch-positive Treffer erzeugen koennen. Werte wie `Quantity = 4` oder `Qty. to Receive = 2` gelten erst als belegt, wenn der Wert sichtbar in der richtigen Spalte oder in einem spaltengenauen Nachher-Snapshot erscheint.

P2P-009-Regel: Display-Textboxes in einer Purchase-Order-Lines-Zeile sind noch kein stabiler Editor. Wenn Single-Click/Enter, Double-Click und F2 nur sichtbare `SPAN role=textbox`-Elemente fokussieren und der Nachherwert leer bleibt, ist die Route `labor-blocked`. Der naechste Helper muss entweder einen echten Edit-Mode-/Cell-Editor-Actionpfad finden oder einen frischen kontrollierten Draft-/Select-items-Pfad verwenden, der Zielwerte vor oder waehrend der Zeilenerzeugung setzt.

WAREHOUSE-024-Regel: Eine sichtbare Purchase-Lines-Spalte wie `Location Code` und eine geometrisch passende Zelle beweisen nur Sichtbarkeit, nicht Schreibfaehigkeit. Wenn ein guarded Klick/Type/Tab auf die RAW-STEEL-Location-Zelle keinen Nachherwert erzeugt, nicht denselben Zellweg wiederholen. Der naechste Schritt ist ein Active-Editor-/Line-Details-Probe: Zielzelle fokussieren, aktives Element, echte Inputs/Comboboxen und zeilengebundene Line-Aktionen dokumentieren, aber noch keinen Wert schreiben.
