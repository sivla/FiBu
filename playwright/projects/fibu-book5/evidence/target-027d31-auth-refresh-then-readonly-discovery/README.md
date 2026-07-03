# TARGET-027D31 Auth Refresh Gate

Status: blocked-auth-before-bc-shell

The active auth refresh attempt ran `npm run auth:bc` against the intended `playthru / UNIVERSAARL-DE` target override. The Playwright auth browser stayed on Microsoft sign-in until the 600000 ms timeout. No Business Central shell signal was detected and no storage state was saved.

No Assisted Setup, Manual Setup, VAT Posting Setup, setup value, master data, document, Preview Posting, Posting, payment, API shortcut or bookmaster change occurred.

Next safe action: complete Login/MFA inside the Playwright-opened browser until Business Central shell is visible, then require `npm run auth:bc:check` to return `canUseStoredAuth=true` before rerunning D31 read-only discovery.
