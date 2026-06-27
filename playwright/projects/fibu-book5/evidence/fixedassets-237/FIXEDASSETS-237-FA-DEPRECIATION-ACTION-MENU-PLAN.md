# FIXEDASSETS-237 - AfA Action-Menue-Plan

Status: `local-plan`, `read-only-next`, `no-bc-run`, `no-playwright-run`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Basis | `FIXEDASSETS-236` |
| Ergebnis | Nur read-only Post-Dropdown-/Action-Menue-Aufklaerung wird freigegeben |
| Preview-only-Ausfuehrung | gesperrt |
| Buchung | gesperrt |

## Entscheidung

`FIXEDASSETS-236` beweist die Route `Fixed Asset G/L Journals` auf Page `5628`. Sichtbar waren Journalspalten, vorhandene Erwerbssignale und die Aktionen `Post` sowie `New`.

Nicht sichtbar waren:

- `Calculate Depreciation`
- `Preview Posting`
- `Post and Print`

Deshalb darf der naechste Live-Lauf keine AfA-Zeile erzeugen und keine Buchungsvorschau ausfuehren. Der kleinste sinnvolle Schritt ist nur eine read-only Aufklaerung des Aktionsmenues: das nicht-ausfuehrende Dropdown / die verwandten Aktionen bei `Post` oeffnen und die Menueintraege dokumentieren.

## Erlaubt fuer FA-238

- `Fixed Asset G/L Journals` read-only oeffnen.
- Instanz und Company pruefen.
- Nur den Dropdown-/Related-Actions-Button neben `Post` oeffnen.
- Menueeintraege lesen und klassifizieren.
- Sofort stoppen, wenn ein Dialog erscheint.
- Keine Menueaktion ausfuehren.

## Weiterhin verboten

- Hauptaktion `Post` klicken.
- `Preview Posting` klicken.
- `Calculate Depreciation` klicken.
- `Post and Print` klicken.
- Journalzeile anlegen, editieren oder loeschen.
- Dialog mit `OK`, `Yes`, `Ja`, `Post`, `Preview`, `Finish` bestaetigen.
- Setup aendern.
- Company wechseln.
- API-Abkuerzung nutzen.

## Anfaenger-Lernwert

Eine sichtbare Schaltflaeche `Post` ist in Business Central ein Gefahrensignal, kein Ziel. Bevor eine Anleitung eine Abschreibung erklaert, muss sie zeigen, ob die sichere Buchungsvorschau oder die Abschreibungsberechnung ueber ein Menue erreichbar ist. Dazu darf man ein Dropdown lesen, aber keinen ausfuehrenden Menuepunkt starten.

## Naechster Schritt

`FIXEDASSETS-238`: read-only Post-Dropdown-Menue inventarisieren. Keine Journalzeile, kein `Calculate Depreciation`, kein Preview Posting, kein `Post`.
