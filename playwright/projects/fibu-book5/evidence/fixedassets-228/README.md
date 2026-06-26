# FIXEDASSETS-228 Evidence Index

Case: `FIXEDASSETS-228-FA-ACQUISITION-BOOK-SYNC`

Scope: local book and coverage sync only. No Business Central run, no Playwright run, no posting, no setup change, no company switch and no API shortcut.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-228-BOOK-SYNC.md` | Markdown evidence | Chapter 21, coverage and findings were synced to FA-226/FA-227 laboratory evidence | No new BC observation | labor/book-sync |
| `FIXEDASSETS-228-result.json` | Result JSON | Machine-readable result and next-state proposal | No automatic state write | observed |

Source evidence:

- `playwright/projects/fibu-book5/evidence/fixedassets-226/FIXEDASSETS-226-result.json`
- `playwright/projects/fibu-book5/evidence/fixedassets-226/FIXEDASSETS-226-LAB-POSTING.md`
- `playwright/projects/fibu-book5/evidence/fixedassets-227/FIXEDASSETS-227-result.json`
- `playwright/projects/fibu-book5/evidence/fixedassets-227/FIXEDASSETS-227-POSTED-TRACE.md`

Book impact:

- Chapter 21 now explains the controlled CRONUS-USA lab acquisition for `FA-CNC-01`.
- The text separates `G/L Entries` from `FA Ledger Entries`.
- Page `5604` is documented as the successful posted FA Ledger Entry path.
- Page `5606` is documented as rejected `FA Ledger Entries Preview` path.
- German final proof, depreciation and disposal remain open.
