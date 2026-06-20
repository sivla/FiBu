# FIXEDASSETS-142 - Posting Group Field Locator Repair

## Kontext

- Instanzgrenze: `MCP_1_20260210`
- Company-Kontext: `RM-DEMO`
- Zielobjekt: `FA-CNC-01`
- Referenzblocker: `FIXEDASSETS-140` / `FIXEDASSETS-141`
- Arbeitstyp: lokaler Playwright-Test-/Locator-Fix

## Reparatur

Der bestehende Test `fixedassets-140-fa-cnc-01-posting-group-combobox-route.spec.ts` wurde lokal gehaertet:

- `findCardFrame()` akzeptiert nicht mehr den Vordergrundkontext `Depreciation Book Card` / `HGB depreciation book`.
- Vor dem Fuellen wird `Fixed Asset Card` + `FA-CNC-01` + `Posting Group` als Vordergrundkontext verlangt.
- Nach Dropdown-/Klickversuchen wird erneut geprueft, ob die `Fixed Asset Card` noch im Vordergrund ist.
- Wenn BC stattdessen die verwandte `Depreciation Book Card` oeffnet, stoppt der Lauf als `blocked-wrong-related-card-route`.
- Zeilenwerte werden erst nach erfolgreicher Vordergrundpruefung gelesen.

## Warum das wichtig ist

FA-140 hat gezeigt, dass ein Klick auf einen sichtbaren Kartenwert in Business Central eine verwandte Karte oeffnen kann. Ohne Guard koennte Playwright danach Zeilen aus der falschen Seite lesen und als Anlagenkartenwerte fehlinterpretieren. Genau das darf bei Buchscreenshots und Setup-Fits nicht passieren.

## Nicht bewiesen

- Kein BC-Lauf.
- Kein Playwright-Lauf.
- Kein `Posting Group = MACHINES`-Nachweis.
- Keine Setup-Aenderung.
- Keine Anschaffung.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-143-FA-CNC-01-POSTING-GROUP-GUARDED-RETRY`

Der naechste Lauf darf genau den reparierten UI-first Test einmal praktisch ausfuehren. Er muss bei falscher Vordergrundseite stoppen und darf weiterhin keine Anschaffung, keine Preview und keine Buchung ausloesen.
