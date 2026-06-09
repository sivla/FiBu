# PAYMENTS-011 Kontrollierte Laborzahlung

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, autonomous-posting, UI-first, no-bank-reconciliation, not-final |
| Zahlungsbeleg | `PAY011-PS103297` |
| Ausgangsrechnung | `PS-INV103297` / `D10000` |
| Gegenkonto | `BANK-RM-01`, Bank Acc. Posting Group `CHECKING` |
| Betrag | `-68.000,00 EUR` |
| Zahlungswirkung | Rechnung `PS-INV103297` zeigt nach der Buchung `Remaining Amount = 0,00` und `Applied Entries = 1` |
| Skonto-/Discount-Wirkung | sichtbar als `Payment Discount` in Detailed Customer Ledger Entries und Konto `40910 Discounts and Allowances` in G/L Entries |

## Entscheidungssatz

Diese Buchung ist als autonome RM-DEMO-Laborbuchung vertretbar, weil der bestehende offene Debitorenposten PS-INV103297 fuer D10000 im UI sichtbar ist, die Cash-Receipt-Journal-Zeile mit BANK-RM-01 und -68.000,00 EUR auf genau diese Rechnung verweist, Journal Check 0 Issues zeigt, Apply Entries read-only geprueft wurde und die erwartete Postenspur Debitorenposten, detaillierte Debitorenposten und Sachposten mit Bankwirkung umfasst; Risiko und Grenze bleiben CRONUS-USA-Labor ohne Bank Account Ledger Entry Nachweis, ohne Bankabstimmung und ohne deutschen Finalnachweis.

## Preflight

| Pruefpunkt | Befund |
|---|---|
| Debitorenposten vorher offen sichtbar | ja |
| Draft sichtbar | ja |
| D10000 sichtbar | ja |
| BANK-RM-01 sichtbar | ja |
| PS-INV103297 als Applies-to Doc. No. sichtbar | ja |
| Amount -68.000,00 sichtbar | ja |
| Applied Checkbox | `on` |
| Journal Check 0 Issues | ja |
| Apply Entries geoeffnet | ja |

## Buchung

| Pruefpunkt | Befund |
|---|---|
| Post-Dialog sichtbar | ja |
| Genau einmal bestaetigt | ja |
| Erfolgstext sichtbar | ja |

## Postenspur

| Postenart | sichtbar | Hinweis |
|---|---:|---|
| customer-ledger-invoice-after-payment | ja | 060-customer-ledger-invoice-after-payment-page-text.txt |
| customer-ledger-payment | ja | 061-customer-ledger-payment-page-text.txt |
| detailed-customer-ledger-payment | ja | 062-detailed-customer-ledger-payment-page-text.txt |
| bank-account-ledger-payment | nein | Versuch ueber Page `371` liefert kein belastbares Bank-Account-Ledger-Bild; Bankwirkung ist nur indirekt ueber G/L Entry `18200` und Gegenkonto `BANK-RM-01` sichtbar |
| gl-entries-payment | ja | 064-gl-entries-payment-page-text.txt |

## Sichtbare Detailwirkung

- Die Rechnung `PS-INV103297` ist im Debitorenposten mit `Remaining Amount = 0,00` und `Applied Entries = 1` sichtbar. Das ist der praktische OP-Ausgleich im Labor.
- Der Zahlungsbeleg `PAY011-PS103297` zeigt im Debitorenposten `Amount = -69.360,00`, `Remaining Amount = -1.360,00` und `Detailed Ledger Entries = 3`. Das ist kein Eingabefehler des Tests, sondern die im CRONUS-Labor sichtbare Skonto-/Payment-Discount-Wirkung aus den Zahlungsbedingungen.
- Die detaillierten Debitorenposten zeigen `Initial Entry`, `Payment Discount` und zwei `Application`-Zeilen. Genau dort sieht der Leser, dass Business Central die Zahlung nicht nur als Bankbewegung, sondern als Ausgleichs- und Skontologik verarbeitet.
- Die Sachposten zeigen `15110 Account Receivable, Domestic`, `18200 Business account, Operating, Domestic` und `40910 Discounts and Allowances`. Damit ist die Hauptbuchwirkung der Laborzahlung sichtbar.

## Anfaenger-Lernwert

Eine Zahlung im Cash Receipt Journal ist kein reines Erfassen einer Bankbewegung. Business Central braucht Kontoart, Debitor, Betrag, Bankgegenkonto und den Bezug zur offenen Rechnung. Erst die Buchung erzeugt die Zahlungs-/Ausgleichswirkung in den Posten.

Wichtig fuer das Buch: `Applies-to Doc. No.` zeigt den Zielposten vor der Buchung. Nach der Buchung muss der Leser in Debitorenposten, detaillierten Debitorenposten, Bankposten und Sachposten pruefen, ob der offene Posten wirklich geschlossen oder ausgeglichen wurde.

Der Lauf zeigt zusaetzlich einen Anfaenger-Lernfall: Zahlungsbedingungen koennen Skonto/Payment Discount ausloesen. Deshalb ist der gebuchte Zahlungsbeleg nicht nur der eingegebene Betrag, sondern enthaelt in Detailposten und Sachposten zusaetzliche Ausgleichs- und Discount-Wirkung.

## Grenzen

- CRONUS-USA-Labor, kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.
- Keine Bankabstimmung in diesem Lauf.
- Keine Kreditorenzahlung in diesem Lauf.
- Bank Account Ledger Entries wurden ueber den getesteten Page-371-Pfad nicht belastbar sichtbar; der Bankpostenpfad bleibt ein read-only Folgeschritt.
- Deutsche 19-%-USt bleibt offen.

## Naechster Schritt

PAYMENTS-012: Payments-Evidence in Buchkapitel 19/20 synchronisieren und entscheiden, ob Bankabstimmung als separater Readiness-/Gate-Lauf vorbereitet wird.
