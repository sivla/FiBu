# TARGET-027D31 Auth Refresh Gate

Status: blocked-auth-before-bc-shell

The active auth refresh gate targets `playthru / UNIVERSAARL-DE`, but the Playwright auth profile is still not logged in to a Business Central shell. The latest bounded verification handoff ran `npm run auth:bc:open-login` with `BC_AUTH_OPEN_LOGIN_TIMEOUT_MS=60000`. The browser stayed on Microsoft sign-in, no Business Central shell signal was detected and no storage state was saved. The handoff command is intentionally bounded by default so failed attended login attempts finish with a result instead of leaving a long-running Playwright process behind.

No Assisted Setup, Manual Setup, VAT Posting Setup, setup value, master data, document, Preview Posting, Posting, payment, API shortcut or bookmaster change occurred.

Current gate state: the detached Playwright profile handoff has already been launched and `playwright/.auth/bc-profile` exists, but `playwright/.auth/bc-user.json` does not exist yet. `auth:bc:check`, `auth:bc:doctor` and `agent:run-plan` now point to the detached-capture sequence instead of blindly recommending another bounded login window.

The next safe action is:

1. Complete Login/MFA in the detached Playwright profile browser window if it is still open.
2. Wait until the Business Central shell is visible for `playthru / UNIVERSAARL-DE`.
3. Close that detached browser window.
4. Run `npm run auth:bc:capture-detached` to verify that no detached browser still uses the profile.
5. If the dry run is clear, run `npm run auth:bc:capture-detached -- --confirm` to validate the same profile and write `playwright/.auth/bc-user.json`.
6. Run `npm run auth:bc:check` and require `canUseStoredAuth=true`.

Important: signing in through normal Chrome or the Codex app does not refresh `playwright/.auth/bc-user.json`. A diagnostic attempt to use the existing Chrome session was not available through the local Codex Chrome extension, so no Chrome cookies or auth data were read or copied. If no detached browser is available anymore, the bounded fallback is:

1. Run `npm run auth:bc:open-login`.
2. Complete Login/MFA in that Playwright window.
3. Wait until Business Central shell text is visible.
4. Run `npm run auth:bc:check` and require `canUseStoredAuth=true`.
5. Only then rerun D31 read-only discovery.

If the operator needs more than the default wait window, set `BC_AUTH_OPEN_LOGIN_TIMEOUT_MS` explicitly for that one run.

If bounded handoffs keep timing out before Login/MFA can be completed, use the detached fallback:

1. Run `npm run auth:bc:open-login-detached`.
2. Complete Login/MFA in the opened Playwright profile browser.
3. Wait until Business Central shell is visible for `playthru / UNIVERSAARL-DE`.
4. Close that browser window.
5. Run `npm run auth:bc:capture-detached` to verify that no detached browser still uses the profile.
6. If the dry run is clear, run `npm run auth:bc:capture-detached -- --confirm` to validate the same profile and write `playwright/.auth/bc-user.json`.
7. Run `npm run auth:bc:check` and require `canUseStoredAuth=true`.

The detached command does not write storage state by itself. It only gives the operator a browser window that is not closed by the agent command timeout.

Current blocker:

- `npm run auth:bc:capture-detached` is clear when no detached browser still uses the profile.
- A confirmed capture still reached Microsoft sign-in instead of the Business Central shell, so `playwright/.auth/bc-user.json` was not written.
- The next useful step is another detached login handoff: open the detached Playwright profile, complete Login/MFA there, wait for the Business Central shell for `playthru / UNIVERSAARL-DE`, close that browser, then capture.
- If the detached Playwright browser is already open but hidden behind other windows, run `npm run auth:bc:focus-detached`.
