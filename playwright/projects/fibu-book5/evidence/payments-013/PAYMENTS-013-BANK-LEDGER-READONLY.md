# PAYMENTS-013 Bank Ledger Read-only

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Modus | read-only, no-posting, no-bank-reconciliation, no-setup-change |
| Zahlungsbeleg | `PAY011-PS103297` |
| Bankkonto | `BANK-RM-01` |

## Ergebnis

Ein belastbarer Bank-Account-Ledger-UI-Nachweis wurde gefunden.

| Probe | Status | Bank-Ledger-Kontext | Zahlungsbeleg sichtbar | Bankkonto sichtbar | Screenshot |
|---|---|---:|---:|---:|---|
| 020-page-372-document-no | labor | ja | ja | ja | payments-013-020-page-372-document-no.png |
| 030-page-372-bank-account-no | labor | ja | ja | ja | payments-013-030-page-372-bank-account-no.png |
| 040-page-371-document-no-legacy | rejected | nein | nein | nein | payments-013-040-page-371-document-no-legacy.png |

## Anfaenger-Lernwert

Die G/L Entries aus `PAYMENTS-011` zeigen die Bankwirkung im Hauptbuch. Das ist aber nicht automatisch dasselbe wie ein sichtbarer Bankposten. Fuer das Buch muss ein Leser lernen, dass Business Central Bankwirkung, Debitorenausgleich und Bankabstimmung in unterschiedlichen Fenstern zeigt. Dieser Lauf klaert deshalb nur den UI-Pfad zu Bank Account Ledger Entries; er fuehrt keine Bankabstimmung aus.

## Grenzen

- Keine weitere Zahlung.
- Keine Bankabstimmung.
- Keine Setup- oder Stammdaten-Aenderung.
- Kein deutscher Bank-/Compliance-Finalnachweis.

## Naechster Schritt

PAYMENTS-014-BANK-LEDGER-BOOK-SYNC: Kapitel 20 und Evidence-Pack mit dem Bank-Account-Ledger-UI-Pfad synchronisieren; keine Bankabstimmung.
