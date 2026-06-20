# FIXEDASSETS-148 - Review der Posting-Group-Affordance

Status: `review`, `local-only`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-preview`, `no-posting`.

## Bewertete Evidence

- `fixedassets-147/FIXEDASSETS-147-result.json`
- `fixedassets-147/020-editmode-affordance.json`
- Screenshot `fixedassets-147-030-fa-cnc-01-posting-group-editmode-affordance.png`
- Pattern-Regel in `BC-PLAYWRIGHT-PATTERNS.md`

## Entscheidung

FA-147 wird als brauchbarer no-save Affordance-Nachweis akzeptiert. Der Screenshot zeigt:

- `FA-CNC-01` auf der `Fixed Asset Card`.
- `Posting Group = EQUIPMENT`.
- Einen feldnahen Auswahlbutton fuer `Posting Group`.
- Keine Auswahl von `MACHINES`.
- Keine Preview, keine Buchung und keine Anschaffung.

Daraus folgt: Ein spaeterer Schreibversuch darf nicht den alten Related-Card-Pfad wiederholen. Er darf nur den feldnahen Auswahlbutton mit `aria-label`/`title` passend zu `Posting Group` verwenden.

## Freigegebener naechster Hebel

`FIXEDASSETS-149-FA-CNC-01-POSTING-GROUP-FIELDLOCAL-ASSIGNMENT-FIT` darf genau einen kontrollierten UI-first Assignment-Fit versuchen:

- Vorher: `Posting Group = EQUIPMENT` sichtbar beweisen.
- Nur den feldnahen Button `Wählen Sie einen Wert für Posting Group` / `Select a value for Posting Group` klicken.
- In der Option-/Lookup-Liste nur `MACHINES` akzeptieren.
- Keine Related-Card-Navigation akzeptieren.
- Nach Auswahl Karte neu oeffnen und `Posting Group = MACHINES` sichtbar beweisen.
- Keine Anschaffung, keine Preview, kein `Post`, keine Einkaufsrechnung, keine Journalzeile.

## Stop-Kriterien

- Vordergrund ist nicht mehr `Fixed Asset Card` fuer `FA-CNC-01`.
- `Depreciation Book Card` oder ein anderer Related-Record-Kontext oeffnet sich.
- `MACHINES` ist nicht als Option sichtbar.
- Ein Dialog verlangt `OK`/`Yes`/`Ja` ohne eindeutigen Feldwertkontext.
- Nach Neuoeffnen steht weiterhin `EQUIPMENT` oder ein anderer Wert.

## Nicht behaupten

Bis FA-149 erfolgreich gelaufen ist:

- Nicht behaupten, dass `MACHINES` zugewiesen ist.
- Nicht behaupten, dass der Anlagenzugang bereit ist.
- Nicht als deutschen Finalnachweis verwenden.
