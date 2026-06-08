# PAYMENTS Evidence Pack Sync

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Status | labor, book-sync, no-new-bc-run, no-payment |
| Grundlage | `PAYMENTS-001` bis `PAYMENTS-010` |
| Ausgangsrechnung | `PS-INV103297` / Debitor `D10000` |
| Laborbankkonto | `BANK-RM-01`, Bank Acc. Posting Group `CHECKING` |

## Was das Evidence Pack aktuell beweist

| Ebene | Evidence | Beweist |
|---|---|---|
| Offener Debitorenposten | `PAYMENTS-001` | Die gebuchte Verkaufsrechnung `PS-INV103297` ist als offener Debitorenposten sichtbar. |
| Offener Kreditorenposten | `PAYMENTS-001` | Die gebuchte Einkaufsrechnung `108219` ist als offener Kreditorenposten sichtbar. |
| Journal- und Apply-Einstieg | `PAYMENTS-002` | Bank Accounts, Cash Receipt Journal, Payment Journal und Apply Entries sind als Pfade erreichbar. |
| Laborbankkonto | `PAYMENTS-003` bis `PAYMENTS-007` | `BANK-RM-01` existiert, ist sichtbar und traegt `Bank Acc. Posting Group = CHECKING`. |
| Zahlungsjournal-Draft | `PAYMENTS-005` bis `PAYMENTS-008` | Debitor, Betrag, Gegenkonto, lokales Amount-Format und `Journal Check = 0 Issues` sind als Vorabkontrolle verstanden. |
| Apply-Bezug | `PAYMENTS-009` und `PAYMENTS-010` | `Applies-to Doc. No. = PS-INV103297` verbindet den Draft fachlich mit der offenen Rechnung; Apply Entries wurde read-only geoeffnet. |
| Letzte Sicherheitsgrenze | `PAYMENTS-010` | `Post` oeffnet einen `Ja`/`Nein`-Dialog; `Nein` bricht ab; der Draft wurde danach geloescht. |

## Was es nicht beweist

- Keine Zahlung wurde gebucht.
- Kein OP wurde ausgeglichen.
- Keine Bankposten wurden erzeugt.
- Keine Bankabstimmung wurde gestartet.
- Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis liegt vor.

## Anfaenger-Lernkette

Eine Zahlung ist in Business Central kein einzelner Klick. Der Lernpfad besteht aus mehreren Schwellen:

1. Offenen Posten finden.
2. Zahlungsjournal und passendes Bankgegenkonto vorbereiten.
3. Betrag und Waehrungsanzeige verstehen.
4. `Journal Check` lesen.
5. Rechnungsbezug ueber `Applies-to` und `Apply Entries` pruefen.
6. `Post` nur als letzte, bewusste Buchungsschwelle behandeln.

`PAYMENTS-010` endet bewusst vor Schritt 6: Der Dialog wurde sichtbar gemacht, aber mit `Nein` abgebrochen.

## Buchwirkung

Kapitel 19/20 duerfen aktuell den kompletten Vorbereitungs- und Sicherheitsweg zeigen, aber noch keine Zahlungswirkung behaupten. Fuer eine bebilderte Anleitung ist die wichtigste Formulierung:

> Der Post-Dialog ist die letzte Freigabegrenze. Erst `Ja` bucht Zahlung und Ausgleich; `Nein` laesst den Vorgang ungeposted.

## Naechster Schritt

`PAYMENTS-011` bleibt gesperrt, bis eine ausdrueckliche Freigabe fuer genau eine kontrollierte Laborzahlung vorliegt. Ohne Freigabe ist der naechste sinnvolle Schritt ein weiterer didaktischer Buch-Sync oder ein anderer read-only Prozessblock.
