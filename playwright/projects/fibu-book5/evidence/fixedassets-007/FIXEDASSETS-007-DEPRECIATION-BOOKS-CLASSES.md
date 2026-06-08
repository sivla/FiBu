# FIXEDASSETS-007 AfA-Buecher und Anlagenklassen read-only

Status: `labor`, `read-only`, `setup-preparation`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Relevantes Gate | `FIXEDASSETS-004-SETUP-OR-POSTING` locked |
| Setup-Aenderung | nein |
| Buchung | nein |

## Depreciation Books / AfA-Buecher

| Code | sichtbarer Kontext |
|---|---|
| COMPANY | COMPANY Company Book on |

HGB sichtbar: nein.

## Fixed Asset Classes / Anlagenklassen

| Code | sichtbarer Kontext |
|---|---|
| INTANGIBLE | INTANGIBLE InTangible on |
| TANGIBLE | TANGIBLE Tangible on |
| FINANCIAL | FINANCIAL Financial on |

Klassenkontext sichtbar: ja.

## Fachliche Einordnung

AfA-Buecher steuern in Business Central, nach welchen Bewertungs- und Abschreibungsregeln eine Anlage gefuehrt wird. Anlagenklassen gruppieren Anlagen fachlich vor, ersetzen aber nicht die Anlagenbuchungsgruppe: Die Kontenfindung fuer Zugang, Buchwert und AfA bleibt ueber `FA Posting Groups` getrennt.

Dieser Lauf liest nur vorhandene CRONUS-Strukturen. Er beweist nicht, dass das Buchziel `HGB`, `MACHINES` oder `FA-CNC-01` bereits eingerichtet ist.

## Buchwirkung

Kapitel 21 sollte Anfaengern die Reihenfolge erklaeren: erst AfA-Buch, Klasse/Unterklasse und Anlagenbuchungsgruppe verstehen, dann Zielstammdaten planen, danach erst Anlagenzugang oder AfA buchen.

## Grenzen

- CRONUS-USA-Labor, kein deutscher HGB-Endstand.
- Kein AfA-Buch und keine Anlagenklasse wurden angelegt oder bearbeitet.
- Keine Anlage `FA-CNC-01`, keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten.
- `FIXEDASSETS-004-SETUP-OR-POSTING` bleibt gesperrt.

## Naechster Schritt

Without gate: Kapitel-21-Buch-Sync/Checkliste fuer Anlagen-Setup-Reihenfolge aus FIXEDASSETS-005 bis 007 ergaenzen. With gate: idempotenten UI-Setup-Fit fuer HGB/MACHINES/FA-CNC-01/K30000 planen; Buchung weiterhin separat freigeben.
