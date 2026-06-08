# PAYMENTS-010 Posting-Readiness

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, UI-only, post-dialog-cancelled, no-payment, no-application, cleanup |
| Document No. | `PAY010-629175` |
| Ausgangsposten | `PS-INV103297` / `D10000` |
| Gegenkonto | `BANK-RM-01`, Bank Acc. Posting Group `CHECKING` |

## Ergebnis

| Pruefpunkt | Befund |
|---|---|
| Draft sichtbar | ja |
| Journal Check 0 Issues | ja |
| Applies-to Doc. Type | `2` |
| Applies-to Doc. No. | `PS-INV103297` |
| Apply Entries geklickt | ja |
| Apply Entries geoeffnet | ja |
| Ausgangsrechnung im Apply-Kontext sichtbar | ja |
| Preview Posting direkt sichtbar | nein |
| Preview Posting direkt geoeffnet | nein |
| Post sichtbar vor Dialog | ja |
| Post nur zum Dialogoeffnen geklickt | ja |
| Bestaetigungsdialog sichtbar | ja |
| Dialog abgebrochen | ja |
| Draft nach Abbruch sichtbar | ja |
| Cleanup geloescht | ja |
| Zahlung gebucht | nein |
| OP ausgeglichen | nein |

## Anfaenger-Lernwert

`Applies-to Doc. Type` und `Applies-to Doc. No.` markieren im Journalentwurf, auf welche offene Rechnung die Zahlung zielt. Das ist noch kein gebuchter Ausgleich. Ein echter Ausgleich entsteht erst durch eine Buchung oder durch bewusste Apply-Aktionen wie `Set Applies-to ID`/`Post Application`.

Fuer das Buch ist dieser Zwischenschritt wichtig: Einsteiger sehen, dass ein Zahlungsjournal erst dann fachlich weiter darf, wenn Betrag, Bankgegenkonto und Rechnungsbezug zusammenpassen und `Journal Check` keine Issues zeigt. `PAYMENTS-010` zeigt zusaetzlich: Der sichtbare `Post`-Button ist noch keine Zahlung. Erst die Bestaetigung im Dialog waere die riskante Aktion.

## Grenze

- CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.
- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.
- `Preview Posting` wird nur genutzt, wenn die Aktion direkt sichtbar ist.
- `Post` wurde in diesem Lauf nur zum Oeffnen des Dialogs geklickt; der Dialog wurde abgebrochen und nicht bestaetigt.

## Naechster Schritt

PAYMENTS-011: nur nach ausdruecklicher Freigabe eine kontrollierte Laborzahlung planen; Sicherheitskriterien aus PAYMENTS-010 beachten.
