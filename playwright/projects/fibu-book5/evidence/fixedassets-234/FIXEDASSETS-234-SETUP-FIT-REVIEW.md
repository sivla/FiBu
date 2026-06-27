# FIXEDASSETS-234 - HGB Depreciation Integration Setup-Fit Review

Status: `labor-review`, `local-only`, `no-bc-run`, `no-playwright-run`, `no-posting`

## Geprueft

Reviewed wurden nur vorhandene Evidence-Dateien aus `FIXEDASSETS-231`, `FIXEDASSETS-232` und `FIXEDASSETS-233`.

Der relevante Vergleich ist:

- `FIXEDASSETS-231`: HGB `G/L Integration - Depreciation` war read-only sichtbar aus.
- `FIXEDASSETS-232`: AfA-Preflight blieb deshalb blockiert.
- `FIXEDASSETS-233`: HGB `G/L Integration - Depreciation` wurde UI-first von `false` auf `true` gesetzt.

## Entscheidung

Der FA-233-Setup-Fit wird akzeptiert, weil die Zielcheckbox feldlokal vor und nach dem Klick nachgewiesen ist:

- Vorher: `checked=false`
- Nachher: `checked=true`
- Zielkontext: `MCP_1_20260210` / `RM-DEMO` / HGB `Depreciation Book Card`
- Scope: genau ein Setup-Feld

Damit ist die fruehere Sperre "`G/L Integration - Depreciation=false`" geloest. Es ist aber noch kein AfA-Journal, keine Preview Posting Vorschau und keine Buchung nachgewiesen.

## Playwright-Lernpunkt

FA-233 enthaelt einen Helper-Hinweis: Der gemeldete `editMode`-Kandidat war breit und nicht fachlich spezifisch (`Sales`). Das entwertet den Setup-Fit nicht, weil der eigentliche Nachweis auf dem eindeutigen Checkbox-Vorher/Nachher-Wert liegt.

Fuer kuenftige Setup-Fits gilt: Wenn das Ziel-Control bereits editierbar ist, soll der Test nicht zusaetzlich eine breite Edit-/Top-Action klicken. Entscheidend ist die zielnahe Feld-Evidence.

## Buchwirkung

Kapitel 21 darf den HGB-Setup-Schalter als Laborvoraussetzung erklaeren:

- `G/L Integration - Acq. Cost` erklaert die Anschaffungsspur.
- `G/L Integration - Depreciation` muss separat eingeschaltet sein, bevor AfA fachlich sinnvoll geprueft wird.
- Ein eingeschalteter Setup-Schalter ist noch keine Buchung und keine Postenspur.

## Naechster Schritt

Naechster Case ist `FIXEDASSETS-235-FA-DEPRECIATION-PREVIEW-ONLY-PLAN`.

Er soll nur planen, wie ein spaeterer UI-first AfA-Preview-only-Lauf aussehen darf:

- keine Buchung,
- keine Post-Bestaetigung,
- Journalzeile nur wenn eigener Gate-Fall es sauber erlaubt,
- Preview Posting nur als Vorschau-Nachweis,
- Cleanup/Keep-Strategie vorab dokumentieren.

