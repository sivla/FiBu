import { type Page } from '@playwright/test';

export type PurchaseInvoiceFieldMappingStatus =
  | 'safe-purchase-invoice-line-candidate'
  | 'blocked-vendor-registration-dialog'
  | 'blocked-wrong-vendor-card-context'
  | 'blocked-missing-fixed-asset-line'
  | 'blocked-list-or-inline-row-context'
  | 'unknown-context';

export type PurchaseInvoiceFieldMappingClassification = {
  status: PurchaseInvoiceFieldMappingStatus;
  success: boolean;
  stopReasons: string[];
  visibleSignals: {
    purchaseInvoice: boolean;
    purchaseInvoicesList: boolean;
    linesOrLineColumns: boolean;
    fixedAssetNo: boolean;
    fixedAssetLineType: boolean;
    vendorNo: boolean;
    vendorRegistrationDialog: boolean;
    vendorCard: boolean;
    accidentalVendorNo: boolean;
    postingAction: boolean;
    purchaseInvoiceListOrInlineRow: boolean;
  };
};

export type PurchaseInvoiceLineTypeVisibilityStatus =
  | 'safe-fixed-asset-line-type-visible'
  | 'blocked-vendor-registration-dialog'
  | 'blocked-wrong-vendor-card-context'
  | 'blocked-target-visible-before-fixed-asset-line-type'
  | 'blocked-item-line-type-visible'
  | 'blocked-missing-purchase-invoice-lines-context'
  | 'unknown-line-type-context';

export type PurchaseInvoiceLineTypeVisibilityInput = {
  purchaseInvoiceVisible?: boolean;
  linesContextVisible?: boolean;
  fixedAssetLineTypeVisible?: boolean;
  itemLineTypeVisible?: boolean;
  forbiddenFixedAssetNoVisible?: boolean;
  vendorCardVisible?: boolean;
  vendorRegistrationVisible?: boolean;
  postingOrPreviewVisible?: boolean;
};

export type PurchaseInvoiceLineTypeVisibilityClassification = {
  status: PurchaseInvoiceLineTypeVisibilityStatus;
  success: boolean;
  stopReasons: string[];
  visibleSignals: Required<PurchaseInvoiceLineTypeVisibilityInput>;
};

function has(text: string, pattern: RegExp) {
  return pattern.test(text);
}

export function classifyPurchaseInvoiceLineTypeVisibility(
  input: PurchaseInvoiceLineTypeVisibilityInput,
): PurchaseInvoiceLineTypeVisibilityClassification {
  const visibleSignals: Required<PurchaseInvoiceLineTypeVisibilityInput> = {
    purchaseInvoiceVisible: Boolean(input.purchaseInvoiceVisible),
    linesContextVisible: Boolean(input.linesContextVisible),
    fixedAssetLineTypeVisible: Boolean(input.fixedAssetLineTypeVisible),
    itemLineTypeVisible: Boolean(input.itemLineTypeVisible),
    forbiddenFixedAssetNoVisible: Boolean(input.forbiddenFixedAssetNoVisible),
    vendorCardVisible: Boolean(input.vendorCardVisible),
    vendorRegistrationVisible: Boolean(input.vendorRegistrationVisible),
    postingOrPreviewVisible: Boolean(input.postingOrPreviewVisible),
  };

  const stopReasons: string[] = [];
  if (visibleSignals.vendorRegistrationVisible) {
    stopReasons.push('Vendor registration dialog is visible; dialog text must not count as purchase-invoice line type proof.');
  }
  if (visibleSignals.vendorCardVisible) {
    stopReasons.push('Vendor Card context is visible; this is not a purchase-invoice line proof.');
  }
  if (!visibleSignals.purchaseInvoiceVisible || !visibleSignals.linesContextVisible) {
    stopReasons.push('Purchase Invoice and Lines context are not both visible.');
  }
  if (visibleSignals.forbiddenFixedAssetNoVisible && !visibleSignals.fixedAssetLineTypeVisible) {
    stopReasons.push('Target fixed asset number is visible before a visible Fixed Asset line type.');
  }
  if (visibleSignals.itemLineTypeVisible && !visibleSignals.fixedAssetLineTypeVisible) {
    stopReasons.push('Line type still appears as Item; target values must remain locked.');
  }

  let status: PurchaseInvoiceLineTypeVisibilityStatus = 'unknown-line-type-context';
  if (visibleSignals.vendorRegistrationVisible) {
    status = 'blocked-vendor-registration-dialog';
  } else if (visibleSignals.vendorCardVisible) {
    status = 'blocked-wrong-vendor-card-context';
  } else if (!visibleSignals.purchaseInvoiceVisible || !visibleSignals.linesContextVisible) {
    status = 'blocked-missing-purchase-invoice-lines-context';
  } else if (visibleSignals.forbiddenFixedAssetNoVisible && !visibleSignals.fixedAssetLineTypeVisible) {
    status = 'blocked-target-visible-before-fixed-asset-line-type';
  } else if (visibleSignals.fixedAssetLineTypeVisible && !visibleSignals.itemLineTypeVisible && stopReasons.length === 0) {
    status = 'safe-fixed-asset-line-type-visible';
  } else if (visibleSignals.itemLineTypeVisible && !visibleSignals.fixedAssetLineTypeVisible) {
    status = 'blocked-item-line-type-visible';
  }

  return {
    status,
    success: status === 'safe-fixed-asset-line-type-visible',
    stopReasons,
    visibleSignals,
  };
}

