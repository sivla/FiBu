# FIXEDASSETS-021 - FA-CNC-01 Setup-Fit-Entscheidung

Status: erledigt  
Arbeitsart: Entscheidung ohne BC-Lauf  
Umgebung: `MCP_1_20260210`  
Company: `RM-DEMO`  
Basis: `FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING`

## Entscheidung

`FA-CNC-01` wird noch nicht gespeichert.

Der naechste Lauf ist nur ein enger UI-first Lookup-/Value-Preflight:

`FIXEDASSETS-022-FA-CNC-01-LOOKUP-VALUE-PREFLIGHT`

## Warum noch nicht speichern?

`FIXEDASSETS-020` hat einen wichtigen Fortschritt gebracht: Auf der leeren `Fixed Asset Card` sind nach `Mehr anzeigen` die Feldpfade `Depreciation Book Code` und `Posting Group` sichtbar. Damit ist klar, wo AfA-Buch und Anlagenbuchungsgruppe fachlich hingehören.

Das reicht aber noch nicht fuer einen sicheren Stammdatensatz:

- `FA-CNC-01` ist noch nicht als gespeicherter Anlagenstamm nachgewiesen.
- `CNC Maschine FRA` ist noch nicht als Beschreibung gesetzt.
- `HGB` ist zwar als AfA-Buch im Setup sichtbar, aber noch nicht als auswählbarer oder gesetzter Kartenwert belegt.
- `MACHINES` ist zwar als Anlagenbuchungsgruppe im Setup sichtbar, aber noch nicht als auswählbarer oder gesetzter Kartenwert belegt.
- `FA Class Code` und `FA Subclass Code` sind Pflicht-/Strukturfelder; die Zielwerte `MASCHINE`/`CNC` sind im Labor nicht belegt.
- AfA-Datumsfelder und Nutzungsdauer muessen vor einem Speicherlauf fachlich festgelegt werden.

## Erlaubter naechster Schritt

`FIXEDASSETS-022` darf:

- `Fixed Assets` in `RM-DEMO` oeffnen.
- Eine neue, leere Anlagenkarte nur fuer Preflight/Lookup-Pruefung oeffnen.
- Lookups oder Assist-Edit fuer `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code` und `Posting Group` prüfen.
- Sichtbar dokumentieren, ob `HGB` und `MACHINES` auswählbar sind.
- Sichtbar dokumentieren, welche Klassen-/Unterklassenwerte wirklich vorhanden sind.
- Ohne Speichern abbrechen.

`FIXEDASSETS-022` darf nicht:

- `FA-CNC-01` speichern.
- neue FA Classes oder FA Subclasses anlegen.
- `K30000` anlegen.
- eine Einkaufsrechnung erfassen.
- Zugang, AfA oder andere Anlagenbuchungen durchführen.
- deutsche HGB-/Kontenplan-Finalwahrheit behaupten.

## Stop-Kriterien

Der naechste Lauf muss abbrechen und Evidence schreiben, wenn:

- `HGB` nicht im AfA-Buch-Lookup auswählbar ist.
- `MACHINES` nicht im Posting-Group-Lookup auswählbar ist.
- `FA Class Code` oder `FA Subclass Code` zwingend ist, aber keine passende vorhandene Laborzuordnung belegt werden kann.
- BC beim Öffnen oder Schliessen der Karte einen Speichern-/Pflichtfeld-/Template-Dialog zeigt.
- die UI in eine andere Company oder Instanz wechselt.

## Anfaenger-Lernwert

Business Central trennt Feldsichtbarkeit und fachliche Gueltigkeit. Ein Feld wie `Posting Group` ist nur der Ort der Kontenfindung. Erst der konkrete Wert `MACHINES` bestimmt, welche Sachkonten spaeter bei Zugang, AfA oder Abgang verwendet werden. Deshalb muss eine Klickanleitung nicht nur zeigen, wo ein Feld steht, sondern auch, welche Werte dort wirklich auswählbar und fachlich richtig sind.

## Buchwirkung

Kapitel 21 bleibt ein Zielprozess. Im Labor ist jetzt belegt, dass die Anlagenkarte die relevanten Setup-Felder sichtbar machen kann. Noch nicht belegt ist, dass `FA-CNC-01` mit `HGB`, `MACHINES`, Klassen-/Unterklassenwerten und AfA-Daten korrekt gespeichert werden kann. Die Klickanleitung braucht deshalb vor dem ersten Stammdatenscreenshot einen Lookup-/Werte-Preflight.

## Grenzen

- Kein BC-Lauf in diesem Schritt.
- Kein Screenshot in diesem Schritt.
- Kein Setup, keine Anlage, keine Buchung.
- CRONUS-USA-Labor, kein deutscher Finalnachweis.
