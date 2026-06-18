# FIXEDASSETS-059 Purchase-Invoice-Helper-Refinement

Status: `labor`, `no-bc-run`, `playwright-helper`, `no-preview`, `no-posting`, `not-final`

## Ziel

Der 058-Lauf wird nicht wiederholt. Stattdessen wird die vorhandene Evidence genutzt, um den Guard genauer zu machen: Ein Listen-/Inline-Zeilenkontext nach `Neu` ist ein eigener Blocker und kein stabiler Belegkartenbeweis.

## Befund

- Der 058-Text nach `Neu` zeigt `Purchase Invoices`, `Buy-from Vendor No.`, `Vendor Invoice No.`, `Type` und weitere Listen-/Zeilensignale.
- Der Text zeigt keinen Zielkreditor `K30000`, keine Zielanlage `FA-CNC-01` und keinen sichtbaren Zeilentyp `Fixed Asset`.
- Der neue Guard-Status lautet deshalb `blocked-list-or-inline-row-context`.

## Neue Playwright-Regel

Nach `Neu` darf ein Test Zielwerte erst eingeben, wenn ein stabiler `Purchase Invoice`-Card-Kontext und der Lines-/Gridbereich nachgewiesen sind. Listen- oder Inline-Zeilensignale reichen nicht.

## Buchwirkung

Kapitel 21 bekommt noch kein Anlagenkauf-Bild. Das Debugging-/Nachweiskapitel kann aber klarer erklaeren, warum ein Buttonklick kein fachlicher Zielzustand ist.

## Naechster Schritt

`FIXEDASSETS-060-PURCHASE-INVOICE-CARD-CONTEXT-PREFLIGHT-NO-TARGET-ENTRY`: UI-first nur den Card-/Lines-Kontext nach `Neu` beweisen und wieder sauber verlassen; weiterhin keine Zielwerte, keine Preview und keine Buchung.

## Maschinenlesbares Ergebnis

```json
{
  "caseId": "FIXEDASSETS-059-PURCHASE-INVOICE-FIELD-MAPPING-HELPER-REFINEMENT-OR-MANUAL-PATH",
  "generatedAt": "2026-06-18T20:11:03.563Z",
  "environment": "MCP_1_20260210",
  "company": "RM-DEMO",
  "sourceEvidence": [
    "playwright/projects/fibu-book5/evidence/fixedassets-058/030-after-new-focused-text.txt",
    "playwright/projects/fibu-book5/evidence/fixedassets-058/FIXEDASSETS-058-result.json"
  ],
  "workType": "playwright-helper-and-evidence-no-bc-run",
  "bcRun": false,
  "posted": false,
  "previewPosting": false,
  "setupChanged": false,
  "documentsCreated": false,
  "classification": {
    "status": "blocked-list-or-inline-row-context",
    "success": false,
    "stopReasons": [
      "Purchase Invoices list or inline-row context is visible; target values must not be entered before a stable Purchase Invoice card and Lines context is proven."
    ],
    "visibleSignals": {
      "purchaseInvoice": true,
      "purchaseInvoicesList": true,
      "linesOrLineColumns": true,
      "fixedAssetNo": false,
      "fixedAssetLineType": false,
      "vendorNo": false,
      "vendorRegistrationDialog": false,
      "vendorCard": false,
      "accidentalVendorNo": false,
      "postingAction": true,
      "purchaseInvoiceListOrInlineRow": true
    }
  },
  "proves": [
    "FIXEDASSETS-058 after-New text is now classified as blocked-list-or-inline-row-context.",
    "Purchase Invoices list or inline-row context is not a stable Purchase Invoice card/lines proof.",
    "The guard can stop before target value entry with a more specific reason than unknown-context."
  ],
  "doesNotProve": [
    "No active Purchase Invoice Card context.",
    "No K30000 header entry.",
    "No FA-CNC-01 fixed asset line.",
    "No Preview Posting.",
    "No fixed asset acquisition.",
    "No German final proof."
  ],
  "nextStep": "FIXEDASSETS-060-PURCHASE-INVOICE-CARD-CONTEXT-PREFLIGHT-NO-TARGET-ENTRY"
}
```
