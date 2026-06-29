# WAREHOUSE-022 - Source Purchase Order Value Entry Blocker Review

Status: `labor-blocked`, `route-decision`, `needs-german-final-rebuild`

Instance: `MCP_1_20260210`  
Company: `RM-DEMO`  
Source document: Purchase Order `106055`  
BC/Playwright execution: no, local review only

## What WAREHOUSE-021 Proved

- Purchase Order draft `106055` was created in RM-DEMO.
- Vendor `K10000` is visible/filled.
- `RAW-STEEL` is visible after the `Select items...` route.
- No Receive, Invoice, Preview Posting, Post, Warehouse Receipt source confirmation, setup change, company switch or API shortcut occurred.

## Blocker

`FRA-ZL` is not visible on the controlled Purchase Order source document, and WAREHOUSE-021 did not find a fillable header `Location Code` control. Without visible/source-ready location proof, release and Warehouse Receipt source selection stay locked.

## Rejected Repetition

The next run must not repeat these already-unhelpful routes as the main hypothesis:

- display-cell/F2/Enter Purchase Line edits from earlier P2P attempts;
- Select-items-only route without a new field visibility hypothesis;
- Warehouse Receipt source-dialog/filter clicks before an eligible source document is proven.

## Selected Next Route

Use a targeted field visibility route on Purchase Order `106055`:

1. Open PO `106055` directly by page/filter URL.
2. Maximize/wide layout if available.
3. Use line focus and expand/Show more actions where safe.
4. Inspect page/control context for `Location Code` on header and Purchase Lines.
5. If `Location Code` becomes visible/fillable, capture evidence before any release.
6. If it remains absent, document that blocker and route to a helper or alternative standard UI path.

## German Final Rebuild

This remains RM-DEMO/CRONUS laboratory evidence only. A German final sandbox must recreate:

- source Purchase Order with German target setup;
- visible and readable location/source values;
- release state;
- Warehouse Receipt source selection;
- receipt/put-away posting trace;
- Item, Value, Warehouse and G/L evidence where relevant.
