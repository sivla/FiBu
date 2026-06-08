# PAYMENTS-003 Bankkonto-Fit

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Status | labor, setup-proof, no-payment, no-application |
| Zielbankkonto | `BANK-RM-01` / `Hausbank Rhein-Main` |
| Aktion | already-exists |
| Bankkonto nach Lauf vorhanden | ja |
| In Bank-Accounts-UI sichtbar | ja |

## Ergebnis

`BANK-RM-01` ist als CRONUS-USA-Laborbankkonto vorhanden und in der Bankkontenliste sichtbar. Damit ist der vorherige harte Bankkonto-Blocker fuer den naechsten Payments-Schritt geloest.

## Anfaenger-Lernwert

Ein Bankkonto in Business Central ist mehr als ein sichtbarer Name. Es ist der Stammdatensatz, ueber den Zahlungsjournale und Bankabstimmung spaeter laufen. Dass ein Zahlungsjournal sichtbar ist, reicht nicht: Das Gegenkonto muss fachlich existieren und spaeter mit Bankkontobuchungsgruppe, Betrag und Ausgleichsbezug geprueft werden.

## Was dieser Lauf nicht beweist

- Keine Zahlung.
- Kein OP-Ausgleich.
- Keine Bankabstimmung.
- Kein deutscher Bank-/Compliance-Finalnachweis.
- Noch kein Nachweis, dass `BANK-RM-01` fuer eine konkrete Zahlungsjournalbuchung vollstaendig eingerichtet ist.

## Naechster Schritt

PAYMENTS-004 als kontrollierte, nicht buchende Zahlungsjournal-Readiness-Zeile planen; weiterhin keine Zahlung buchen.
