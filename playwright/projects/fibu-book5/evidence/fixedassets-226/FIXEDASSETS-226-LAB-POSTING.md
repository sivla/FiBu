# FIXEDASSETS-226 - Controlled FA G/L Journal Lab Posting

| Pruefpunkt | Ergebnis |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Gebucht | ja |
| G/L Trace sichtbar | ja: `G05001`, `82000`, `12210`, `+/-120.000,00` |
| FA Ledger Trace sichtbar | nein: versuchter Pfad fuehrte auf leere `FA Ledger Entries Preview`-Ansicht |
| Status | gebucht, aber Anlagenposten-Trace blockiert; CRONUS-USA-Labor, kein deutscher Finalnachweis |

## Lernwert

Preview Posting zeigt vor der Buchung die erwartete Wirkung. Erst die anschliessende Postenspur beweist, dass Business Central tatsaechlich Sachposten und Anlagenposten erzeugt hat.

FA-226 beweist bereits die kontrollierte Laborbuchung und die Sachpostenspur: Business Central hat zu `G05001` Sachposten auf `82000` und `12210` erzeugt. Der Anlagenposten ist fachlich weiterhin zu erwarten, aber noch nicht book-ready nachgewiesen. Der Versuch ueber Page `5606` ist als rejected path zu behandeln, weil dort `FA Ledger Entries Preview` und keine Zeilen sichtbar waren.

## Grenzen

- Keine deutsche 19-%-USt.
- Kein deutscher Kontenplan-Endstand.
- Keine Abschreibungsbuchung.
- Keine Wiederholung der Buchung ohne neuen Case.
- Kein finaler Anlagenposten-Screenshot: `FIXEDASSETS-227` muss den gebuchten Anlagenposten read-only finden.

## Naechster Schritt

FIXEDASSETS-227: read-only den gebuchten Anlagenposten zu `G05001`/`FA-CNC-01` suchen. Keine erneute Buchung, kein Preview Posting, keine Journal-Aenderung.
