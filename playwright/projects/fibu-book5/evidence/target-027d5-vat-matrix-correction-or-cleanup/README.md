# TARGET-027D5 VAT Matrix Correction or Cleanup

Instanz: playthru
Company: UNIVERSAARL-DE

## Entscheidung

Die bestehende partielle `INLAND`/`VAT19`-Zeile wird nicht geloescht. Der Lauf versucht eine Korrektur nur dann, wenn vor der Eingabe ein echter aktiver Editor erkannt wird.

## Ergebnis

VAT matrix correction remains blocked: No true active editor detected for sales-vat-account; refusing to type 3806.; No true active editor detected for purchase-vat-account; refusing to type 1406.

## Grenzen

- Keine Stammdaten.
- Kein Belegdraft.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine VAT Entries oder Sachposten.
- Keine finale deutsche USt- oder Compliance-Behauptung.
