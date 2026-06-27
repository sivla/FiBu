# FIXEDASSETS-242 - Fixed Assets / FA-CNC-01 Depreciation Action Inventory Read-only

Status: `read-only`, `fixed-asset-card`, `action-inventory`, `no-executing-action-click`, `no-calculate-depreciation`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Resultat | observed |
| Kartenkontext sichtbar | ja |
| Dropdown-Versuche | 1 |
| Calculate Depreciation gefunden | nein |
| Preview Posting gefunden | nein |

## Was geprueft wurde

- Die bestehende Anlagenkarte `FA-CNC-01` wurde direkt ueber Page `5600` read-only geoeffnet.
- Nur nicht-ausfuehrende Aktionsbereiche wie More Options/Related/Process wurden geoeffnet, sofern der Button selbst nicht wie eine ausfuehrende Aktion aussah.
- Sichtbare Aktionskandidaten wurden gelesen und klassifiziert.
- Kein Menueeintrag und keine ausfuehrende Aktion wurde geklickt.

## Lernwert

Business Central trennt die Anlagenkarte, Journale und Stapelaktionen fachlich deutlich. Fuer die AfA-Anleitung muss deshalb erst sichtbar nachgewiesen werden, auf welcher Page `AfA berechnen` erreichbar ist. Sichtbarkeit ist noch keine Freigabe zur Ausfuehrung.

## Grenzen

- `Calculate Depreciation` wurde nicht geklickt.
- Keine AfA-Zeile angelegt.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-243: review the Fixed Assets card/list inventory and choose the next distinct AfA route without repeating journal/card dropdown probing.
