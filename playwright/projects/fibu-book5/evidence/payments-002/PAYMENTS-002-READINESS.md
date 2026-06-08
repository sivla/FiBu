# PAYMENTS-002 Bank-/Journal-/Apply-Readiness

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, controlled-readiness, no-payment, no-application, no-journal-line |
| Ausgangsposten Debitor | `PS-INV103297` / `D10000` |
| Ausgangsposten Kreditor | `108219` / `K10000` |
| Zielbankkonto laut Buch | `BANK-RM-01` |

## Ergebnis

| Frage | Befund |
|---|---|
| Bank Accounts erreichbar | ja |
| Zielbankkonto BANK-RM-01 sichtbar | nein |
| Cash Receipt Journal erreichbar | ja |
| Payment Journal erreichbar | ja |
| Apply Entries Debitor erreichbar | ja |
| Apply Entries Kreditor erreichbar | ja |
| Zahlung gebucht | nein |
| Posten ausgeglichen | nein |
| Journalzeile erstellt | nein |

## Anfaenger-Lernwert

Ein Zahlungsprozess hat drei Ebenen: offene Posten, Journal/Bankweg und Ausgleich. `PAYMENTS-001` hat die offenen Posten belegt. `PAYMENTS-002` zeigt jetzt die naechsten Bedienorte, ohne Werte einzutragen: Bankkonten, Cash Receipt Journal, Payment Journal und Apply Entries. Fuer Anfaenger ist wichtig: Das Oeffnen von `Apply Entries` ist noch kein Ausgleich. Erst Aktionen wie `Set Applies-to ID`, `Post Application` oder eine Journalbuchung veraendern die Posten.

## Buchwirkung

Kapitel 19/20 kann den Payments-Pfad jetzt als Readiness-Kette darstellen: zuerst offene Posten, dann Bankkonto/Journale, dann Apply Entries. Das Buch darf weiterhin keine Zahlung, keinen Ausgleich und keine Bankwirkung behaupten.

## Blocker / Grenze

- Zielbankkonto BANK-RM-01 ist im Bank-Accounts-Bild/Seitentext nicht sichtbar; vor einer Laborzahlung muss Bankkonto-Setup oder bewusstes CRONUS-Ersatzbankkonto entschieden werden.
- CRONUS-USA-Labor, kein deutscher Finalnachweis.
- Deutsche USt/Vorsteuer bleibt offen.

## Naechster Schritt

PAYMENTS-003 darf noch nicht buchen. Naechster Schritt ist ein idempotenter Bankkonto-Setup-/Fit-Lauf oder eine dokumentierte Entscheidung fuer ein vorhandenes CRONUS-Bankkonto als Laborersatz.
