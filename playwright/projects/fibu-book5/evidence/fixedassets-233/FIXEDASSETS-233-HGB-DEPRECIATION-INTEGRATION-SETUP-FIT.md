# FIXEDASSETS-233 HGB Depreciation G/L Integration Setup-Fit

Status: `labor`, `ui-first`, `setup-fit`, `single-field`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Case | FIXEDASSETS-233-HGB-DEPRECIATION-INTEGRATION-SETUP-FIT |
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Zielobjekt | Depreciation Book `HGB` |
| Zielfeld | G/L Integration - Depreciation |
| Ergebnis | setup-fit-applied |
| Vorher | false |
| Nachher | true |
| Preview Posting | nein |
| Buchung | nein |

## Ergebnis

FA-233 set HGB G/L Integration - Depreciation to on through one UI-first checkbox action; no Preview Posting or Post occurred.

## Anfaenger-Lernwert

- `G/L Integration - Depreciation` ist ein Setup-Schalter im AfA-Buch, keine Journalzeile.
- Dieser Schalter beeinflusst, ob Abschreibungen mit der Finanzbuchhaltung integriert werden.
- Ein Setup-Fit darf nur ein klar identifiziertes Feld aendern; andere G/L-Integration-Felder bleiben unberuehrt.
- Nach einem Setup-Fit braucht es einen separaten Preview-Posting-only Lauf. Ein Fit ist noch keine Buchung.

## Playwright-Lernpunkt

Der eigentliche Setup-Nachweis beruht auf dem eindeutig gemappten Checkbox-Control: vorher `false`, nachher `true`. Der Edit-Mode-Helfer meldete in der technischen Evidence einen breiten Kandidaten. FA-234 soll deshalb pruefen, ob kuenftige Setup-Fit-Tests den Edit-Mode-Schritt ueberspringen, wenn das Zielfeld bereits editierbar ist.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher HGB-/Steuer-/Kontenplan-Finalnachweis.
- Kein FA Journal, keine Preview-Zeilen, keine FA Ledger Entries.
- Kein Post.

## Naechster Schritt

FIXEDASSETS-234: locally review FA-233 setup-fit evidence before any Preview Posting-only retry.
