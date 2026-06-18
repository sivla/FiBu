# Skill: screenshot-qa

Use this skill before a screenshot is accepted for the book.

## Acceptance rule

The visible image must contain the visible business proof. Metadata alone is not enough.

Reject or downgrade if:

- the claimed code/value/button is not readable
- the image only shows a dialog/error while claiming target success
- the wrong page or company is visible
- the screenshot is too narrow and hides important columns
- a FactBox covers the relevant table
- the image shows a rejected path without being labeled as rejected/debugging

## Output labels

- `book-candidate`
- `labor-candidate`
- `debugging`
- `rejected-do-not-use`
- `needs-retake-wide-layout`
