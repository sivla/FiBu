# TARGET-059 General Posting Setup Purchase Account Route Decision

This folder documents a local decision only. Business Central was not opened and Playwright was not executed in TARGET-059.

Decision: the tested Page 314 List Edit/grid/header route for `Wareneinkaufskonto / Purch. Account = 5400` is parked. TARGET-057 still provides field truth, but TARGET-058 did not prove persistence because the attempt hit the column menu/header area and the reopen proof did not show `5400`.

Boundary: General Posting Setup remains partial. `INLAND / WAREN / 4400` is useful context, but `5400` and posting readiness are not proven. No Preview Posting, Posting, document, master data, VAT setup, setup write or API shortcut occurred here.
