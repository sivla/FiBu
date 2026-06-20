# FIXEDASSETS-146 - Review der Posting-Group-Diagnose

Status: `review`, `local-only`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-preview`, `no-posting`.

## Bewertete Evidence

- `fixedassets-145/FIXEDASSETS-145-result.json`
- Page-Inspection-Screenshot zu `Fixed Asset Card (5600)` / `Fixed Asset (5600)`
- Personalisieren-Screenshot mit `Posting Group = EQUIPMENT`
- Pattern-Regel in `BC-PLAYWRIGHT-PATTERNS.md`

## Entscheidung

FA-145 ist ein guter technischer Nachweis fuer die Fehleranalyse, aber kein Setup-Fit. Die Evidence zeigt:

- `FA-CNC-01` steht weiterhin auf `Posting Group = EQUIPMENT`.
- Page Inspection bestaetigt das technische Feld `FA Posting Group (29, Code[20])`.
- Personalisieren bestaetigt, dass `Posting Group` im Kartenkontext sichtbar ist.
- Es wurde kein Wert ausgewaehlt, kein Layout gespeichert und keine Stammdaten-/Setup-Aenderung vorgenommen.

Daraus folgt: Ein Schreibfall ist noch nicht freigegeben. Page Inspection und Personalisieren sind Diagnosewerkzeuge, keine Schreibhebel.

## Naechster sicherer Hebel

Der naechste sinnvolle praktische Schritt ist kein erneuter Alt+ArrowDown-/Right-Edge-/Typed-Value-Versuch. Stattdessen soll ein enger No-save-Probe pruefen, ob der Edit-Modus auf der `Fixed Asset Card` ein eindeutiges Lookup-/AssistEdit-/Dropdown-Affordance fuer genau das Feld `Posting Group` zeigt.

Erfolg zaehlt nur, wenn der Lauf sichtbar belegt:

- Vordergrund bleibt `Fixed Asset Card` fuer `FA-CNC-01`.
- `Posting Group` bleibt vor und nach dem Probe `EQUIPMENT`.
- Ein konkreter, feldnaher Lookup-/AssistEdit-Hebel wird gefunden oder sauber als nicht gefunden dokumentiert.
- `MACHINES` wird nicht ausgewaehlt.
- Es wird nichts gespeichert.

## Nicht behaupten

- Nicht behaupten, dass `MACHINES` auf `FA-CNC-01` gesetzt ist.
- Nicht behaupten, dass der Anlagenzugang bereit ist.
- Nicht behaupten, dass Page Inspection oder Personalisieren ein Anwender-Klickpfad fuer den Setup-Fit ist.
- Nicht als deutsches Finalbild verwenden.
