# P2P-019 Purchase Journal Clean Preview Gate

Status: `execute-attempt`, `journal-check-real-errors`, `preview-blocked`, `no-posting`, `needs-german-final-rebuild`.

Document No.: `P2P019-328516`

## Ergebnis

- Strenge Journal-Check-Auswertung aktiv: ja
- Journal Check sauber: nein
- Echte Fehler sichtbar:
  - Amount must be negative
  - Document No. ist um 2.500 unausgeglichen
  - Gen. Posting Type / Gen. Bus. Posting Group / Gen. Prod. Posting Group muessen fuer diese Vendor-Zeile leer sein
- Preview Posting geoeffnet: nein
- Cleanup bewiesen: ja

## Grenze / Fallback

Keine Buchung, kein deutscher Finalnachweis. P2P-020 darf diese Route nicht posten; sinnvoll ist eine korrekte Gegenzeile oder ein Wechsel auf Purchase Invoice/Payment-Route.
