# FIXEDASSETS-240 - FA Depreciation Action Inventory Read-only

Status: `read-only`, `action-inventory`, `no-executing-action-click`, `no-calculate-depreciation`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Resultat | observed |
| Dropdown-Versuche | 2 |
| Calculate Depreciation gefunden | nein |
| Preview Posting gefunden | nein |

## Was geprueft wurde

- Fixed Asset G/L Journals wurde in `MCP_1_20260210` / `RM-DEMO` read-only geoeffnet.
- Nur nicht-ausfuehrende Related-Actions-/More-Options-Buttons wurden geoeffnet.
- Sichtbare Aktionskandidaten wurden gelesen und klassifiziert.
- Kein Menueeintrag und keine ausfuehrende Aktion wurde geklickt.

## Lernwert

Fuer die AfA-Klickanleitung reicht ein sichtbares `Preview Posting` im Post-Menue nicht. Erst muss klar sein, wo Business Central die AfA-Zeilen erzeugt oder berechnet. Dieser Lauf sucht deshalb nur nach dem Aktionspfad und trennt Navigation strikt von Ausfuehrung.

## Grenzen

- Keine AfA-Zeile angelegt.
- `Calculate Depreciation` nicht geklickt.
- `Preview Posting` nicht geklickt.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-241: review FA-240 action inventory because Calculate Depreciation was not found through safe non-executing dropdowns.
