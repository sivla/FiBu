# BANK-007 Single-Line Payment Route Decision

Status: `labor-sufficient-for-book-draft`, `route-decision`, `no-bc-run`, `needs-german-final-rebuild`.

## Entscheidung

Die Route `Payment Reconciliation Journal -> Post Payments Only` wird fuer den Kandidaten `108204 / First Up Consultants / -2.151,46` nicht blind bestaetigt. BANK-006 hat zwar die Zielzeile selektiert und den Dialog geoeffnet, aber der Dialog bleibt global: `Do you want to post the payments?`. Er beweist nicht, dass nur diese eine Zeile gebucht wuerde.

Der naechste fachlich saubere Pfad ist deshalb eine einzelne Journalzeile:

- Debitorenzahlung: `Cash Receipt Journal`, belegt durch `PAYMENTS-011`.
- Kreditorenzahlung: `Payment Journal`, belegt durch `P2P-002`.

## Belegte Grundlage

| Evidence | Befund | Wirkung fuer BANK-007 |
|---|---|---|
| `BANK-006` | Zielzeile `108204`, `First Up Consultants`, `-2.151,46` sichtbar; Dialog global; keine Buchung | Payment-Reconciliation-Post bleibt gesperrt |
| `PAYMENTS-011` | Single-Line Cash Receipt Journal mit Journal Check, Apply Entries, Post-Dialog und Debitoren-/Sachpostenspur | Debitorische Zahlungsroute ist als Laborpattern nutzbar |
| `P2P-002` | Single-Line Payment Journal mit Journal Check, Apply Entries, Post-Dialog und Kreditoren-/Bank-/Sachpostenspur | Kreditorische Zahlungsroute ist als Laborpattern nutzbar |

## Nicht bewiesen

- Keine neue Zahlung in BANK-007.
- Keine Preview Posting Aktion.
- Kein Payment-Reconciliation-Posting.
- Keine neue Journalzeile fuer `108204`.
- Kein deutscher Finalnachweis.

## Naechster Execute-Schritt

`BANK-008-SINGLE-LINE-VENDOR-PAYMENT-PREFLIGHT` soll einen kontrollierten Einzelzeilen-Payment-Journal-Preflight fuer `108204 / First Up Consultants` vorbereiten.

Vor einer Buchung muessen sichtbar sein:

- Zielposten oder offener Ledger Entry.
- Eine einzelne Journalzeile mit Kontoart, Kontonummer, Betrag, Bankgegenkonto und Applies-to-Bezug.
- `Journal Check` mit `0 Issues` und `0 Lines with issues`.
- `Apply Entries` read-only geprueft, ohne Set-/Post-Application-Nebeneffekt.
- Buchungsdialog vor Bestaetigung.
- Postenspurplan fuer Vendor/Customer Ledger, Detailed Ledger, Bank Account Ledger und G/L Entries.

## German-Final-Rebuild

Diese Entscheidung ist RM-DEMO-Laborwissen. In einer deutschen Zielcompany muss der Zahlungsfall mit deutschem Bankkonto, deutschen Konten, deutscher UI-Evidence und deutschen Buch-/Posten-Screenshots neu aufgebaut werden.
