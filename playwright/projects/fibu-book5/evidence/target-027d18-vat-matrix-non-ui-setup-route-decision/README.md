# TARGET-027D18 VAT Matrix Non-UI Setup Route Decision

Status: `observed-route-selected`.

D18 is a local/source decision. It did not open Business Central, did not run Playwright, and did not change setup.

Decision:

- Page 472 grid typing, `Alt+ArrowDown`, and first-field lookup probes are parked after D14-D17.
- The next standard route is a read-only Configuration Packages discovery for setup table coverage, especially VAT Posting Setup / Table 325.
- This is not an API shortcut and not a setup write. It is a UI/source-backed route discovery before any future import/apply action.

Primary source anchors:

- Microsoft Learn: Set Up Company Configuration Packages lists setup tables including VAT Posting Setup.
- Microsoft Learn: Use Excel to import data explains that configuration packages can export to Excel, import, validate, and apply data.

Next case:

`TARGET-027D19-VAT-MATRIX-CONFIG-PACKAGE-READONLY-DISCOVERY`
