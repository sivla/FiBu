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
