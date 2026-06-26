# FIXEDASSETS-208 HGB Acq. Cost G/L Integration Setup-Fit

Status: `labor`, `ui-first`, `setup-fit`, `single-field`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Case | FIXEDASSETS-208-HGB-ACQ-COST-GL-INTEGRATION-SETUP-FIT |
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Zielobjekt | Depreciation Book `HGB` |
| Zielfeld | G/L Integration - Acq. Cost |
| Ergebnis | setup-fit-applied |
| Vorher | false |
| Nachher | true |
| Preview Posting | nein |
| Buchung | nein |

## Ergebnis

FA-208 set HGB G/L Integration - Acq. Cost to on through one UI-first checkbox action; no Preview Posting or Post occurred.

## Anfaenger-Lernwert

- `G/L Integration - Acq. Cost` ist ein Setup-Schalter im AfA-Buch, keine Journalzeile.
- Dieser Schalter beeinflusst, ob Anschaffungskosten mit der Finanzbuchhaltung integriert werden.
- Ein Setup-Fit darf nur ein klar identifiziertes Feld aendern; andere G/L-Integration-Felder bleiben unberuehrt.
- Nach einem Setup-Fit braucht es einen separaten Preview-Posting-only Lauf. Ein Fit ist noch keine Buchung.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher HGB-/Steuer-/Kontenplan-Finalnachweis.
- Kein FA Journal, keine Preview-Zeilen, keine FA Ledger Entries.
- Kein Post.

## Naechster Schritt

FIXEDASSETS-209: locally review FA-208 setup-fit evidence before any Preview Posting-only retry.
