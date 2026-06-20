# FIXEDASSETS-147 - Posting Group Edit-Modus-Affordance no-save

Status: `labor`, `ui-first`, `no-save`, `affordance-probe`, `no-setup-change`, `no-preview`, `no-posting`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Edit-Modus geklickt | nein |
| Posting Group vor Probe | EQUIPMENT |
| Posting Group nach Probe | EQUIPMENT |
| Feldnahes Affordance gefunden | ja |

## Ergebnis

FA-147 opened FA-CNC-01, inspected Posting Group affordances, and confirmed Posting Group stayed EQUIPMENT. Edit action clicked=false; field-local affordance found=true.

## Anfaenger-Lernwert

- Ein separat gefundener Edit-Button ist nicht zwingend noetig, wenn das Feld bereits als Combobox/Lookup-Feld sichtbar und fokussierbar ist.
- Ein Edit-Modus oder eine sichtbare Combobox allein ist noch kein Speichern und kein Setup-Fit.
- Bei Lookup-/Combobox-Feldern muss zuerst der richtige feldnahe Hebel identifiziert werden.
- `MACHINES` zaehlt erst, wenn der Wert bewusst ausgewaehlt, gespeichert und nach dem Neuoeffnen sichtbar ist.
- Dieser Lauf prueft nur Bedienbarkeit und Screenshot-Kontext, nicht den Zielwert.

## Grenzen

- Keine Auswahl von `MACHINES`.
- Keine gespeicherte Aenderung.
- Keine Anschaffung, keine Preview, keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-148-FA-CNC-01-POSTING-GROUP-AFFORDANCE-RESULT-REVIEW
