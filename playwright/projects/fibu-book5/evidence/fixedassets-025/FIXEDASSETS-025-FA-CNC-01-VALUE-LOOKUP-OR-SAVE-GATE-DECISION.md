# FIXEDASSETS-025 - FA-CNC-01 Value Lookup / Save Gate Decision

Status: `labor`, `decision-no-bc-run`, `no-save`, `no-setup`, `no-posting`, `not-final`

## Kontext

Mandant: `RM-DEMO`  
Sandbox: `MCP_1_20260210`  
Buchkapitel: Kapitel 21 Anlagen / BC-Debugging und technische Nachweisfuehrung

Der vorherige Lauf `FIXEDASSETS-024` sollte pruefen, ob die leere `Fixed Asset Card` technisch sicher genug adressierbar ist, um spaeter Werte fuer `FA-CNC-01` zu pruefen oder zu setzen.

Die tatsaechliche Evidence sagt aber:

- `activeControlProof = false`
- 6 erwartete Captions
- 4 aktive Kartencontrols gemappt
- 2 Captions nicht sichtbar
- nicht sichtbar: `Depreciation Book Code`, `Posting Group`

## Entscheidung

`FA-CNC-01` darf noch nicht gespeichert werden.

Auch ein Werte-/Lookup-Preflight fuer `HGB` und `MACHINES` wird noch nicht gestartet, solange die aktiven Kartencontrols fuer `Depreciation Book Code` und `Posting Group` in der aktuellen Diagnose nicht wiedergefunden werden.

## Warum Business Central hier streng behandelt werden muss

Auf der Anlagenkarte sind Feldpfad, sichtbare Caption, aktives Control, Lookup-Button, gesetzter Wert und gespeicherter Stammdatensatz unterschiedliche Beweisebenen.

Ein Screenshot oder DOM-Treffer reicht nicht, wenn er nur zeigt, dass ein Begriff irgendwo auf der Seite oder im Hintergrund vorkommt. Fuer eine Klickanleitung muss sichtbar sein:

1. auf welcher Page gearbeitet wird,
2. welches Feld auf der aktiven Karte gemeint ist,
3. ob der Zielwert im richtigen Feld steht,
4. ob der Datensatz gespeichert wurde,
5. was danach in Belegen/Posten passiert.

`FIXEDASSETS-024` beweist derzeit nur Ebene 1 und einen Teil von Ebene 2. Das reicht nicht fuer Speichern oder Buchung.

## Gesperrt

- `FA-CNC-01` speichern
- `HGB` oder `MACHINES` als Anlagenkartenwerte behaupten
- Kreditor `K30000` anlegen
- Einkaufsrechnung fuer den Anlagenzugang anlegen
- Anlagenzugang buchen
- AfA berechnen oder buchen
- deutschen Anlagen-Finalnachweis behaupten

## Erlaubter naechster Schritt

`FIXEDASSETS-026-FA-CNC-01-DEPRECIATION-BOOK-CONTROL-RECOVERY`

Ziel:

- aktive Kartencontrols fuer `Depreciation Book Code` und `Posting Group` wiederfinden,
- bei Bedarf kartenlokal `Mehr anzeigen`, Personalisieren oder Page Inspection als Diagnose nutzen,
- weiter ohne Speichern, ohne Setup-Aenderung und ohne Buchung arbeiten.

## Buchwirkung

Kapitel 21 darf `FIXEDASSETS-024` nicht als vollstaendigen Control- oder Save-Gate-Nachweis beschreiben. Fuer Anfaenger ist die wichtige Lehre:

Ein sichtbarer Feldname ist noch kein gesetzter Wert, und ein technischer Treffer ist noch kein buchbarer Stammdatensatz.

