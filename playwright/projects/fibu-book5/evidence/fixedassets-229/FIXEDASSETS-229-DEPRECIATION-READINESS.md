# FIXEDASSETS-229 - FA-CNC-01 Depreciation Readiness Gate

Status: `labor`, `read-only`, `readiness-gate`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | `FA-CNC-01` |
| Erwerbsbeleg | `G05001` |
| Resultat | blocked |
| AfA-Readiness | blocked-readonly-readiness-incomplete |

## Was geprueft wurde

- Anlagenkarte `FA-CNC-01` read-only.
- `HGB`-Depreciation-Book-Kontext read-only.
- Gebuchte Anlagenposten zu `FA-CNC-01`/`G05001` read-only.
- Keine Journalzeile, kein Preview Posting, keine Buchung und kein Setup-Fit.

## Ergebnis

- FA-CNC-01 ist auf der Anlagenkarte sichtbar.
- Book-Value-/Betragssignale zeigen, dass der Zugang im Kartenkontext angekommen ist.
- Gebuchte Anlagenposten zeigen FA-CNC-01, G05001 und Acquisition Cost.

## Anfaenger-Lernwert

Eine Anlage ist nach dem Zugang nicht automatisch bereit fuer eine Abschreibungsbuchung im Buch. Vor einem AfA-Journal muss man mindestens drei Dinge getrennt lesen: die Anlagenkarte, das AfA-Buch und die vorhandenen Anlagenposten. Erst wenn Anschaffungswert, AfA-Buch und Anlagenposten zusammenpassen, darf ein spaeterer AfA-Preflight geplant werden.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Kein AfA-Journal und keine AfA-Buchung.
- Keine Steuer-/Compliance- oder Jahresabschlusswirkung.
- Keine Aussage, dass die Abschreibung fachlich richtig gerechnet wurde.

## Naechster Schritt

FIXEDASSETS-230: locally review the read-only depreciation readiness blocker before any depreciation preflight.
