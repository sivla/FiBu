# MANUFACTURING-006 - BOM/Routing Setup Readiness Decision

Status: `labor-sufficient-for-next-setup-readiness-case`, `needs-german-final-rebuild`

This run did not open Business Central and did not execute Playwright. It turns the Chapter 14 target path into concrete target values for the next UI-first setup-readiness case.

## Decision

Use a minimal first Manufacturing laboratory target:

| Object | Target | Reason |
|---|---|---|
| Finished item | `RM-M100` | already visible in RM-DEMO labor evidence |
| Production BOM | `BOM-RM-M100` | target structure for the first machine build |
| BOM line | `RAW-STEEL`, quantity per `2 PCS` | `PROD-3001` quantity `3` then consumes `6`, matching the book's cost-regulation learning chain |
| Excluded component | `COMP-CTRL` | planned full-book component, but not visible in `MANUFACTURING-001` |
| Routing | `ROUTE-M100` | target routing for `RM-M100` |
| Work Center | `100 Assembly department` | visible page-context signal in `MANUFACTURING-003` |
| First production order target | `PROD-3001`, quantity `3`, location `FRA-ZL` | existing book/process-case target |

## Gates Before Any BC Write

1. Open `Production BOMs` directly by Page ID `99000786`; prove whether `BOM-RM-M100` exists.
2. Open `Routings` directly by Page ID `99000764`; prove whether `ROUTE-M100` exists.
3. Open `Work Centers` directly by Page ID `99000754`; prove Work Center `100` details are usable.
4. Open the `RM-M100` item card; prove Production BOM/Routing link fields are visible/editable before any save.
5. Only after this read-only preflight may a separate case decide whether setup changes are safe.

## Not Proven

- No BOM was created or certified.
- No Routing was created or certified.
- No Production Order was created, released or posted.
- No Consumption Journal or Output Journal was posted.
- No manufacturing ledger trace exists.
- No German final proof exists.

## Next Case

`MANUFACTURING-007-BOM-ROUTING-UI-FIRST-PREFLIGHT`: read-only/direct-page preflight for the target values above. No setup change, no production order, no Preview Posting and no posting in that preflight.
