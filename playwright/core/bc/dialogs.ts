import { type Page } from '@playwright/test';

import { pageText, waitForPageText } from '../bc-helpers';
import { clickBcAction, type ClickBcActionResult } from './actions';

export type BcDialogOptions = {
  expectedText: RegExp;
  timeout?: number;
};

export type ClickBcDialogButtonOptions = BcDialogOptions & {
  buttonName: RegExp;
  expectedAfterClick?: RegExp;
};

export async function isBcDialogVisible(page: Page, expectedText: RegExp): Promise<boolean> {
  return expectedText.test(await pageText(page));
}

export async function expectBcDialog(page: Page, options: BcDialogOptions): Promise<void> {
  await waitForPageText(page, options.expectedText, {
    timeout: options.timeout ?? 20000,
  });
}

export async function clickBcDialogButton(
  page: Page,
  options: ClickBcDialogButtonOptions,
): Promise<ClickBcActionResult> {
  await expectBcDialog(page, options);

  return clickBcAction(page, {
    name: options.buttonName,
    scopeText: options.expectedText,
    expectedAfterClick: options.expectedAfterClick,
    timeout: options.timeout ?? 5000,
  });
}

