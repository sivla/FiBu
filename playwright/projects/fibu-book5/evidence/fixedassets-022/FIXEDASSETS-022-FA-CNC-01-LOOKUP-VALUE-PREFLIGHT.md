# FIXEDASSETS-022 - FA-CNC-01 Lookup Value Preflight

Status: labor-preflight-partial-no-save

## Zweck

Dieser Lauf prueft UI-first, ob die fuer den spaeteren Anlagenstamm `FA-CNC-01` relevanten Lookup-Werte auf einer neuen, leeren Anlagenkarte sichtbar oder auswaehlbar sind. Es wurde nichts gespeichert und nichts gebucht.

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Zielanlage: `FA-CNC-01`
- Zielbeschreibung: `CNC Maschine FRA`
- Erwarteter Depreciation Book Code: `HGB`
- Erwartete FA Posting Group: `MACHINES`
- Status: CRONUS-USA-Labor, kein deutscher Anlagen-Finalnachweis

## Ergebnis

| Feld | Feld gefunden | Lookup geoeffnet | sichtbare Ziel-/Referenzwerte | Status |
|---|---:|---:|---|---|
| FA Class Code | nein | nein | - | nicht gefunden |
| FA Subclass Code | nein | nein | - | nicht gefunden |
| Depreciation Book Code | nein | nein | - | nicht gefunden |
| FA Posting Group | nein | nein | - | nicht gefunden |

## Nicht gespeichert

- Neue Anlagenkarte wurde nur fuer Lookup-Pruefung geoeffnet.
- `FA-CNC-01` wurde nach dem Lauf nicht als gespeicherter Anlagenstamm nachgewiesen.
- Es gab keine Anschaffung, keine Abschreibung, keine Anlagenposten und keine Sachposten.

## Buchwirkung

Fuer die Klickanleitung ist dieser Lauf ein Preflight: Bevor ein Anfaenger eine Anlage speichert, muss klar sein, welche Pflicht-/Setupwerte aus Lookups kommen und ob sie im Mandanten wirklich verfuegbar sind. Screenshots duerfen nur als Wertnachweis verwendet werden, wenn der relevante Code im Bild sichtbar ist.

## Offene Grenze

- Laborbefund in `RM-DEMO`; kein DE-Finalnachweis.
- Falls FA Class/Subclass nicht sichtbar belegt sind, darf daraus noch keine finale Stammdatenvorgabe entstehen.

## Naechster Schritt

FIXEDASSETS-023: resolve missing lookup visibility before saving FA-CNC-01.
