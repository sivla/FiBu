# TARGET-024E - Global Dimension Source or Alternative Route

Status: observed  
Instance: playthru  
Company: UNIVERSAARL-DE  
Type: source-backed route decision

## Decision

TARGET-024E stops the repeated `Change Global Dimensions` route. TARGET-024D already entered `PRODUCTLINE` and `COSTCENTER` into the action page and clicked `Starten`, but Page 118 still showed empty `Globaler Dimensionscode 1/2` fields after reopening.

The next route is therefore `TARGET-024F-GLOBAL-DIMENSION-PAGE118-DIRECT-FIELD-ROUTE`.

## Source basis

Microsoft Learn `Work with dimensions` describes global and shortcut dimensions from the General Ledger Setup context and the Dimensions FastTab.

Source:

- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-dimensions

## What this case proves

- The failed 024B/024D routes must not be repeated blindly.
- The next useful hypothesis is a Page 118 field route, not another Page 577 action-page route.
- Master data is still not the right next step until global dimensions are assigned or consciously parked.

## What this case does not prove

- `PRODUCTLINE` is not yet persisted as Global Dimension Code 1.
- `COSTCENTER` is not yet persisted as Global Dimension Code 2.
- Default Dimensions, Dimension Set Entries, reporting filters and posted entry effects are not proven.

## Next case

`TARGET-024F-GLOBAL-DIMENSION-PAGE118-DIRECT-FIELD-ROUTE` should inspect Page 118 controls first. A setup write is only acceptable if the exact Page 118 fields are identified and before/after/reopen proof is planned.
