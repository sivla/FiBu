# GOVERNANCE-009 - Autonomous Policy Sync

Stand: 2026-06-09

## Ziel

Autopilot V2.2 erlaubt kontrollierte autonome Laborbuchungen in `RM-DEMO`. Vor diesem Lauf war die Projektwahrheit uneinheitlich:

- `POSTING-AND-SETUP-GATES.md` enthaelt mehrere Gate-Zeilen mit Status `autonomous-allowed`.
- `AUTOPILOT-STATE.json` enthielt gleichzeitig `autonomousAllowed: []`.

Dieser Lauf synchronisiert nur die Governance-Wahrheit. Es wurde kein Business-Central-Lauf gestartet.

## Umgebung

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Arbeitstyp | Governance-/State-Sync |
| BC-Lauf | nein |
| Setup-Aenderung | nein |
| Buchung | nein |

## Entscheidung

`autonomousAllowed` ist jetzt im maschinenlesbaren State gefuellt. Das bedeutet nicht freie Buchungsautomatik. Es bedeutet:

1. Ein autonomer Laborfall muss in `POSTING-AND-SETUP-GATES.md` den Status `autonomous-allowed` haben.
2. Der Lauf braucht einen neuen fachlichen Evidence-Zweck.
3. Der Lauf muss im selben UI-Lauf die Vorbedingungen frisch pruefen.
4. Wo moeglich muss `Preview Posting`, `Journal Check` oder ein gleichwertiger Preflight belegt sein.
5. Nach einer Buchung muessen Belegnummer, Postenspur, Grenzen und Buchwirkung dokumentiert werden.
6. Bekannte Referenzbelege duerfen nicht wiederholt werden.

## Nicht Wiederholen

| Bereich | Referenz | Regel |
|---|---|---|
| O2C | `UAT-O2C-001` / `PS-INV103297` | Nicht erneut buchen; nur read-only nutzen, solange kein neuer Evidence-Zweck besteht. |
| P2P | Bestellung `106049` / Rechnung `108219` | Nicht erneut buchen; nur read-only nutzen, solange kein neuer Evidence-Zweck besteht. |
| Inventory | `INV008-899959` | Nicht erneut buchen; nur read-only nutzen, solange kein neuer Zielbestand-/Evidence-Zweck besteht. |
| Payments | `PAY011-PS103297` / `PS-INV103297` | Nicht wiederholen; Bankabstimmung, Kreditorenzahlung und weitere Zahlung nur mit neuem Gate/Zweck. |
| Reporting | `REPORTING-011` / `REPORTING-013` | Verbraucht und rejected; kein weiterer Analysis-View-Setup-Versuch ohne neues Gate und gescoptes New-/Kartenaktionsmuster. |
| Tax | `TAX-002` | Gate-Readiness erledigt; praktischer VAT19-Fit bleibt freigabepflichtig. |

## Buchwirkung

Fuer Anfaenger ist diese Trennung wichtig: Ein Autopilot darf in einer Sandbox lernen und bewusst Laborbelege buchen, aber nicht dieselben Referenzbelege immer wieder erzeugen. Sonst werden offene Posten, Lagerwerte, Ausgleichsstatus und Buchwahrheit unlesbar.

Das Buch soll autonome Laborbuchungen deshalb als kontrollierten Lernmodus erklaeren:

- erst lesen und pruefen,
- dann frischen UI-Preflight sichern,
- dann bewusst buchen,
- danach Posten und Grenzen erklaeren.

## Naechster Schritt

Ohne neues Setup-/Posting-Gate ist der naechste konkrete Schritt:

`BOOK-O2C-FOUNDATION-DRIFT-SYNC`

Dabei soll kein BC-Lauf gestartet werden. Ziel ist ein Buch-Sync der Foundation-/O2C-Stellen, die noch hinter `MASTERDATA-009`, der O2C-Laborbuchung `PS-INV103297`, offener deutscher VAT19-Wahrheit und Reporting-Limit zurueckliegen.
