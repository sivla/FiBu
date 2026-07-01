# TARGET-027D17-VAT-MATRIX-FIRST-FIELDS-LOOKUP-DISCOVERY

Instanz: playthru
Company: UNIVERSAARL-DE

## Smart Decision

D17 untersucht nur, ob die ersten beiden Felder der MwSt.-Buchungsmatrix echte Lookup-, Detail- oder Auswahlcontrols haben. Der Lauf darf keine Zielwerte tippen oder auswaehlen.

## Ergebnis

D17 did not prove a safe lookup/select route; future work should avoid another Page-472 grid write attempt.

## Grenzen

- Keine INLAND/VAT19-Werteingabe.
- Keine INLAND/VAT19-Auswahl.
- Keine 19/3806/1406-Werteingabe.
- Kein Delete.
- Keine Stammdaten.
- Kein Belegdraft.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine finale deutsche USt- oder Compliance-Behauptung.
