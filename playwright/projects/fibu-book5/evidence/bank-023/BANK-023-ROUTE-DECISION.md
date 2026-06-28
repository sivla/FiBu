# BANK-023 Route Decision: Bankabstimmung nach BANK-020/BANK-021

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor-route-decision, no-bc-run, no-playwright-run, no-post |
| Quelle | BANK-012 bis BANK-022 |
| Entscheidung | Payment Reconciliation nicht als naechste Posting-Route nutzen; nur read-only Bank-Account-Reconciliation-Scout oder German-Final-Rebuild |

## Entscheidung

Die naechste Bankabstimmungsarbeit soll nicht wieder aus dem alten Payment-Reconciliation-Kontext heraus posten. BANK-012 zeigte bereits, dass der alte `108204`-Kontext nach einer Payment-Journal-Zahlung weiter sichtbar war. BANK-013 fand zwar frische Kandidaten, aber ohne Zeilenauswahl oder Anwendung. BANK-014 blockierte den Kandidaten `108205` / `107197`, weil die Ledger-Zielpruefung nicht stark genug war. BANK-015 entschied deshalb korrekt: keine globale `Post Payments Only`-Route aus Payment Reconciliation.

Der sichere Anschluss ist ein eigener, read-only `Bank Account Reconciliation`-Scout:

- pruefen, welche Bankkontoabstimmungsseite und welche Bankkonten in RM-DEMO sichtbar sind,
- keine neue Statement-Zeile anlegen,
- kein Match/Apply,
- kein Post,
- keine Setup-Aenderung,
- nur Navigation, Page-Kontext und fachliche Readiness dokumentieren.

## Warum nicht direkt buchen?

Bankabstimmung braucht einen klaren Kontoauszugskontext. Eine bereits gebuchte Zahlung im Payment Journal beweist Zahlung und Postenspur, aber nicht automatisch, dass ein Kontoauszug, eine Bankkontoabstimmungszeile und ein sicherer Match/Post-Pfad vorliegen. Ohne diese Trennung wuerde der Autopilot wieder in eine breite Aktion laufen, bei der mehrere Zeilen oder alte Treffer betroffen sein koennten.

## Buchwirkung

Der Bank-/Payments-Draft darf erklaeren:

- Payment Journal ist im Labor als eng gefuehrte Kreditorenzahlung belegt.
- Payment Reconciliation ist als breite Posting-Route riskant, solange Zielzeile und Ledger-Ziel nicht eindeutig isoliert sind.
- Bank Account Reconciliation bleibt ein eigener Prozessblock und braucht eigene Evidence.

## German-Final-Rebuild

In der deutschen Zielcompany muss Bankabstimmung neu aufgebaut werden:

- deutsches Bankkonto,
- deutsche Kontoauszugs- oder Statement-Zeile,
- eindeutiger Zielposten,
- Match-/Apply-Kontext,
- Post-Dialog,
- Bankposten-/Sachposten-Trace nach der Abstimmung.

RM-DEMO bleibt nur Laborreferenz.

## Naechster Case

`BANK-024-BANK-ACCOUNT-RECONCILIATION-READONLY-SCOUT`: read-only Scout der Bank-Account-Reconciliation-Route, ohne Statement-Zeile, ohne Match, ohne Post.
