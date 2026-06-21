# FIXEDASSETS-193 Review: Post-Dropdown-Menue

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`, `no-preview`, `no-posting`, `not-final`.

## Geprueft

Review der FA-192-Evidence:

- `FIXEDASSETS-192-result.json`
- `020-post-dropdown-menu-inventory.json`
- `FIXEDASSETS-192-learning.md`

## Befund

FA-192 hat genau einen Split-/Dropdown-Button `Verwandte Aktionen fuer Post` im Fixed Asset G/L Journal gefunden und nur diesen Button geklickt.

Nach dem Oeffnen des Menues war ein einzelner `Preview Posting`-Kandidat sichtbar:

- Tag: `button`
- Rolle: `menuitem`
- Text: `Preview Posting`
- Aria-Label: `Preview Posting`
- Titel: `Review the different types of entries that will be created when you post the document or journal. (Ctrl+Alt+F9)`
- Disabled: `false`

Im gleichen Menue waren auch `Post`, `Post and Print` und `Test Report...` sichtbar. Deshalb bleibt der normale Buchungspfad gesperrt.

## Entscheidung

Ein separater Preview-Posting-only-Folgecase ist vertretbar, weil der Preview-Kandidat:

- eigenstaendig als `button[role=menuitem]` sichtbar war,
- eindeutig `Preview Posting` hiess,
- nicht mit dem Hauptbutton `Post` identisch ist,
- im FA-192-Lauf nicht ausgefuehrt wurde.

## Grenzen

- Keine neue BC-Ausfuehrung in FA-193.
- Kein Playwright-Lauf in FA-193.
- `Preview Posting` wurde noch nicht geklickt.
- Keine Preview-Postenzeilen oder Preview-Fehlermeldung.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster sicherer Schritt

`FIXEDASSETS-194` darf einen eng begrenzten Live-Versuch planen:

1. Fixed Asset G/L Journal in `MCP_1_20260210` / `RM-DEMO` oeffnen.
2. Nur den Splitbutton `Verwandte Aktionen fuer Post` oeffnen.
3. Nur den exakten `Preview Posting`-Menuepunkt klicken.
4. Keine `Post`-, `Post and Print`-, `OK`- oder `Yes`-Bestaetigung.
5. Ergebnis als Preview-Evidence oder Fehlerbild sichern.
