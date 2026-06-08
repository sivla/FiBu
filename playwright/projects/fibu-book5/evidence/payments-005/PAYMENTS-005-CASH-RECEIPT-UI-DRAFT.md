# PAYMENTS-005 Cash Receipt Journal UI-Draft

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, ui-draft, no-payment, no-application, cleanup |
| Document No. | `PAY005-477634` |
| Ausgangsposten | `PS-INV103297` / `D10000` |
| Gegenkonto | `BANK-RM-01` |
| Betrag im Entwurf | `-68.000` als Cash-Receipt-Customer-Zeile |

## Ergebnis

| Pruefpunkt | Befund |
|---|---|
| Entwurfszeile in UI sichtbar | ja |
| Debitor sichtbar | ja |
| Gegenkonto sichtbar | ja |
| Rechnungsbezug sichtbar | ja |
| Betrag sichtbar | ja |
| Journal Check sichtbar | ja |
| Journal Check Issues | 1 |
| Cleanup geloescht | ja |
| Zahlung gebucht | nein |
| OP ausgeglichen | nein |
| Bankabstimmung | nein |

## Anfaenger-Lernwert

Eine Zahlungsjournalzeile ist ein Entwurf, keine Zahlung. Erst beim Buchen entstehen Debitoren-/Bankposten und erst dann wird ein OP-Ausgleich wirklich wirksam. Fuer Anfaenger ist wichtig: Debitor, Betrag, Gegenkonto und Rechnungsbezug muessen schon vor dem Buchen plausibel sein. Dieser Lauf zeigt genau diesen Zwischenstand und loescht ihn danach wieder.

Der Journal Check ist dabei nicht nur Dekoration: Obwohl der Betrag in der UI-Zelle sichtbar ist, meldet BC im Labor noch ein Issue zur internen `Amount`-Validierung der `Gen. Journal Line`. Deshalb ist dieser Entwurf nicht zahlungsreif.

## Buchwirkung

Kapitel 19/20 kann jetzt einen UI-basierten Zwischenschritt zwischen offener Rechnung und Zahlung zeigen: Cash Receipt Journal oeffnen, Zahlungszeile vorbereiten, Journal Check beachten, aber noch nicht buchen. Der Screenshot ist ein Laborbild fuer den Entwurf, nicht fuer eine Zahlung.

## Grenze

- CRONUS-USA-Labor, kein deutscher Finalnachweis.
- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.
- Keine deutsche Bank-/Compliance- oder Steuerlogik.
- `Preview Posting` war in `PAYMENTS-004` nicht sichtbar; dieser UI-Draft nutzt Journal Check als sichtbaren Preflight-Hinweis.
- Journal Check meldet noch ein Issue zur Amount-Validierung; keine Zahlungsfreigabe.

## Naechster Schritt

PAYMENTS-006: UI-Draft erneut gezielt verbessern, bis Journal Check 0 Issues zeigt; Amount-Validierung, Betragsrichtung und Apply-Logik klaeren. Keine Zahlung ohne neue Freigabe.
