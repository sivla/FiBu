# FIXEDASSETS-251 Request-Parameterdiagnose

Status: `labor`, `read-only`, `request-page`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

- Umgebung: `MCP_1_20260210`
- Company: `RM-DEMO`
- Request Page sichtbar: ja
- OK sichtbar, aber nicht bestaetigt: ja
- Depreciation Book Signal: kein eindeutiger Wert extrahiert
- Posting Date Signal: kein eindeutiger Wert extrahiert
- Document No. Signal: kein eindeutiger Wert extrahiert
- Unbeschriftetes FADEP-Wertsignal: FADEP-20260627-2158
- Zuletzt verwendete Optionen/Filter sichtbar: ja
- Filter-/Tage-/Optionssignal sichtbar: ja

## Lernbefund

- BC-Request-Pages koennen zuletzt verwendete Optionen und Filter wieder anzeigen.
- Ein sichtbarer Wert ist fuer Evidence nur dann feldsicher, wenn Playwright ihn eindeutig einem Feld zuordnen kann.
- Fuer eine Wiederholung von `Calculate Depreciation` reicht ein sichtbares `FADEP-*`-Signal allein nicht aus; Buch, Datum, Filter und Zielanlage muessen vor `OK` eindeutig geklaert werden.

## Grenzen

- Kein `OK` auf `Calculate Depreciation`.
- Keine AfA berechnet.
- Keine Journalzeile erzeugt.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-252: locally decide whether a repeat Calculate Depreciation execution is justified and which corrected parameters are required; no repeat OK until that decision exists.
