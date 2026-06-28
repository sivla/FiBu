# BANK-004 Payment Posting Fachpruefung

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor-gate, no-post, no-preview, not-final |
| Entscheidung | keine Zahlung buchen |

## Was belegt ist

- `BANK-001` zeigt Bank-/Payment-Reconciliation-Seitenkontexte read-only.
- `BANK-002` hat `Accept Applications` im Payment Reconciliation Journal kontrolliert ausgefuehrt.
- `BANK-003` hat den Dialog `Do you want to post the payments? Ja Nein` sichtbar gemacht und ohne Bestaetigung geschlossen.

## Warum jetzt nicht gebucht wird

Der Journal-Kontext enthaelt mehrere Zahlungs-/Abstimmungszeilen. Vor einer echten Buchung muss fuer genau eine Zielwirkung klar sein:

- Welche Journalzeile wird gebucht?
- Welcher offene Debitoren-, Kreditoren- oder Sachkontenbezug steckt dahinter?
- Welche `Customer Ledger Entries`, `Vendor Ledger Entries`, `Detailed Ledger Entries`, `Bank Account Ledger Entries` und `G/L Entries` werden erwartet?
- Wie wird nach der Buchung geprueft, ob der richtige Posten geschlossen oder nur teilweise ausgeglichen wurde?
- Wie wird eine Fehlbuchung korrigiert?

Ohne diese Zielzeile und Postenspur waere `Ja` im Dialog nur ein Klick auf eine Sammelwirkung. Das ist fuer das Buch zu unscharf.

## Posting-Gate fuer einen spaeteren Labor-Post

Eine echte Laborbuchung ist erst vertretbar, wenn vorher dokumentiert ist:

1. Zielzeile im Payment Reconciliation Journal mit Betrag, Partei, Dokumentnummer und Kontoart.
2. Zugehoeriger offener Posten oder bewusstes Sachkonto-Ziel.
3. Erwartete Postenarten nach Buchung.
4. Screenshots oder kompakte UI-Evidence vor dem Dialog.
5. Dialog-Screenshot mit noch nicht bestaetigtem `Ja`.
6. Postenspur nach Buchung: Bankposten, Debitoren-/Kreditorenposten, detaillierte Posten und Sachposten.
7. Korrekturpfad, falls die falsche Zeile gebucht wurde.

## German-Final-Rebuild

In der deutschen Zielcompany muss dieser Gate-Schritt neu erzeugt werden: deutsches Bankkonto, deutsche offene Posten, deutsche Konten, deutsche Screenshots und danach erst eine kontrollierte Zahlung mit Ledger Trace.

## Naechster Schritt

`BANK-005`: read-only Zielzeilen-/Open-Entry-Drilldown im Payment Reconciliation Journal oder alternativ kontrollierter Single-Line-Payment-Journal-Case statt Sammel-Post aus Payment Reconciliation.
