# PREP-039 Company Creation Splitbutton Route Correction

Status: `prep-done`

Instanzgrenze: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

## Zweck

Dieser PREP-Lauf korrigiert die aktive Company-Creation-Route vor dem naechsten Rechte-Lauf.

Der naechste wirksame Versuch darf nicht wieder den Hauptbutton `Neu` als gefuehrten Anlageweg behandeln. Ziel ist:

```text
Mandanten -> Pfeil neben Neu -> Neues Unternehmen erstellen
```

## Ergebnis

- `BC-ACTION-ATLAS.md` enthaelt eine PREP-039-Korrektur oberhalb der alten Action-Tabelle.
- Der Company-Creation-Buchdraft erklaert den Unterschied zwischen Hauptbutton, Pfeil und Menueintrag.
- Das Resume-Runbook markiert den Hauptbutton `Neu` als Nicht-Ziel fuer den naechsten Lauf.
- Die Super-Permissions-Checkliste verlangt den Klick auf den Menueintrag selbst.

## Grenzen

- Kein Business Central geoeffnet.
- Kein Playwright gestartet.
- Keine Company erstellt.
- Keine Datenbasis beobachtet.
- Keine Rechte getestet.
