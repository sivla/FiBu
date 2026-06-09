# PAYMENTS-012 Buch- und Evidence-Sync nach Laborzahlung

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Modus | book-sync, evidence-sync, no-new-bc-run |
| Grundlage | `PAYMENTS-011` |
| Zahlungsbeleg | `PAY011-PS103297` |
| Ausgeglichene Rechnung | `PS-INV103297` / `D10000` |
| Setup/Stammdaten geaendert | nein |
| Gebucht in diesem Lauf | nein |

## Synchronisierte Projektwahrheit

`PAYMENTS-011` hat die erste kontrollierte UI-first Laborzahlung gebucht. `PAYMENTS-012` fuehrt keine neue BC-Aktion aus, sondern ordnet die Wirkung fuer Buch und Handover ein:

- Rechnung `PS-INV103297` ist im Debitorenposten mit `Remaining Amount = 0,00` und `Applied Entries = 1` belegt.
- Zahlungsbeleg `PAY011-PS103297` ist als Laborbeleg fuer den Zahlungseingang dokumentiert.
- Detailed Customer Ledger Entries zeigen `Initial Entry`, `Payment Discount` und `Application`.
- G/L Entries zeigen `15110`, `18200` und `40910`; die Bankwirkung ist damit im Hauptbuch sichtbar.
- Der direkte Page-371-Pfad fuer Bank Account Ledger Entries ist rejected/offen.
- Bankabstimmung, Kreditorenzahlung, deutsche Bank-/Steuer-/Compliance-Finalnachweise bleiben offen.

## Buchwirkung Kapitel 19/20

Kapitel 19 darf jetzt nicht mehr nur Zahlungs-Readiness beschreiben. Es muss erklaeren, dass Business Central nach der Buchung drei Dinge pruefbar macht:

1. den offenen Posten der Rechnung,
2. die detaillierten Ausgleichs- und Skonto-/Payment-Discount-Zeilen,
3. die Hauptbuchwirkung auf Forderung, Bankkonto und Discount-Konto.

Kapitel 20 darf den Bankkontext als Laborvorbereitung und Hauptbuchwirkung beschreiben, aber nicht behaupten, dass Bank Account Ledger Entries oder Bankabstimmung abgeschlossen sind.

## Anfaenger-Lernwert

Eine Zahlung ist in Business Central nicht nur eine Bankbewegung. Der Anwender muss vor dem Buchen den offenen Posten, den Betrag, das Bankgegenkonto, `Apply Entries` und `Journal Check` pruefen. Nach dem Buchen muss er Debitorenposten, detaillierte Debitorenposten und Sachposten lesen. Genau dort sieht man, ob die Rechnung ausgeglichen ist und ob Zahlungsbedingungen einen Skonto-/Payment-Discount erzeugt haben.

## Offene Grenze

Der naechste praktische Schritt ist kein zweiter Zahlungslauf. Sinnvoll ist ein read-only Folgepfad:

`PAYMENTS-013-BANK-LEDGER-READONLY`

Ziel: den korrekten UI-Pfad zu Bank Account Ledger Entries fuer `PAY011-PS103297` oder `BANK-RM-01` finden, ohne weitere Zahlung und ohne Bankabstimmung.