export function classifyPurchaseInvoiceFieldMappingText(
  text: string,
  options: {
    vendorNo?: string;
    fixedAssetNo?: string;
    accidentalVendorNo?: string;
  } = {},
): PurchaseInvoiceFieldMappingClassification {
  const vendorNo = options.vendorNo ?? 'K30000';
  const fixedAssetNo = options.fixedAssetNo ?? 'FA-CNC-01';
  const accidentalVendorNo = options.accidentalVendorNo ?? 'V00040';
  const normalized = text.replace(/\s+/g, ' ').trim();
  const visibleSignals = {
    purchaseInvoice: has(normalized, /\bPurchase Invoice\b|Einkaufsrechnung/i),
    purchaseInvoicesList: has(normalized, /\bPurchase Invoices\b|Einkaufsrechnungen/i),
    linesOrLineColumns: has(normalized, /\bType\b|\bNo\.\b|\bItem Reference No\.\b|\bArt\b|\bNr\./i),
    fixedAssetNo: normalized.includes(fixedAssetNo),
    fixedAssetLineType: has(normalized, /\bFixed Asset\b|\bAnlage\b/i),
    vendorNo: normalized.includes(vendorNo),
    vendorRegistrationDialog: has(normalized, /Create a new vendor card|new vendor card|not registered|Kreditor.*anlegen|neue Kreditorenkarte/i),
    vendorCard: has(normalized, /\bVendor Card\s*-|\bKreditorenkarte\s*-/i),
    accidentalVendorNo: normalized.includes(accidentalVendorNo),
    postingAction: has(normalized, /\bPost\b|\bBuchen\b/i),
    purchaseInvoiceListOrInlineRow: false,
  };
  visibleSignals.purchaseInvoiceListOrInlineRow =
    visibleSignals.purchaseInvoicesList &&
    has(normalized, /\bBuy-from Vendor No\.\b|\bBuy-from Vendor Name\b|\bVendor Invoice No\.\b|\bListe mit Titel\b/i);

  const stopReasons: string[] = [];
  if (visibleSignals.vendorRegistrationDialog) {
    stopReasons.push('Vendor registration dialog is visible; the field entry is no longer a clean purchase-invoice-line proof.');
  }
  if (visibleSignals.vendorCard) {
    stopReasons.push('Vendor Card context is visible; a fixed-asset number in this context is not a purchase-invoice-line proof.');
  }
  if (visibleSignals.accidentalVendorNo) {
    stopReasons.push(`Accidental vendor number ${accidentalVendorNo} is visible; this indicates wrong lookup/card context.`);
  }
  if (visibleSignals.fixedAssetNo && !visibleSignals.fixedAssetLineType) {
    stopReasons.push(`${fixedAssetNo} is visible without a visible Fixed Asset line type.`);
  }
  if (visibleSignals.purchaseInvoiceListOrInlineRow && !visibleSignals.vendorNo && !visibleSignals.fixedAssetNo) {
    stopReasons.push('Purchase Invoices list or inline-row context is visible; target values must not be entered before a stable Purchase Invoice card and Lines context is proven.');
  }

  let status: PurchaseInvoiceFieldMappingStatus = 'unknown-context';
  if (visibleSignals.vendorRegistrationDialog) {
    status = 'blocked-vendor-registration-dialog';
  } else if (visibleSignals.vendorCard || visibleSignals.accidentalVendorNo) {
    status = 'blocked-wrong-vendor-card-context';
  } else if (
    visibleSignals.purchaseInvoice &&
    visibleSignals.linesOrLineColumns &&
    visibleSignals.vendorNo &&
    visibleSignals.fixedAssetNo &&
    visibleSignals.fixedAssetLineType &&
    stopReasons.length === 0
  ) {
    status = 'safe-purchase-invoice-line-candidate';
  } else if (visibleSignals.purchaseInvoice && visibleSignals.vendorNo && visibleSignals.fixedAssetNo) {
    status = 'blocked-missing-fixed-asset-line';
  } else if (visibleSignals.purchaseInvoiceListOrInlineRow) {
    status = 'blocked-list-or-inline-row-context';
  }

  return {
    status,
    success: status === 'safe-purchase-invoice-line-candidate',
    stopReasons,
    visibleSignals,
  };
}

export async function classifyCurrentPurchaseInvoiceFieldMappingPage(
  page: Page,
  options?: Parameters<typeof classifyPurchaseInvoiceFieldMappingText>[1],
) {
  const text = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  return classifyPurchaseInvoiceFieldMappingText(text, options);
}
