# ITEM-SERVICE-REALISTIC-PRODUCT-MODEL-DECISION

Status: completed-local-decision

This local decision reconciles the Universaarl item model before any Business Central write.

Selected target product:

- Item no.: `U-ITEM-HW100`
- Description: `Steuerbox Standard U100`
- Type: `Bestand` / `Inventory`
- Base unit: `STK`
- Inventory posting group: `WARE`
- General product posting group: `WARE`
- VAT product posting group: `VAT19`
- Costing method: `FIFO`
- Target unit cost: `100.00`
- Target unit price: `149.00`

Boundary:

- No Business Central live action.
- No Playwright live action.
- No item, setup, document, preview, posting, payment or API action.
- The model is not O2C/P2P-ready until a controlled correction/rebuild write gate proves the real item card with screenshots.
