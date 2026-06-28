# BANK-010 Buchsync zu BANK-009

Status: `labor-sufficient-for-book-draft`, `book-sync`, `needs-german-final-rebuild`

## Quelle

- `BANK-009-result.json`
- `BANK-009-VENDOR-PAYMENT.md`
- Screenshots und Metadaten unter `playwright/projects/fibu-book5/img/bank-009-*` und `evidence/bank-009/`

## Was in das Buch uebernommen wurde

Kapitel 20 erklaert jetzt neben der Debitorenzahlung `PAY011-PS103297` auch die Kreditorenzahlung `BANK009-108204`.

Belegt aus BANK-009:

- offener Kreditorenposten `108204` fuer Vendor `20000` / `First Up Consultants`
- Payment Journal mit `BANK-RM-01`, Betrag `2.151,46`, `Applies-to Doc. No. = 108204`
- `Journal Check = 0 Issues`
- `Apply Entries` vor der Buchung read-only geprueft
- Post-Dialog sichtbar und genau einmal bestaetigt
- Kreditorenposten, detaillierte Kreditorenposten, Bank Account Ledger Entries und Sachposten sichtbar
- `Remaining Amount = 0,00` fuer Rechnung und Zahlung im Labor sichtbar

## Was nicht behauptet wird

- kein deutscher Finalnachweis
- keine Bankabstimmung
- kein Kontoauszugsimport
- kein deutscher Steuer-/Compliance-Nachweis
- keine finale Aussage zu deutschen Bankprozessen

## Buchwirkung

Kapitel 20 kann jetzt fuer Anfaenger zeigen, dass Zahlungsausgang und Zahlungseingang in Business Central gleichartig kontrolliert werden: offener Posten, Journalzeile, Ausgleichsbezug, Journal Check, Post-Dialog und Postenspur. Die konkrete RM-DEMO-Evidence bleibt Labor-/Vorproduktionsmaterial.

## Naechster Schritt

`BANK-011`: Entscheiden, ob als naechstes ein kontrollierter Bankabstimmungsfall oder die Vorbereitung eines deutschen Final-Rebuilds fachlich mehr Nutzen bringt.
