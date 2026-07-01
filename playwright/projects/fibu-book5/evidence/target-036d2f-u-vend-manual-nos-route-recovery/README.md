# TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY

Status: blocked
Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

D2F blocked before effective BC action: Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Suchen|Search/i })
Expected: visible
Timeout: 120000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 120000ms
  - waiting for getByRole('button', { name: /Suchen|Search/i })


## Grenze

Business Central wurde nicht wirksam erreicht. Es gab keine Einrichtungsaenderung, keine Stammdatenanlage, keinen Draft, keine Buchungsvorschau, keine Buchung und keinen API Shortcut.

## Naechster Schritt

Playwright-Authentifizierung aktualisieren und denselben engen D2F-Case erneut ausfuehren.
