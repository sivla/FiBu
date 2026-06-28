# BANK-017 Payment-Journal-Preflight-Gate

Status: labor, local decision, no-BC-run, no-Playwright-run, no-post, not-final.

## Entscheidung

`108205 / Wide World Importers` darf in einen separaten no-post Payment-Journal-Preflight gehen. Grund: BANK-016 hat den Beleg in den Vendor Ledger Entries sichtbar gemacht. Das ist fachlich staerker als die breite Payment-Reconciliation-Sicht aus BANK-013/BANK-014.

Der Preflight ist aber keine Buchungsfreigabe. BANK-018 darf hoechstens eine einzelne Payment-Journal-Zeile vorbereiten, Journal Check und Apply Entries pruefen und danach Cleanup oder Keep-Status dokumentieren.

## Grenzen

- Keine Zahlung wurde in BANK-017 gebucht.
- Keine Payment-Journal-Zeile wurde in BANK-017 angelegt.
- Kein `Accept Applications`.
- Kein `Post Payments Only`.
- Kein deutscher Finalnachweis.

## Freigegebener naechster Schritt

`BANK-018-VENDOR-PAYMENT-108205-PREFLIGHT-NO-POST`: kontrollierter no-post Payment-Journal-Preflight fuer `108205`, mit `BANK018-108205` als vorgeschlagener Dokumentnummer und `BANK-RM-01` als Labor-Bankkonto.
