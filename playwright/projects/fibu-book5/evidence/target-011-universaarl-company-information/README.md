# TARGET-011 Universaarl Company Information

Status: `observed`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

## Was geprueft wurde

Die Seite `Firmendaten` / `Company Information` wurde fuer `UNIVERSAARL-DE` geoeffnet. Der gespeicherte Name `Universaarl GmbH` ist nach erneutem Oeffnen sichtbar.

## UI-Learning

Der Stift-Button auf der Karte ist technisch als `Aenderungen auf der Seite vornehmen` erkennbar. Erst dieser Button schaltet die Firmendatenkarte in den Bearbeiten-Modus. Die Eingabefelder liegen im Business-Central-Frame; Feldklicks muessen deshalb den Frame-Offset beruecksichtigen.

Ein sichtbarer Wert vor dem erneuten Oeffnen reicht nicht als Speicherbeweis. TARGET-011 wertet den Namen erst als belegt, weil `Universaarl GmbH` nach erneutem Oeffnen der Seite sichtbar ist.

## Grenzen

- Adresse, Ort, PLZ und Laender-/Regionscode sind noch nicht als Buch-/Finalwerte freigegeben.
- USt-IdNr., Nummernserien, Buchungsgruppen, USt-Setup, Dimensionen und Buchungsreife sind nicht belegt.
- Es gab kein Posting, kein Preview Posting, keinen Beleg, keine Stammdatenanlage und keinen API-Shortcut.

## Naechster sinnvoller Schritt

`TARGET-012-W1-FOUNDATION-READINESS` entscheidet die Reihenfolge fuer die naechsten W1-Setup-Schritte, bevor Nummernserien, Buchungsgruppen, USt, Dimensionen oder Stammdaten angefasst werden.
