# BANK-022 Book Sync zu BANK-020/BANK-021

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor-only, book-draft-sync, no-bc-run, no-playwright-run |
| Quelle | BANK-020 kontrollierte Zahlung, BANK-021 Trace Review |
| Zahlungsbeleg | `BANK018-108205` |
| Buchwirkung | Kapitel-/Clickguide-Substanz fuer Bank und Zahlungen |

## Ergebnis

Der neue Draft `playwright/projects/fibu-book5/book-drafts/bank-payments-labor-draft.md` erklaert die Labor-Kreditorenzahlung anfaengerfreundlich:

- was im Payment Journal sichtbar sein muss,
- warum `Applies-to Doc. No.` fachlich wichtig ist,
- welche Fehler vor dem Buchen verhindert werden muessen,
- woran man nach dem Buchen die Postenspur erkennt,
- warum BANK-020/BANK-021 nur Labor-Evidence und kein deutscher Finalnachweis sind.

## Evidence-Anker

- `playwright/projects/fibu-book5/evidence/bank-020/BANK-020-result.json`
- `playwright/projects/fibu-book5/evidence/bank-020/BANK-020-VENDOR-PAYMENT.md`
- `playwright/projects/fibu-book5/evidence/bank-021/BANK-021-result.json`
- `playwright/projects/fibu-book5/evidence/bank-021/BANK-021-TRACE-REVIEW.md`

## Grenze

Keine neue BC-Ausfuehrung, kein Playwright, keine neue Buchung, keine Bankabstimmung. Die RM-DEMO-Evidence bleibt `labor-reference`; deutsche Final-Screenshots und deutsche Postenspur muessen spaeter neu erzeugt werden.

## Naechster Schritt

BANK-023 soll entscheiden, ob als naechster Laborblock eine kontrollierte Bankabstimmungsroute sinnvoll ist oder ob Bank Reconciliation bis zur deutschen Zielcompany geparkt wird.
