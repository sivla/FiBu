# FIXEDASSETS-223 - Review FA-222 Amount and Preview

Status: observed-review

Scope:
- Local evidence review only.
- No Business Central execution.
- No Playwright execution.
- No posting, no setup change, no company switch, no book change.

Input evidence:
- `playwright/projects/fibu-book5/evidence/fixedassets-222/FIXEDASSETS-222-result.json`
- `playwright/projects/fibu-book5/evidence/fixedassets-222/010-amount-and-preview-single-session.json`
- `playwright/projects/fibu-book5/evidence/fixedassets-222/020-amount-and-preview-single-session-text.txt`

Decision:
- FA-222 is accepted as guarded Preview Posting evidence.
- FA-222 is not accepted as posting evidence.
- FA-222 proves visible Preview Posting groups, not detailed entry accounts or amounts.
- Next safe case is FA-224: open Preview Posting again and drill into G/L Entry and FA Ledger Entry preview groups without posting.

Boundary:
- Posting remains locked.
- German final proof remains open.
