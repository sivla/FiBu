# TARGET-027D31 VAT Assisted Setup Read-only Discovery

Status: blocked-auth-before-bc-shell

This run did not reach Business Central. The stored Playwright authentication state was older than the allowed 12 hours. A fresh auth attempt timed out and the redacted diagnosis remained on Microsoft sign-in instead of a validated Business Central shell.

Follow-up on 2026-07-03: a second `auth:bc:check`, `auth:bc`, and `auth:bc:diagnose` sequence produced the same safe blocker. The Playwright auth browser did not reach a Business Central shell signal and no storage state was saved.

No Assisted Setup, Manual Setup, VAT Posting Setup, setup value, master data, document, Preview Posting, Posting, payment or API shortcut was executed.

Next safe action: refresh Business Central auth until `npm run auth:bc:check` returns `canUseStoredAuth=true`, then rerun D31 read-only discovery in `playthru / UNIVERSAARL-DE`.
