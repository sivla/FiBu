# FIXEDASSETS-114 - Anlagenzugangsroute neu geplant

Status: `labor`, `local-analysis`, `no-bc-run`, `no-playwright-run`, `no-posting`

## Entscheidung

Der naechste Anlagenzugangsversuch laeuft nicht weiter ueber die aktuelle FA-G/L-Journal-Active-Cell-Route. Diese Route ist nach `FIXEDASSETS-113` fuer Werteingabe blockiert/rejected, weil keine sicheren editierbaren Controls fuer Betrag oder Gegenkonto bewiesen wurden und der Fokusversuch in `FIXEDASSETS-112` Page-/Zielzeilen-Signale verlor.

Die naechste sinnvolle Route ist wieder die Einkaufsrechnung, aber nur als enger UI-Faehigkeitsnachweis fuer den Zeilentyp.

## Bewertete Routen

| Route | Befund | Entscheidung |
|---|---|---|
| `Acquire`-Aktion auf der Anlagenkarte | Aktion war sichtbar, aber disabled. Der fachliche Grund ist nicht ausreichend bewiesen. | Spaeterer Debugging-/Page-Inspection-Hebel, nicht naechster Zugangspfad. |
| FA-G/L Journal | Zielzeilen-Shell teilweise sichtbar, aber Betrag/Gegenkonto nicht sicher schreibbar. Active-cell/Koordinatenroute rejected. | Fuer Werteingabe, Preview und Buchung gesperrt. |
| Purchase Invoice | Card-/Lines-Kontext ist durch `FIXEDASSETS-060` belegt. Blocker ist wiederholt der Zeilentyp `Fixed Asset`. | Naechster praktischer Fall: Dropdown-/Option-Discovery fuer `Type`, noch ohne Zielwerte. |

## Naechster Case

`FIXEDASSETS-115-PURCHASE-INVOICE-LINE-TYPE-DROPDOWN-DISCOVERY`

Ziel: Nur beweisen, ob und wie die Zeilentyp-Auswahl in einer Einkaufsrechnungszeile die Option `Fixed Asset` sichtbar macht. Noch keine Eingabe von `K30000`, `FA-CNC-01`, Betrag oder Gegenkonto.

## Grenzen

- Kein BC-Lauf in FA-114.
- Kein Playwright-Lauf in FA-114.
- Keine Preview Posting.
- Kein `Post`.
- Keine Setup-Aenderung.
- Keine Buchaenderung.
- Kein deutscher Finalnachweis.

## Lernwert

Ein Anfaenger lernt daraus: Eine Anlagenbuchung scheitert nicht erst beim Buchen. Schon die Zeilenart entscheidet, ob Business Central den Wert als Artikel, Sachkonto oder Anlage interpretiert. Solange `Type = Fixed Asset` nicht sichtbar und stabil gesetzt werden kann, duerfen `FA-CNC-01` und der Betrag nicht als Anlagenzugang behauptet werden.
