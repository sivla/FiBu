# P2P-011 Purchase Lines Edit Action Discovery

Status: `labor-blocked`, `helper-evidence-captured`, `needs-german-final-rebuild`

Instance: `MCP_1_20260210`  
Company: `RM-DEMO`  
Source company: `RM-DEMO`  
Case: `P2P-011-PURCHASE-LINES-EDIT-ACTION-DISCOVERY`

## What Was Tested

P2P-011 tested Route A after P2P-010:

- open Purchase Order `106054`
- confirm `RAW-STEEL` remains visible
- enable wide layout
- enable Lines focus mode
- open safe menus/actions such as `More options` and `Line`
- inventory visible action candidates
- do not enter values
- do not open Preview Posting
- do not post, receive, invoice, setup-change, company-switch or use API shortcuts

## Result

Observed:

- Purchase Order `106054` opened in `MCP_1_20260210` / `RM-DEMO`.
- `RAW-STEEL` remained visible.
- Wide layout and Lines focus mode were used.
- `More options` and `Line` menus opened safely.
- Action inventory captured line-related actions, including context actions such as item tracking.

Blocked:

- No clear safe direct `Edit`, `Bearbeiten`, `Edit List`, or `Liste bearbeiten` route for Purchase Lines value entry was found.
- The line/context action inventory does not prove entry of `FRA-ZL`, Quantity `4`, or Qty. to Receive `2`.
- Preview Posting and Receive remain locked.

## Evidence Files

| File | Type | Proves | Does Not Prove |
|---|---|---|---|
| `P2P-011-result.json` | result JSON | Route A action discovery ran safely | Target values or Preview Posting |
| `010-start-text.txt` | compact page text | PO `106054`, Lines context and `RAW-STEEL` | Field editability |
| `011-start-action-inventory.json` | scoped action inventory | Purchase Order action context before menu probes | Value-entry route |
| `020-after-action-discovery-text.txt` | compact page text | Post-menu page text remained limited | Target values |
| `021-menu-attempts.json` | menu evidence | Safe menus were tried; candidate counts captured | Direct edit route |
| `022-final-action-inventory.json` | final action inventory | No direct useful edit candidate was confirmed | P2P line target values |

Screenshots:

- `playwright/projects/fibu-book5/img/p2p-011-010-action-discovery-start.png`
- `playwright/projects/fibu-book5/img/p2p-011-020-after-action-menus.png`

## Beginner Learning Value

Business Central can show many actions near a line. Not every action that contains the word "edit" is a route for quantity, location or receipt quantity. For example, item tracking can edit serial/lot/package details, but it is not proof that the purchase line's Location Code, Quantity or Qty. to Receive can be set.

## Next Step

Stop repeating Purchase Lines display-cell edits, Select-items search, or generic menu discovery. The next P2P route should switch to a standard alternative:

- Purchase Journal / Item Journal route for inventory/value effect, or
- a cleaner laboratory company/setup route if RM-DEMO defaults keep blocking partial receipt.
