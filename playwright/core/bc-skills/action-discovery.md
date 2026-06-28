# BC Action Discovery

Status: `draft`, evidence-driven.

## Zweck

Business-Central-Aktionen nur im fachlich richtigen Page-/Subform-Kontext erfassen, damit globale Shell-, Role-Center- oder Profilaktionen nicht als fachliche Prozessroute fehlinterpretiert werden.

## Use When

- ein Klickpfad unklar ist,
- eine Aktion wie `Edit`, `Line`, `Manage`, `Preview Posting` oder `Post` mehrdeutig ist,
- ein Subform/Grid keine stabile Feldroute zeigt,
- ein Prozess vor einer wirksamen Aktion einen sicheren Menue-/Action-Nachweis braucht.

## Do Not Use When

- der Zielbutton bereits eindeutig und scoped ist,
- die Aktion `Post`, `Preview`, `Receive`, `Invoice`, `Delete`, `New` oder `Edit in Excel` ausloesen wuerde und kein Case-Gate existiert,
- nur Shell-/Role-Center-Text sichtbar ist.

## Inputs

- erwartete Instanz und Company,
- erwartete Page oder Belegnummer,
- fachlicher Kontexttext, z. B. `Purchase Order 106054` und `RAW-STEEL`,
- erlaubte Menues, z. B. `More options`, `Line`, `Manage`,
- riskante Aktionen, die nur inventarisiert, aber nicht geklickt werden duerfen.

## Output JSON Schema

```json
{
  "pageContext": "",
  "openedMenus": [],
  "candidates": [
    {
      "text": "",
      "aria": "",
      "title": "",
      "controlName": "",
      "risk": "safe-menu|edit-candidate|risky|context"
    }
  ],
  "usefulDirectActionFound": false,
  "notUsefulBecause": []
}
```

## Safety / Boundary Rules

- Vor dem Inventar muss die Page den erwarteten Beleg-/Page-Kontext enthalten.
- Inventarisiere nur Frames, die den fachlichen Kontext enthalten.
- Filtere Shell, Role Center, Account Manager, Headline, Lern-/Hilfe-Kacheln und Connector-/Shopify-Navigation heraus.
- `Post`, `Preview`, `Receive`, `Invoice`, `Delete`, `New`, `Copy` und `Excel` sind riskant: erfassen ja, klicken nein.
- Ein Menue mit dem Wort `edit` beweist noch keine Feldwert-Route. Der Kandidat muss fachlich direkt zum Ziel passen.

## Stop If

- Instanz oder Company nicht stimmt,
- der erwartete Beleg nicht sichtbar ist,
- ein Dialog mit wirksamer Bestaetigung erscheint,
- ein Kandidat nur globaler Shell-/Role-Center-Kontext ist.

## Preferred TaskClass

`wizard_work`

## Max Context Lines

160 pro Action-Inventar.

## Updates State

Ja, wenn das Action-Inventar eine Prozessroute freigibt oder einen Blocker belegt.

## Evidence

P2P-011 zeigte, dass ungescoped Action Discovery einen globalen Konto-/Shell-Kandidaten faelschlich als Edit-Kandidat werten kann. Der korrigierte Probe inventarisiert nur Purchase-Order-Kontext und fand keine direkte sichere `Edit`/`Edit List`-Route fuer Purchase-Lines-Zielwerte.
