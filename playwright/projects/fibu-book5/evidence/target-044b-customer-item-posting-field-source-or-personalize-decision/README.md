# TARGET-044B - Customer/item field route decision

Status: observed

This local decision case did not open Business Central and did not run Playwright.

## Decision

TARGET-045 is not ready yet. TARGET-044 proved that the customer and item cards can be observed, but it did not prove exact target values or a safe active-card write route for the missing customer, item, VAT, payment or costing fields.

The next safe case is:

`TARGET-044C-CUSTOMER-ITEM-FIELDS-PERSONALIZE-NO-APPLY-DISCOVERY`

## Boundary

- No BC execution
- No Playwright execution
- No customer change
- No item change
- No setup change
- No personalization applied
- No document draft
- No Preview Posting
- No Posting
- No API shortcut

## Why this matters

Personalisieren is the next narrow UI-learning route because it can show whether relevant fields are available on the customer or item card without writing data or saving layout changes. TARGET-044C must close personalization without applying any change.
