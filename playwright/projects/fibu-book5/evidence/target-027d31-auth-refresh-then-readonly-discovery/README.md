# TARGET-027D31 Auth Refresh Gate

Status: blocked-auth-before-bc-shell

The active auth refresh gate targets `playthru / UNIVERSAARL-DE`, but the Playwright auth profile is still not logged in to a Business Central shell. The latest bounded verification handoff ran `npm run auth:bc:open-login` with `BC_AUTH_OPEN_LOGIN_TIMEOUT_MS=60000`. The browser stayed on Microsoft sign-in, no Business Central shell signal was detected and no storage state was saved. The handoff command is intentionally bounded by default so failed attended login attempts finish with a result instead of leaving a long-running Playwright process behind.

No Assisted Setup, Manual Setup, VAT Posting Setup, setup value, master data, document, Preview Posting, Posting, payment, API shortcut or bookmaster change occurred.

Important: signing in through normal Chrome or the Codex app does not refresh `playwright/.auth/bc-user.json`. A diagnostic attempt to use the existing Chrome session was not available through the local Codex Chrome extension, so no Chrome cookies or auth data were read or copied. The login must finish in the Playwright-opened browser window. The next safe action is:

1. Run `npm run auth:bc:open-login`.
2. Complete Login/MFA in that Playwright window.
3. Wait until Business Central shell text is visible.
4. Run `npm run auth:bc:check` and require `canUseStoredAuth=true`.
5. Only then rerun D31 read-only discovery.

If the operator needs more than the default wait window, set `BC_AUTH_OPEN_LOGIN_TIMEOUT_MS` explicitly for that one run.
