import { type Frame, type Page } from '@playwright/test';

import { waitForPageText } from '../bc-helpers';

export type BcActionRole = 'button' | 'menuitem' | 'link';

export type ClickBcActionOptions = {
  name: RegExp;
  roles?: BcActionRole[];
  scopeText?: RegExp;
  expectedAfterClick?: RegExp;
  timeout?: number;
  afterClickTimeout?: number;
};

export type ClickBcActionResult = {
  clicked: boolean;
  role?: BcActionRole;
  index?: number;
  scopeUrl?: string;
  attempts: string[];
};

async function textMatches(scope: Page | Frame, pattern?: RegExp): Promise<boolean> {
  if (!pattern) {
    return true;
  }

  const text = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
  return pattern.test(text);
}

function scopeUrl(scope: Page | Frame): string {
  return scope.url();
}

export async function clickBcAction(
  page: Page,
  options: ClickBcActionOptions,
): Promise<ClickBcActionResult> {
  const roles = options.roles ?? ['button', 'menuitem', 'link'];
  const timeout = options.timeout ?? 4000;
  const attempts: string[] = [];
  const scopes: Array<Page | Frame> = [page, ...page.frames()];

  for (const scope of scopes) {
    if (!(await textMatches(scope, options.scopeText))) {
      continue;
    }

    for (const role of roles) {
      const matches = scope.getByRole(role, { name: options.name });
      const count = await matches.count().catch(() => 0);

      for (let index = 0; index < count; index += 1) {
        const candidate = matches.nth(index);
        const visible = await candidate.isVisible({ timeout: 800 }).catch(() => false);

        if (!visible) {
          attempts.push(`${role}[${index}] hidden in ${scopeUrl(scope)}`);
          continue;
        }

        const clicked = await candidate.click({ timeout })
          .then(() => true)
          .catch((error) => {
            attempts.push(`${role}[${index}] click failed in ${scopeUrl(scope)}: ${String(error)}`);
            return false;
          });

        if (!clicked) {
          continue;
        }

        if (options.expectedAfterClick) {
          await waitForPageText(page, options.expectedAfterClick, {
            timeout: options.afterClickTimeout ?? 20000,
          });
        }

        return {
          clicked: true,
          role,
          index,
          scopeUrl: scopeUrl(scope),
          attempts,
        };
      }
    }
  }

  return {
    clicked: false,
    attempts,
  };
}

export async function isBcActionVisible(
  page: Page,
  options: Omit<ClickBcActionOptions, 'expectedAfterClick'>,
): Promise<boolean> {
  const roles = options.roles ?? ['button', 'menuitem', 'link'];
  const scopes: Array<Page | Frame> = [page, ...page.frames()];

  for (const scope of scopes) {
    if (!(await textMatches(scope, options.scopeText))) {
      continue;
    }

    for (const role of roles) {
      const matches = scope.getByRole(role, { name: options.name });
      const count = await matches.count().catch(() => 0);

      for (let index = 0; index < count; index += 1) {
        if (await matches.nth(index).isVisible({ timeout: options.timeout ?? 1000 }).catch(() => false)) {
          return true;
        }
      }
    }
  }

  return false;
}
