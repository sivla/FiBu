# PAYMENTS-010 Book Sync

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Status | labor, UI-only, book-sync, no-payment |
| Grundlage | `PAYMENTS-010-result.json`, `PAYMENTS-010-POSTING-READINESS.md` |
| Buchstelle | Kapitel 19/20 Zahlungseingang und OP-Ausgleich |

## Synchronisierte Buchwahrheit

`PAYMENTS-010` beweist nicht die Zahlung. Der Lauf beweist die Sicherheitsgrenze unmittelbar davor:

- Cash Receipt Journal ist mit `D10000`, `PS-INV103297`, Betrag `-68.000,00` und `BANK-RM-01` vorbereitet.
- `Journal Check` zeigt `0 Issues Total`.
- `Apply Entries` ist read-only erreichbar und zeigt den Rechnungsbezug.
- `Preview Posting` ist im aktuellen Journal nicht direkt sichtbar.
- `Post` oeffnet einen Dialog mit `Ja` und `Nein`.
- `Nein` bricht ab; der Draft bleibt sichtbar und wird danach geloescht.

## Buchwirkung

Die alte Uebungslogik darf nicht so gelesen werden, als sei die Zahlung bereits praktisch belegt. Fuer das Buch wird getrennt:

- deutsches Zielbeispiel: `SO-1001`, `80.920 EUR`, deutsche 19-%-USt, final offen;
- aktueller Laborbeleg: `PS-INV103297`, `68.000 EUR`, CRONUS-USA-Steuergrenze, Zahlung noch nicht gebucht;
- gesicherter Klickpfad: Zahlungsjournal vorbereiten, Apply-Bezug pruefen, Journal Check lesen, Post-Dialog sehen, mit `Nein` abbrechen.

## Anfaenger-Lernwert

Ein sichtbarer `Post`-Button ist noch keine Zahlung. Auch ein geoeffneter Bestaetigungsdialog ist noch keine Zahlung. Die Buchung entsteht erst durch die bewusste Bestaetigung mit `Ja`. Bis dahin ist der Schritt ein Pruef- und Freigabepunkt.

## Naechster Schritt

`PAYMENTS-011` darf nur nach ausdruecklicher Freigabe als kontrollierte Laborzahlung laufen. Ohne Freigabe bleibt der naechste sinnvolle Schritt ein didaktischer Evidence-Pack-/Buchabgleich fuer Payments und OP-Ausgleich.
