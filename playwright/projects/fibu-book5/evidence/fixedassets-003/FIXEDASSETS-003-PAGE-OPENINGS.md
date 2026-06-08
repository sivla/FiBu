# FIXEDASSETS-003 Zielseiten read-only oeffnen

Status: `labor-candidate`, `read-only`, `no-posting`, `no-setup-change`, `not-final`.

## Zweck

FIXEDASSETS-001/002 haben Suchpfade belegt. Dieser Lauf prueft, ob daraus direkte, robuste Zielseiten fuer die spaetere bebilderte Klickanleitung werden koennen.

## Ergebnis

| Zielseite | Page-ID | Status | Buchwirkung |
|---|---:|---|---|
| Fixed Assets / Anlagenliste | 5601 | labor-candidate | Candidate fuer spaetere Klickanleitung; noch kein Setup-/Buchungsbeweis. |
| Depreciation Books / AfA-Buecher | 5611 | labor-candidate | Candidate fuer spaetere Klickanleitung; noch kein Setup-/Buchungsbeweis. |
| FA Posting Groups / Anlagenbuchungsgruppen | 5606 | rejected | Nicht als Buchbild nutzen; alternativen UI-/Tell-Me-Pfad suchen. |
| Purchase Invoices / Einkaufsrechnungen | 9308 | labor-candidate | Candidate fuer spaetere Klickanleitung; noch kein Setup-/Buchungsbeweis. |
| FA Ledger Entries / Anlagenposten | 5604 | labor-candidate | Candidate fuer spaetere Klickanleitung; noch kein Setup-/Buchungsbeweis. |

## Was Anfaenger daraus lernen

- Anlagenbuchhaltung startet nicht mit einer Buchung, sondern mit mehreren Setup- und Nachweisseiten.
- Eine Anlagenkarte ist Stammdatum; AfA-Buch und Anlagenbuchungsgruppe steuern Bewertung und Kontenfindung.
- Einkaufsrechnung oder Anlagenjournal erzeugen spaeter den Zugang; Anlagenposten und Sachposten beweisen die Wirkung.
- Read-only Zielseiten sind nur Navigationsevidence, noch keine Prozessfreigabe.

## Grenzen

- CRONUS-USA-Labor, gemischte UI, kein deutscher HGB-/Kontenplan-Endstand.
- Keine Anlage `FA-CNC-01`, kein `HGB`, kein `MACHINES`, keine Einkaufsrechnung, keine AfA, keine Buchung.

## Naechster Schritt

FIXEDASSETS-004 als UI-first Setup-Readiness nur fuer die geoeffneten Zielseiten planen: Anlagenkarte FA-CNC-01, AfA-Buch, FA Posting Group und Zugangspfad getrennt pruefen; noch keine Buchung ohne Preview/Postenspur-Plan.
