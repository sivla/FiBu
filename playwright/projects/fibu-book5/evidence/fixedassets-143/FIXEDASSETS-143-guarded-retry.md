# FIXEDASSETS-143 - Guarded Posting Group Retry

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Asset: `FA-CNC-01`
- Ziel: `Posting Group` von `EQUIPMENT` auf `MACHINES` nur dann setzen, wenn der Vordergrund sicher die `Fixed Asset Card` bleibt.
- Ausgefuehrter Befehl: `npm run fibu:fixedassets:fa-cnc-01-posting-group-combobox-route`

## Ergebnis

Status: `blocked-wrong-related-card-route`

Der Live-Retry hat den reparierten Guard bestaetigt. Der Lauf erkennt, dass der Feldpfad den Vordergrund verliert und die verwandte `Depreciation Book Card` fuer `HGB` oeffnet. Dadurch werden keine Zeilen aus der falschen Karte mehr als Werte von `FA-CNC-01` interpretiert.

## Sichtbarer Befund

- Vorher: `FA-CNC-01`, `Posting Group = EQUIPMENT`, `Book Value = 0,00`.
- FA-Ledger-Sicherheitscheck: keine kompakte Zielpostenspur fuer `FA-CNC-01`.
- Beim `Alt+ArrowDown`-/Feldpfad: Vordergrund enthaelt `Depreciation Book Card` und `HGB depreciation book`.
- Screenshot: `playwright/projects/fibu-book5/img/fixedassets-140-060-fa-cnc-01-posting-group-machines.png`
- Der Screenshot ist ein Blocker-/Debugging-Bild, kein Buchbild fuer `MACHINES`.

## Nicht passiert

- Keine `Posting Group = MACHINES`-Zuordnung.
- Keine Anschaffung.
- Keine Einkaufsrechnung.
- Kein Journal.
- Keine Preview Posting.
- Keine Buchung.
- Kein Draft.
- Kein Company-Wechsel.
- Kein API-Shortcut.

## Lernwert

Business Central behandelt den sichtbaren Wert im Feldbereich teilweise wie einen Related-Record-Link. Fuer Klickanleitungen muss deshalb immer sichtbar sein, ob man noch auf der fachlich richtigen Page arbeitet. Fuer Playwright gilt: Ein gruener Test ist nur hilfreich, wenn das Ergebnis fachlich klassifiziert ist; hier ist der gruene Test ein sauberer Blocker-Nachweis.

## Naechster Schritt

`FIXEDASSETS-144-FA-CNC-01-POSTING-GROUP-ROUTE-DECISION`

Nicht denselben Feldpfad wiederholen. Lokal entscheiden, ob ein anderer UI-Hebel sinnvoll ist, zum Beispiel echte Lookup-Action, Page-Inspection-/Personalisieren-Diagnose, oder ob der Anlagenzugangspfad vorerst ohne `MACHINES`-Kartenfit gehalten wird.
