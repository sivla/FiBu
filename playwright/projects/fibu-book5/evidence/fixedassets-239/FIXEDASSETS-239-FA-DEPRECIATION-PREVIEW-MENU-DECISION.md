# FIXEDASSETS-239 - AfA Preview-Menue-Entscheidung

Status: `local-decision`, `no-bc-run`, `no-playwright-run`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Basis | `FIXEDASSETS-238` |
| `Preview Posting` sichtbar | ja, im `Post`-Dropdown |
| `Calculate Depreciation` sichtbar | nein |
| AfA-Journalzeile | nicht erzeugt |
| Entscheidung | kein AfA-Preview-only-Lauf |

## Entscheidung

`FIXEDASSETS-238` hat `Preview Posting` als Menuepunkt im `Post`-Dropdown sichtbar gemacht. Das ist ein wichtiger Navigationsnachweis, aber noch keine AfA-Readiness.

Der Preview-only-Klick bleibt gesperrt, weil:

- keine Abschreibungszeile erzeugt wurde,
- `Calculate Depreciation` nicht sichtbar oder nachgewiesen ist,
- `Preview Posting` aktuell nur den allgemeinen Journal-Kontext betreffen wuerde,
- eine Vorschau ohne klaren AfA-Beleg fuer das Buch verwirrend waere.

## Naechster erlaubter Schritt

`FIXEDASSETS-240` darf nur ein erweitertes read-only Action-Inventar auf `Fixed Asset G/L Journals` ausfuehren. Ziel ist, `Calculate Depreciation` oder einen anderen AfA-spezifischen Pfad sichtbar zu finden.

## Weiterhin gesperrt

- `Preview Posting` klicken.
- `Post` oder `Post and Print` klicken.
- `Calculate Depreciation` klicken.
- Journalzeile anlegen, editieren oder loeschen.
- Setup aendern.
- Company wechseln.

## Anfaenger-Lernwert

Eine Buchungsvorschau ist nur dann hilfreich, wenn klar ist, welcher Beleg oder welche Journalzeile geprueft wird. Ein sichtbarer `Preview Posting`-Menuepunkt ist daher nur eine Navigations-Evidence. Fuer eine Abschreibungsanleitung muss vorher klar sein, wie Business Central die Abschreibungszeile erzeugt.
