# TARGET-027D31 Auth Refresh Gate

Status: historical-auth-evidence

Dieser Ordner bleibt als historischer Auth-Nachweis erhalten. Der aktive generische Auth-Refresh schreibt neue Nachweise nach `playwright/projects/fibu-book5/evidence/auth-bc-refresh-active-resume/AUTH-BC-REFRESH-result.json` und richtet den naechsten Schritt nach `.agent/state/current.json` aus. Aktuell ist das `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`, nicht D31.

Frueherer Status: completed-auth-shell-saved

The active auth refresh gate targets `playthru / UNIVERSAARL-DE`. After the operator completed Login/MFA in the detached Playwright profile browser, `npm run auth:bc:capture-detached -- --confirm` reached the Business Central shell and saved `playwright/.auth/bc-user.json`. `npm run auth:bc:check` now reports `canUseStoredAuth=true` with fresh shell-validation metadata for `playthru / UNIVERSAARL-DE`.

No Assisted Setup, Manual Setup, VAT Posting Setup, setup value, master data, document, Preview Posting, Posting, payment, API shortcut or bookmaster change occurred. This evidence only resolves the auth gate. The old VAT Assisted Setup next step is no longer active during the Improvement Freeze.

Current gate state: use `npm run auth:bc:check` and `npm run agent:resume:check:overnight`. The active live-gate remains freeze-controlled and points to TARGET-075 as read-first/no-write resume pilot.

Detached browser fallback retained for future refreshes:

1. Complete Login/MFA in the detached Playwright profile browser window.
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

If the detached Playwright browser is stale and only blocks the profile, run `npm run auth:bc:close-detached` first. It is a dry run by default and reports only processes that use `playwright/.auth/bc-profile`. Use `npm run auth:bc:close-detached -- --confirm` only when that window can be closed or when Login/MFA should be restarted from a clean detached handoff.

Current next step:

- Run `npm run auth:bc:check` immediately before the next BC test.
- Run the active resume pilot from `.agent/state/current.json` only if the shell confirms `playthru / UNIVERSAARL-DE` and the live gate allows it.
- Keep VAT setup write, Preview Posting, Posting, master data and API shortcuts locked.
