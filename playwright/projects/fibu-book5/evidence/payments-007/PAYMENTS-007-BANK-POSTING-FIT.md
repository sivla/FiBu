# PAYMENTS-007 Bank Account Posting Fit

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, UI-only, no-payment, no-application, cleanup |
| Bankkonto | `BANK-RM-01` |
| Referenz-Buchungsgruppe | `CHECKING` aus CRONUS-Bankkonto `CHECKING` |

## Ergebnis

| Pruefpunkt | Befund |
|---|---|
| Bankkarte in UI geoeffnet | ja |
| Feld Bank Acc. Posting Group sichtbar | ja |
| Vorheriger Wert | `CHECKING` |
| UI-Fit versucht | nein |
| Direct-Posting-Warnung sichtbar | nein |
| Antwort auf Warnung | n/a |
| Nachheriger Wert direkt | `CHECKING` |
| Nach erneutem Oeffnen persistiert | `CHECKING` |
| UI-Fit geloest | ja |
| Zahlungsjournal erneut gefuellt | ja |
| Journal Check 0 Issues Total | nein |
| Journal Check 0 Lines with issues | nein |
| Current line: No issues found | nein |
| Aktueller Issue | `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten: 'Journal Template Name=CASHRCPT, Journal Batch Name=GENERAL, Line No.=10000'. Der Wert darf nicht null oder leer sein.` |
| Cleanup geloescht | ja |
| Zahlung gebucht | nein |
| OP ausgeglichen | nein |
| Bankabstimmung | nein |

## Anfaenger-Lernwert

Business Central prueft bei Zahlungsjournalen nicht nur Debitor, Betrag und Rechnungsbezug. Wenn das Gegenkonto ein Bankkonto ist, muss die Bankkontokarte eine Bankkontobuchungsgruppe tragen. Diese Buchungsgruppe ist die Bruecke zur Kontenfindung: Ohne sie weiss BC nicht, welche Sachkonten bei einer spaeteren Zahlung angesprochen werden sollen.

`CHECKING` war im stabilen Nachlauf bereits auf `BANK-RM-01` persistiert. Damit ist der alte Bankkontobuchungsgruppen-Blocker geloest; die Journalzeile ist trotzdem erst dann zahlungsreif, wenn `Journal Check` keine Issues mehr meldet.

Der sinnvolle Lernschritt ist deshalb zweistufig: zuerst das Bankkonto in der Karte fachlich fitten, danach dieselbe Journalzeile erneut ueber `Journal Check` pruefen. Erst wenn der Preflight keine Issues zeigt, darf man ueber eine bewusst freigegebene Laborzahlung nachdenken.

## Buchwirkung

Kapitel 19/20 muss Bankkonto-Setup und Zahlungsjournal deutlicher trennen. Ein sichtbares Bankkonto ist noch nicht zahlungsbereit; die Bankkontobuchungsgruppe ist Pflicht-Setup vor einer Zahlung. `PAYMENTS-007` zeigt zugleich: Auch nach geloestem Bankkonto-Fit kann `Journal Check` noch einen separaten Amount-Blocker melden.

## Grenzen

- CRONUS-USA-Labor, kein deutscher Bank-/Compliance-Finalnachweis.
- Kein Zahlungs-, Ausgleichs-, Debitorenposten-, Bankposten- oder Bankabstimmungsnachweis.
- `CHECKING` ist ein CRONUS-Laborfit, kein deutscher Kontenplan-Endstand.
- Die Journalzeile wurde nur als Entwurf angelegt und wieder geloescht.

## Naechster Schritt

PAYMENTS-008: neuen Journal-Check-Blocker aus PAYMENTS-007 analysieren; weiterhin keine Zahlung buchen.
