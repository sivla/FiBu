# BANK-015 Route Decision

Status: labor, local decision, no-BC-run, no-Playwright-run, no-post, not-final.

## Entscheidung

Der Payment-Reconciliation-Kandidat `108205 / 107197` wird nicht weiter in Richtung `Accept Applications` oder `Post Payments Only` gefuehrt. BANK-014 hat zwar den Kandidaten im Payment Reconciliation Journal sichtbar gemacht, aber der direkte Vendor-Ledger-Nachweis fuer die Rechnung `107197` war unvollstaendig. Damit ist die Route fuer Apply/Post nicht sauber genug.

Die sichere Folge ist nicht ein weiterer Klick im breiten Reconciliation Journal, sondern ein enger Vendor-Ledger-Kandidatenscout. Erst wenn ein offener Kreditorenposten mit Belegnummer, Kreditor, Betrag und Restbetrag sichtbar ist, darf ein separater Payment-Journal-Preflight geplant werden.

## Beweisbasis

- BANK-009 beweist: Eine eng gefuehrte Payment-Journal-Zahlung kann in RM-DEMO mit Journal Check, Apply Entries und Postenspur kontrolliert gebucht werden.
- BANK-013 beweist: Payment Reconciliation enthaelt frische Kandidaten, aber auch alte/stale Signale.
- BANK-014 beweist: Kandidat `108205 / 107197` ist im Reconciliation-Kontext sichtbar, aber fuer Apply/Post noch nicht ledger-sicher.

## Nicht tun

- `108205 / 107197` nicht posten.
- `Accept Applications` nicht klicken.
- `Post Payments Only` nicht klicken.
- Kein globales Payment-Reconciliation-Posting aus einem mehrzeiligen Journal.
- Keine deutsche Finalaussage aus RM-DEMO ableiten.

## Naechster Schritt

`BANK-016-FRESH-VENDOR-LEDGER-CANDIDATE-SCOUT`: Vendor Ledger Entries read-only als fuehrende Quelle verwenden und einen frischen offenen Kreditorenposten suchen, bevor ein Payment-Journal-Preflight vorbereitet wird.
