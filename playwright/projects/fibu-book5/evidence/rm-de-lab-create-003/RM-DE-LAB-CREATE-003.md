# RM-DE-LAB-CREATE-003 Create New Company Action Route

Status: `blocked`, `company-create-route-gate`, `needs-german-final-rebuild`.

## Zweck

`RM-DE-LAB-CREATE-002` zeigte, dass direkte Listenzeilen-Anlage blockiert ist und BC den `Create New Company`-/Assisted-Setup-Pfad verlangt. Dieser Lauf prueft genau diesen Pfad, ohne einen unbekannten Wizard abzuschliessen.

## Ergebnis

| Feld | Wert |
|---|---|
| Create-New-Company-Aktion geklickt | nein |
| Wizard-/Assisted-Kontext sichtbar | nein |
| Routenentscheidung | Create New Company action was not visible/clickable from Page 357 start context. Do not edit list row again; use scoped action/menu discovery or park RM-DE-LAB. |

## Grenzen

- Es wurde keine Company gespeichert oder gewechselt.
- Es wurde kein unbekannter Wizard final bestaetigt.
- Kein Setup, kein Posting, kein Preview Posting und kein API-Shortcut.
- RM-DEMO bleibt Labor; deutsche Zielcompany muss spaeter neu/final belegt werden.
