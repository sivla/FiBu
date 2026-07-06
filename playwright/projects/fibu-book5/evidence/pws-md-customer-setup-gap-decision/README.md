# PWS-MD-CUSTOMER-SETUP-GAP-DECISION

Lokale Entscheidung auf Basis von `PWS-MD-004B`. Es wurde kein Business Central geoeffnet und kein Playwright-Live-Lauf ausgefuehrt.

## Ergebnis

`U-CUST-100 / Universaarl Kunde 100` reicht als beobachteter Debitor fuer Handbuch- und Trainingsentwurf zur Debitorenkarte. Der Nachweis reicht nicht fuer Debitoren-Write-Gate, O2C-Readiness, USt-/VAT-Korrektheit, Buchungsgruppen-Korrektheit oder Posting.

## Setup-Grenze

Die Debitorenkarte zeigt Warn-/Pflichtmarker bei `Fakturierung` und `Zahlungen`. Diese Bereiche muessen zuerst read-only aufgeklappt und mit Screenshot-QA bewertet werden.

## Naechster Case

`PWS-MD-004C-CUSTOMER-BILLING-PAYMENTS-FASTTABS-READFIRST`

Pflicht fuer den naechsten UI-Lauf:

- Listenkontext
- Kartenkontext
- `Fakturierung` aufgeklappt
- `Zahlungen` aufgeklappt
- Page Inspection im passenden Kontext
- End-Screenshot ohne Save/Edit/Draft/Post
