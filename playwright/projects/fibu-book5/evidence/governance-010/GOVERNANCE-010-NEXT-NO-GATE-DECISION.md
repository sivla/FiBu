# GOVERNANCE-010 Next No-Gate Decision

Status: `governance`, `no-bc-run`, `no-setup-change`, `no-posting`, `no-payment`, `no-bank-reconciliation`, `no-company-switch`.

| Feld | Wert |
|---|---|
| Datum | 2026-06-09 |
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Ausgeloest durch | `BOOK-REPORTING-UAT-K25-SYNC` ist erledigt; `AUTOPILOT-STATE.json` fordert `GOVERNANCE-010-NEXT-NO-GATE-DECISION` |
| BC-Lauf | nein |
| Setup-Aenderung | nein |
| Buchung/Zahlung | nein |
| Company-Wechsel | nein |

## Entscheidung

Der naechste No-Approval-Schritt ist:

```text
FIXEDASSETS-009-SETUP-GATE-READINESS
```

Dieser Schritt soll keinen BC-Lauf starten und nichts einrichten. Er soll die vorhandene Evidence `FIXEDASSETS-001` bis `FIXEDASSETS-008` konsolidieren und daraus ein eng gescoptes UI-first Gate formulieren fuer:

- Anlage `FA-CNC-01`
- AfA-Buch `HGB`
- Anlagenbuchungsgruppe `MACHINES`
- Kreditor `K30000`
- spaetere getrennte Freigabe fuer Zugang/AfA-Buchung

## Warum nicht Reporting?

Reporting ist fachlich wichtig, aber aktuell gesperrt. `REPORTING-011` und `REPORTING-013` haben die freigegebenen Analysis-View-Hebel verbraucht und rejected geschlossen. `REPORTING-013` belegt Feldpositionen auf der bestehenden `REVENUE`-Karte, aber `New/Neu` ist in Business Central global mehrdeutig. Ein weiterer Analysis-View-Fit braucht ein neues Gate mit gescoptem New-/Kartenaktionsmuster oder einen alternativen offiziellen Standardpfad.

Ohne dieses Gate darf keine Financial-Reports-Summenwirkung nach `PRODUCTLINE`/`CHANNEL` behauptet und kein `RM-PLCH`-Setup versucht werden.

## Warum nicht VAT19?

`TAX-002` hat nur Freigabe- und Stop-Kriterien vorbereitet. Der praktische deutsche `19 %`-VAT-Fit bleibt gesperrt. CRONUS-USA-Laborbelege zeigen weiter `0 %` Sales Tax und beweisen keinen deutschen VAT-Endstand.

## Warum nicht Payments/Bank?

Die Debitorenzahlung `PAY011-PS103297` ist erledigt und darf nicht wiederholt werden. Bank Account Ledger Entries sind seit `PAYMENTS-013` ueber Page `372` belegt. Bankabstimmung, Kreditorenzahlung oder weitere Payment-Varianten brauchen einen neuen Zweck oder ein neues Gate.

## Warum Fixed Assets?

Kapitel 21 ist fachlich der naechste grosse Finance-Block, und die Readiness-Kette ist bereits vorhanden:

| Evidence | Befund |
|---|---|
| `FIXEDASSETS-004` | `FA-CNC-01`, `HGB`, `MACHINES` und `K30000` sind nicht sichtbar; Einkaufsrechnungspfad ist erreichbar |
| `FIXEDASSETS-005` | `FA Posting Groups` ist als UI-Pfad erreichbar; `MACHINES` fehlt |
| `FIXEDASSETS-006` | vorhandene CRONUS-FA-Posting-Groups und Konten wurden read-only gelesen; kein Konto wurde geraten |
| `FIXEDASSETS-007` | Depreciation Book `COMPANY` ist sichtbar, `HGB` nicht; FA Classes `FINANCIAL`, `INTANGIBLE`, `TANGIBLE` sind sichtbar |
| `FIXEDASSETS-008` | Kapitel 21 trennt Buchziel und Laborstand; Setup und Buchung bleiben gesperrt |

Der Mehrwert fuer Anfaenger ist hoch: Anlagenbuchhaltung zeigt exemplarisch, warum Business Central vor einer Buchung Stammdatum, AfA-Buch, Anlagenbuchungsgruppe, Kreditor/Einkaufsweg, Vorschau und Postenspur als getrennte Schichten braucht.

## Scope fuer den naechsten Lauf

`FIXEDASSETS-009-SETUP-GATE-READINESS` darf:

- vorhandene Fixed-Assets-Evidence und Kapitel 21 erneut gezielt auswerten
- eine Setup-Reihenfolge und Stop-Kriterien formulieren
- ein enges Gate fuer einen spaeteren UI-first Setup-Fit vorbereiten
- Current State, Backlog, Gate-Datei und Coverage synchronisieren

`FIXEDASSETS-009-SETUP-GATE-READINESS` darf nicht:

- Business Central oeffnen
- `FA-CNC-01`, `HGB`, `MACHINES` oder `K30000` anlegen
- Konten raten oder setzen
- eine Einkaufsrechnung, einen Anlagenzugang oder AfA buchen
- deutschen HGB-/Kontenplan-Endstand behaupten

## Buchwirkung

Kapitel 21 bleibt ein Zielprozess. Der naechste Schritt soll daraus kein sofortiges Prozessskript machen, sondern die fehlenden Voraussetzungen in eine sichere Gate-Struktur ueberfuehren. Erst danach kann ein praktischer UI-first Setup-Fit geplant werden; die Buchung selbst bleibt ein separater Gate- und Evidence-Schritt.

## Naechster konkreter Schritt

```text
FIXEDASSETS-009-SETUP-GATE-READINESS: kein BC-Lauf; konsolidiere FIXEDASSETS-001 bis FIXEDASSETS-008 und formuliere ein eng gescoptes UI-first Setup-Gate fuer MACHINES, HGB, FA-CNC-01 und K30000, ohne Einrichtung, Buchung, Zahlung, Bankabstimmung oder Company-Wechsel.
```
