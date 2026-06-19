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

export type ClickBcTopIconActionOptions = {
  title: RegExp;
  scopeText?: RegExp;
  expectedAfterClick?: RegExp;
  yMax?: number;
};

export type ClickBcTopIconActionResult = {
  clicked: boolean;
  scopeUrl?: string;
  candidate?: {
    index: number;
    text: string;
    ariaLabel: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attempts: string[];
};

export type BcScoredActionCandidate = {
  text: string;
  aria: string;
  title: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
};

export type ClickBcScoredActionOptions = {
  actionPattern: RegExp;
  scopeText?: RegExp;
  titleBonusPattern?: RegExp;
  preferredYMin?: number;
  preferredYMax?: number;
  rejectPattern?: RegExp;
  candidateLimit?: number;
  waitAfterClick?: number;
};

export type ClickBcScoredActionResult = {
  clicked: boolean;
  scopeUrl?: string;
  chosen?: BcScoredActionCandidate;
  candidates: BcScoredActionCandidate[];
  reason?: string;
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

function serializableRegExp(pattern?: RegExp) {
  if (!pattern) {
    return null;
  }

  return {
    source: pattern.source,
    flags: pattern.flags.replace('g', ''),
  };
}

function serializableRequiredRegExp(pattern: RegExp) {
  return {
    source: pattern.source,
    flags: pattern.flags.replace('g', ''),
  };
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

export async function clickBcScoredAction(
  page: Page,
  options: ClickBcScoredActionOptions,
): Promise<ClickBcScoredActionResult> {
  const attempts: string[] = [];
  const scopes: Array<Page | Frame> = [page, ...page.frames()];

  for (const scope of scopes) {
    if (!(await textMatches(scope, options.scopeText))) {
      continue;
    }

    const result = await scope
      .evaluate(
        ({ action, titleBonus, preferredYMin, preferredYMax, reject, candidateLimit }) => {
          const actionPattern = new RegExp(action.source, action.flags);
          const titleBonusPattern = titleBonus ? new RegExp(titleBonus.source, titleBonus.flags) : null;
          const rejectPattern = reject ? new RegExp(reject.source, reject.flags) : null;
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };

          const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const text = normalize(element.innerText || element.textContent);
              const aria = normalize(element.getAttribute('aria-label'));
              const title = normalize(element.getAttribute('title'));
              const label = `${text} ${aria} ${title}`;
              let score = 0;
              if (actionPattern.test(text) || actionPattern.test(aria)) score -= 50;
              if (titleBonusPattern?.test(title)) score -= 20;
              if (rect.y >= preferredYMin && rect.y <= preferredYMax) score -= 10;
              if (rejectPattern?.test(label)) score += 100;
              return {
                element,
                text,
                aria,
                title,
                label,
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                score,
              };
            })
            .filter((entry) => actionPattern.test(entry.text) || actionPattern.test(entry.aria) || actionPattern.test(entry.title) || actionPattern.test(entry.label))
            .sort((left, right) => left.score - right.score || left.y - right.y || left.x - right.x);

          const serializableCandidates = candidates.slice(0, candidateLimit).map(({ element: _element, ...entry }) => entry);
          const chosen = candidates[0];
          if (!chosen) {
            return { clicked: false, reason: 'action-not-found', candidates: serializableCandidates };
          }

          chosen.element.click();
          const { element: _element, ...serializableChosen } = chosen;
          return {
            clicked: true,
            chosen: serializableChosen,
            candidates: serializableCandidates,
          };
        },
        {
          action: serializableRequiredRegExp(options.actionPattern),
          titleBonus: serializableRegExp(options.titleBonusPattern),
          preferredYMin: options.preferredYMin ?? 35,
          preferredYMax: options.preferredYMax ?? 140,
          reject: serializableRegExp(options.rejectPattern),
          candidateLimit: options.candidateLimit ?? 20,
        },
      )
      .catch((error) => {
        attempts.push(`scored action failed in ${scopeUrl(scope)}: ${String(error)}`);
        return null;
      });

    if (!result) {
      continue;
    }

    if (!result.clicked) {
      attempts.push(`${result.reason ?? 'action-not-found'} in ${scopeUrl(scope)}`);
      continue;
    }

    await page.waitForTimeout(options.waitAfterClick ?? 1500);
    return {
      clicked: true,
      scopeUrl: scopeUrl(scope),
      chosen: result.chosen,
      candidates: result.candidates,
      attempts,
    };
  }

  return {
    clicked: false,
    candidates: [],
    reason: 'scoped-action-not-found',
    attempts,
  };
}

export async function clickBcTopIconAction(
  page: Page,
  options: ClickBcTopIconActionOptions,
): Promise<ClickBcTopIconActionResult> {
  const attempts: string[] = [];
  const scopes: Array<Page | Frame> = [page, ...page.frames()];

  for (const scope of scopes) {
    if (!(await textMatches(scope, options.scopeText))) {
      continue;
    }

    const candidate = await scope
      .evaluate(
        ({ titleSource, titleFlags, yMax }) => {
          const titlePattern = new RegExp(titleSource, titleFlags);
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };

          const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[title],[aria-label]'))
            .filter((element) => visible(element))
            .map((element, index) => {
              const rect = element.getBoundingClientRect();
              const entry = {
                element,
                index,
                text: normalize(element.innerText || element.textContent),
                ariaLabel: normalize(element.getAttribute('aria-label')),
                title: normalize(element.getAttribute('title')),
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              };
              return entry;
            })
            .filter((entry) => entry.y >= 0 && entry.y <= yMax)
            .filter((entry) => titlePattern.test([entry.text, entry.ariaLabel, entry.title].join(' ')))
            .sort((left, right) => left.y - right.y || left.x - right.x);

          const chosen = candidates[0];
          if (!chosen) {
            return null;
          }

          chosen.element.click();
          const { element, ...serializable } = chosen;
          return serializable;
        },
        {
          titleSource: options.title.source,
          titleFlags: options.title.flags.replace('g', ''),
          yMax: options.yMax ?? 90,
        },
      )
      .catch((error) => {
        attempts.push(`top icon action failed in ${scopeUrl(scope)}: ${String(error)}`);
        return null;
      });

    if (!candidate) {
      attempts.push(`no matching top icon action in ${scopeUrl(scope)}`);
      continue;
    }

    if (options.expectedAfterClick) {
      await waitForPageText(page, options.expectedAfterClick, { timeout: 20_000 });
    }

    return {
      clicked: true,
      scopeUrl: scopeUrl(scope),
      candidate,
      attempts,
    };
  }

  return {
    clicked: false,
    attempts,
  };
}
