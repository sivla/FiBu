# TARGET-036 - First controlled master-data write decision

Status: `source-backed-decision-no-write`

Instance: `playthru`

Company: `UNIVERSAARL-DE`

This case did not open Business Central and did not run Playwright. It converts TARGET-035 read-only evidence and Microsoft Learn source checks into the next controlled Universaarl case.

## Decision

The first write route is a simple Location:

- Code: `SAAR-HL`
- Name: `Saarbruecken Hauptlager`

Customers, Vendors and Items stay locked because their creation can involve templates and posting-related fields. They need a separate template and mandatory-field discovery case before any save.

## Boundaries

- No master data was created in TARGET-036.
- No setup was changed.
- No document or draft was created.
- No Preview Posting.
- No Posting.
- No API shortcut.

## Screenshot QA

TARGET-036 reuses TARGET-035 screenshot evidence for the Locations list surface. That screenshot is useful as context evidence, but not as proof of a saved Location card. TARGET-036A must create fresh before/card/reopen screenshots and must close or explicitly document Teaching Tips.

## Next case

`TARGET-036A-FIRST-LOCATION-CONTROLLED-WRITE-GATE`

