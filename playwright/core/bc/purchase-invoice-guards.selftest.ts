import assert from 'node:assert/strict';
import fs from 'node:fs';

import { classifyPurchaseInvoiceLineTypeVisibility } from './purchase-invoice-guards';

const source = JSON.parse(fs.readFileSync('playwright/projects/fibu-book5/evidence/fixedassets-064/FIXEDASSETS-064-result.json', 'utf8'));

const afterNew = classifyPurchaseInvoiceLineTypeVisibility(source.afterNewLineTypeEvidence);
assert.equal(afterNew.success, false);
assert.equal(afterNew.status, 'blocked-item-line-type-visible');

const lineTypeAttempt = classifyPurchaseInvoiceLineTypeVisibility(source.lineTypeAttempt.lineTypeEvidence);
assert.equal(lineTypeAttempt.success, false);
assert.equal(lineTypeAttempt.status, 'blocked-vendor-registration-dialog');

const final = classifyPurchaseInvoiceLineTypeVisibility(source.afterLineTypeEvidence);
assert.equal(final.success, false);
assert.equal(final.status, 'blocked-vendor-registration-dialog');

const safeCandidate = classifyPurchaseInvoiceLineTypeVisibility({
  purchaseInvoiceVisible: true,
  linesContextVisible: true,
  fixedAssetLineTypeVisible: true,
  itemLineTypeVisible: false,
  forbiddenFixedAssetNoVisible: false,
  vendorCardVisible: false,
  vendorRegistrationVisible: false,
  postingOrPreviewVisible: false,
});
assert.equal(safeCandidate.success, true);
assert.equal(safeCandidate.status, 'safe-fixed-asset-line-type-visible');

console.log('purchase-invoice-guards selftest OK');
