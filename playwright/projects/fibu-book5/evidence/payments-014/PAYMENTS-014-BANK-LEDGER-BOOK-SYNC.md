# PAYMENTS-014 Bank Ledger Book Sync

Status: book-sync, no-bc-run, no-posting, no-bank-reconciliation, no-setup-change, not-final.

## Ausgangspunkt

`PAYMENTS-011` hat genau eine Laborzahlung gebucht: `PAY011-PS103297` fuer `D10000` und Rechnung `PS-INV103297`. Danach waren Debitorenausgleich, Detailed Customer Ledger Entries und Sachposten sichtbar. `PAYMENTS-013` hat den fehlenden Bankpostenpfad geklaert: `Bank Account Ledger Entries` ueber Page `372` zeigt `PAY011-PS103297`, `BANK-RM-01`, Betrag `67.673,60`, Entry No. `4995` und Related G/L Entries `15110`, `18200`, `40910`. Page `371` bleibt fuer diesen Nachweis rejected.

## Buchwirkung

Kapitel 20 darf jetzt nicht mehr sagen, Bankposten seien offen. Richtig ist:

- Zahlung und OP-Ausgleich sind im Labor belegt.
- Sachposten zeigen die Hauptbuchwirkung.
- Bank Account Ledger Entries zeigen den Bankposten.
- Bankabstimmung ist ein eigener Prozess und bleibt offen.

Fuer Anfaenger ist die Trennung wichtig: Eine bezahlte Rechnung ist noch keine abgestimmte Bank. Business Central zeigt die Wirkung in mehreren Schichten. Erst wenn Zahlung, Debitorenposten, Sachposten, Bankposten und Bankabstimmung zusammenpassen, ist der Bankprozess fachlich abgeschlossen.

## Grenzen

- Keine neue BC-Ausfuehrung.
- Keine weitere Zahlung.
- Keine Bankabstimmung.
- Kein deutsches Bank-/Compliance-Finalbild.
- Kein Import von Kontoauszuegen.

## Naechster Schritt

Ohne neues Gate sollte kein weiterer Payment-Lauf gestartet werden. Sinnvoll ist als naechstes eine Gate-Entscheidung: Analysis-View-Fit fuer Reporting, Bankabstimmung mit separatem Plan oder Fixed-Assets-Setup. Bis dahin bleibt `PAY011-PS103297` der Payment-Referenzbeleg.
