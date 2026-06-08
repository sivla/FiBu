# PAYMENTS-008 Cash Receipt Amount Field Diagnosis

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, UI-only, no-payment, no-application, cleanup |
| Document No. | `PAY008-482488` |
| Ausgangsposten | `PS-INV103297` / `D10000` |
| Gegenkonto | `BANK-RM-01`, Bank Acc. Posting Group `CHECKING` seit `PAYMENTS-007` |

## Ergebnis

| Pruefpunkt | Befund |
|---|---|
| Entwurfszeile sichtbar | ja |
| Amount-Feld Index 7 nach Refresh | `-68.000,00` |
| Amount-LCY/Amount ($) Index 8 nach Refresh | `-67.673,60` |
| Amount-Feld sichtbar gefuellt | ja |
| Amount-LCY sichtbar gefuellt | ja |
| Journal Check nach Refresh 0 Issues | ja |
| Current line no issues | ja |
| Aktueller Issue | kein Text nachgewiesen |
| Cleanup geloescht | ja |
| Zahlung gebucht | nein |
| OP ausgeglichen | nein |

## Journal-Check-Verlauf

| Schritt | Eingabe | 0 Issues | Current line ok | Issue |
|---|---|---|---|---|
| after-first-amount-entry | `-68.000,00` | nein | nein | `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten: 'Journal Template Name=CASHRCPT, Journal Batch Name=GENERAL, Line No.=10000'. Der Wert darf nicht null oder leer sein.` |
| after-full-draft-before-refresh | `full draft` | nein | nein | `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten: 'Journal Template Name=CASHRCPT, Journal Batch Name=GENERAL, Line No.=10000'. Der Wert darf nicht null oder leer sein.` |
| after-amount-refocus-before-refresh | `-68.000,00 plus Enter/Tab` | ja | ja | kein Text |
| after-refresh | `Refresh` | ja | ja | kein Text |

## Anfaenger-Lernwert

Im Zahlungsjournal gibt es zwei nebeneinanderliegende Betragsanzeigen: das fachliche `Amount`-Feld und die lokale/umgerechnete Anzeige `Amount ($)`. Fuer eine Buchung zaehlt nicht, dass irgendein Betrag optisch sichtbar ist, sondern ob `Journal Check` die aktuelle `Gen. Journal Line` ohne Issues validiert.

Dieser Lauf ist deshalb bewusst keine Zahlung. Er zeigt nur, ob Business Central den Betrag nach erneutem Fokus auf das eigentliche Amount-Feld und nach `Refresh` als zahlungsreifen Journalbetrag akzeptiert. Solange `Journal Check` weiter ein Issue meldet, bleibt der `Post`-Button fachlich gesperrt, auch wenn er sichtbar ist.

## Buchwirkung

Kapitel 19/20 sollte die breite Layoutansicht und den Unterschied zwischen `Amount` und `Amount ($)` erklaeren. Einsteiger sollen lernen: erst Betrag im lokalen Format erfassen, dann den rechten `Journal Check` lesen, danach erst ueber Ausgleich und Buchung sprechen.

## Grenze

- CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.
- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.
- Der Lauf prueft nur das Amount-/Journal-Check-Verhalten nach geloestem Bankkonto-Fit.

## Naechster Schritt

PAYMENTS-009: vor einer Laborzahlung zuerst Apply-Entries/Applies-to-Bezug und Buchungsvorschau nicht buchend pruefen; weiterhin keine Zahlung ohne ausdrueckliche Freigabe.
