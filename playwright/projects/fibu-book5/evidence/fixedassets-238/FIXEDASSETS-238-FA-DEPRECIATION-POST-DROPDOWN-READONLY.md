# FIXEDASSETS-238 - FA Post-Dropdown Read-only

Status: `read-only`, `menu-inventory`, `no-menuitem-click`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Dropdown geoeffnet | ja |
| Preview Posting gefunden | ja |
| Calculate Depreciation gefunden | nein |
| Post gefunden | ja |
| Resultat | observed |

## Was geprueft wurde

- Fixed Asset G/L Journals wurde read-only geoeffnet.
- Nur der kleine Related-Actions-/Dropdown-Button neben `Post` wurde geoeffnet.
- Menueeintraege wurden gelesen und klassifiziert.
- Kein Menueeintrag wurde geklickt.

## Lernwert

Split-Buttons sind in Business Central ein zentrales Sicherheitsmuster. Der Hauptbutton `Post` fuehrt aus; der kleine Dropdown-/Related-Actions-Teil kann Optionen anzeigen. Fuer Klickanleitungen muss genau dieser Unterschied sichtbar werden, bevor eine Buchungsvorschau oder Buchung ueberhaupt geplant wird.

## Grenzen

- Keine AfA-Zeile.
- Kein `Calculate Depreciation`.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-239: locally decide if the discovered Preview Posting menu item can be clicked in a later guarded Preview-only run.
