# Operating Kernel

Status: active-control
Purpose: Minimaler Einstieg fuer jeden Arbeitsblock. Alles andere ist Referenz und wird nur gelesen, wenn der aktive Case es verlangt.

## Aktive Steuerung

Maximal diese fuenf Dateien steuern den naechsten Schritt:

1. `.agent/OPERATING-KERNEL.md`
2. `.agent/state/current.json`
3. die in `current.json` genannte aktive Case-Datei
4. `.agent/project-template/PROJECT-DASHBOARD-DRAFT.md`
5. `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md`

Roadmap, Foundation Decision, Source Registry, Skill-System, alte Cases und Evidence sind Referenz. Sie werden nicht standardmaessig geladen.

## Arbeitsblock

1. `current.json` lesen.
2. Aktive Case-Datei lesen.
3. Nur die dort genannten Must-read-Dateien lesen.
4. Nur die dort genannten Skills und Checks nutzen.
5. Nur die erlaubten Aktionen ausfuehren.
6. Ergebnis als den im Case genannten Output schreiben.

## Stopps

Immer stoppen bei falscher Instanz, falscher Company, Secret/Auth-Ausgabe, Legacy-Zielwelt als aktive Wahrheit, fehlendem Case-Gate fuer Writes, unklarer BC-Wirkung oder fehlender Evidence-/Korrekturstrategie.

## Aktueller Normalfall

Post-TARGET-075 ist gueltig. `TARGET-073` bleibt geparkt. Lokale no-live Foundation-Entscheidungen duerfen laufen, ohne TARGET-075 erneut als aktiven Normalzustand zu erzwingen.
