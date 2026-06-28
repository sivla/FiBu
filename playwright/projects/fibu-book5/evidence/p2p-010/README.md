# P2P-010 Purchase Line Value Route Decision

Status: `labor-blocked`, `needs-german-final-rebuild`

Instance: `MCP_1_20260210`  
Company: `RM-DEMO`  
Source company: `RM-DEMO`  
Case: `P2P-010-PURCHASE-LINE-VALUE-ROUTE-DECISION`

## What Was Tested

P2P-010 tested a fresh controlled Purchase Order draft route after P2P-008/P2P-009 showed that fixed-line display-cell editing was not enough.

Route B was used:

- open Purchase Orders in `RM-DEMO`
- create a fresh controlled draft
- enter vendor `K10000`
- open `Select items...`
- use visible `RAW-STEEL` directly
- skip the dialog search because `RAW-STEEL` was already visible
- inspect whether the resulting line visibly contains the target values

## Result

Observed:

- Fresh draft `106054` was created.
- Vendor `K10000` was entered.
- `RAW-STEEL` was visible in the Select-items dialog.
- The test did not open the unnecessary Search action.
- `RAW-STEEL` was clicked through a frame-aware fast text route.
- No Preview Posting, posting, setup change, company switch or API shortcut happened.

Blocked:

- Location `FRA-ZL` was not visible on the resulting `RAW-STEEL` line.
- Quantity `4` was not visible on the resulting `RAW-STEEL` line.
- Qty. to Receive `2` was not visible on the resulting `RAW-STEEL` line.
- Direct Unit Cost `2.500,00` was not visible on the final `RAW-STEEL` line in this route.

## Evidence Files

| File | Type | Proves | Does Not Prove |
|---|---|---|---|
| `P2P-010-result.json` | result JSON | Route B was executed and blocked safely | Preview Posting or receipt |
| `010-after-vendor-text.txt` | compact page text | Fresh draft/vendor context | Line target values |
| `011-after-vendor-controls.json` | control map | Header/control context after vendor | Final line values |
| `030-select-items-text.txt` | compact page text | Select-items context with visible item options | Quantity/location entry |
| `031-select-items-controls.json` | control map | Select-items controls and RAW-STEEL visibility context | Persisted order line values |
| `040-after-raw-steel-availability-text.txt` | compact page text | RAW-STEEL was available without opening search | Persisted order line values |
| `041-after-raw-steel-availability-controls.json` | control map | Search was not needed; item context remained visible | Persisted order line values |
| `050-final-text.txt` | compact page text | Final visible page state after route | Target line values |
| `051-final-controls.json` | control map | Final control context | Target line values |

Screenshots:

- `playwright/projects/fibu-book5/img/p2p-010-010-fresh-draft-after-vendor.png`
- `playwright/projects/fibu-book5/img/p2p-010-020-after-select-items-route.png`

## Book And Migration Impact

This is laboratory evidence only. It can improve the P2P clickguide as a learning/blocker case:

- Do not open a search box when the wanted item is already visible.
- Select-items can expose/select an item, but that alone is not proof that location, quantity and partial receipt quantities are set.
- Preview Posting remains locked until all line target values are visible and unambiguous.

German final rebuild:

- `mustRecreateInFinalSandbox`: `true`
- `migrationRelevance`: `needed-for-german-final`
- `finalScreenshotNeeded`: `true`

## Next Step

Do not repeat P2P-009 display-cell edits or unnecessary Select-items search. The next route should be one of:

- true Purchase Lines edit-mode/action discovery,
- a fachlich suitable alternative standard UI route such as Purchase Journal,
- or a clean laboratory company/setup route if RM-DEMO defaults keep blocking the process.
