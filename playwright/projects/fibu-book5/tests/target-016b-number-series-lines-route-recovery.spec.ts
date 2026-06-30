import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016B-NUMBER-SERIES-LINES-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-016b-number-series-lines-route-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016B-result.json');

const probeSeries = { code: 'U-CUST', startNo: 'U-CUST00001', endNo: 'U-CUST99999' };

function buildPlaythruUrl(pageId = 456) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  try {
    return sanitizeUrl(rawUrl);
  } catch {
    return rawUrl.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '{tenant}'
    );
  }
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren/i.test(text);
}

function codePattern(code: string) {
  return new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function visibleNames(page: Page, selector: string) {
  const values = (
    await Promise.all(
      page.frames().map((frame) =>
        frame
          .evaluate((query) => {
            const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
            const visible = (element: Element) => {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
            };
            return Array.from(document.querySelectorAll<HTMLElement>(query))
              .filter(visible)
              .map((element) =>
                normalize(
                  element.innerText ||
                    element.textContent ||
                    element.getAttribute('aria-label') ||
                    element.getAttribute('title') ||
                    element.getAttribute('name')
                )
              )
              .filter(Boolean)
              .slice(0, 200);
          }, selector)
          .catch(() => [] as string[])
      )
    )
  ).flat();
  return [...new Set(values.map(clean).filter(Boolean))];
}

async function frameControlInventory(frame: Frame) {
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const fieldLike = /Startnr|Starting No|Endnr|Ending No|Letzte Nr|Last No|Manuelle|Manual|Standardnr|Default|Luecken|Lücken|Gap|Datum|Date/i;
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        'input,textarea,select,[role="textbox"],[role="combobox"],[role="checkbox"],[aria-checked],[contenteditable="true"],[role="gridcell"],[aria-label],[title],[data-control-name]'
      )
    )
      .filter(visible)
      .map((element, index) => {
        const input = element as HTMLInputElement;
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const ariaLabel = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const controlName = normalize(element.getAttribute('data-control-name') || element.getAttribute('controlname'));
        const type = normalize(input.type);
        const value = normalize(input.value);
        const area = Math.round(rect.width * rect.height);
        return {
          index,
          frameUrl: window.location.href,
          tagName: element.tagName,
          role: normalize(element.getAttribute('role')),
          type,
          ariaLabel,
          title,
          controlName,
          text,
          value,
          checked: type === 'checkbox' ? input.checked : null,
          ariaChecked: normalize(element.getAttribute('aria-checked')) || null,
          disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
          readOnly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
          fieldLike: fieldLike.test(`${ariaLabel} ${title} ${controlName} ${text} ${value}`),
          area,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        };
      })
      .filter((entry) => {
        if (/FORM|BODY|HTML/i.test(entry.tagName)) return false;
        if (entry.area > 90_000) return false;
        if (entry.role === 'menuitemcheckbox' && !/Fokus|Focus|Filter|Infobox|Layout/i.test(entry.ariaLabel)) return false;
        return entry.fieldLike || entry.role === 'checkbox' || entry.type === 'checkbox' || entry.ariaChecked !== null;
      })
      .slice(0, 80);
  });
}

async function controlInventory(page: Page) {
  const perFrame = await Promise.all(page.frames().map((frame) => frameControlInventory(frame).catch(() => [])));
  return perFrame
    .flat()
    .map((entry) => ({ ...entry, frameUrl: sanitizeEvidenceUrl(entry.frameUrl) }))
    .slice(0, 80);
}

async function frameHeaderInventory(frame: Frame) {
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const pattern = /Startdatum|Starting Date|Startnr|Starting No|Endnr|Ending No|Letzte Nr|Last No|Manuelle|Manual|Standardnr|Default|Luecken|Lücken|Gap/i;
    return Array.from(document.querySelectorAll<HTMLElement>('*'))
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          frameUrl: window.location.href,
          text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title')),
          role: normalize(element.getAttribute('role')),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        };
      })
      .filter((entry) => pattern.test(entry.text) && entry.text.length <= 120)
      .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x)
      .slice(0, 80);
  });
}

async function headerInventory(page: Page) {
  const perFrame = await Promise.all(page.frames().map((frame) => frameHeaderInventory(frame).catch(() => [])));
  return perFrame
    .flat()
    .map((entry) => ({ ...entry, frameUrl: sanitizeEvidenceUrl(entry.frameUrl) }))
    .slice(0, 120);
}

async function captureState(page: Page, filePrefix: string, step: string) {
  const rawText = await pageText(page);
  const compact = (
    await compactPageText(page, {
      include: [
        /Nummernserie|No\. Series|Nummernserienzeilen|No\. Series Lines|Code|Startdatum|Startnr|Endnr|Starting|Ending|Letzte Nr|Last No|Manuelle|Manual|Standardnr|Default|Luecken|Lücken|Gap|U-CUST/i
      ],
      maxLines: 180,
      maxLineLength: 220
    })
  )
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .join('\n');
  const controls = await controlInventory(page);
  const headers = await headerInventory(page);
  const actions = (await visibleNames(page, 'button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a,[aria-label],[title]')).filter(
    (name) => /Neu|New|Zeilen|Lines|Bearbeiten|Edit|Verwalten|Manage|Standard|Default|Manual|Manuelle|Luecken|Lücken|Gap|Fokus|Focus/i.test(name)
  );
  await writeText(`${filePrefix}.txt`, compact || clean(rawText).slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.controls.json`), { step, controls, headers, actions });
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / Nr.-Serienzeilen',
    step,
    status: 'german-final-candidate-diagnostic',
    bookUse: 'foundation-number-series-setup-diagnostics',
    visibleLearning:
      'Nummernserien bestehen nicht nur aus Code und Beschreibung. Startnr./Endnr. in den Zeilen und Checkboxen wie manuelle/standardmaessige Nummern beeinflussen spaeter die Nummernvergabe.',
    importantUi: actions.slice(0, 30),
    internallyProves: 'Visible Number Series / Lines context, action names, field headers and checkbox/control states were captured.',
    doesNotProve: [
      'No number-series line value was changed unless the result JSON says so explicitly.',
      'No setup assignment, master data, document draft, preview posting or posting occurred.'
    ],
    qualityDecision: 'diagnostic',
    controlCount: controls.length,
    headerCount: headers.length
  });
  return { text: clean(rawText), compact, controls, headers, actions };
}

type CapturedState = Awaited<ReturnType<typeof captureState>>;

function selectLinesHeader(state: CapturedState | undefined, label: RegExp) {
  const candidates = (state?.headers ?? [])
    .filter((header) => header.role === 'columnheader')
    .filter((header) => label.test(header.text))
    .filter((header) => header.rect.x >= 700 && header.rect.x <= 1100)
    .filter((header) => header.rect.y >= 80 && header.rect.y <= 220)
    .filter((header) => header.rect.width >= 70)
    .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
  return candidates[0] ?? null;
}

async function typeIntoLinesCell(page: Page, header: NonNullable<ReturnType<typeof selectLinesHeader>>, value: string) {
  const x = header.rect.x + header.rect.width / 2;
  const y = header.rect.y + header.rect.height + 18;
  await page.mouse.click(x, y);
  await page.waitForTimeout(350);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 12 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(700);
}

async function assertSafeContext(page: Page) {
  const text = clean(await pageText(page));
  const currentUrl = page.url();
  if (!instancePathIsTarget(currentUrl) || !companyParamIsTarget(currentUrl)) {
    throw new Error(`Unsafe context. URL was ${sanitizeUrl(currentUrl)}`);
  }
  if (!/Nummernserie|No\. Series|Nummernserienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Number Series or Number Series Lines text is not visible.');
  }
  if (containsDangerousDialog(text)) {
    throw new Error('Dangerous dialog/action text detected.');
  }
}

async function clickFirstVisible(page: Page, names: RegExp[]) {
  const scopes = [page, ...page.frames()];
  for (const name of names) {
    for (const scope of scopes) {
      for (const role of ['button', 'menuitem'] as const) {
        const locator = scope.getByRole(role, { name }).first();
        if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
          await locator.click({ timeout: 4000 }).catch(async () => locator.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(1200);
          return true;
        }
      }
    }
  }
  return false;
}

async function selectSeriesRow(page: Page, code: string) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const row = scope.getByRole('row', { name: codePattern(code) }).first();
    if (await row.isVisible({ timeout: 1000 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
    const text = scope.getByText(codePattern(code)).first();
    if (await text.isVisible({ timeout: 1000 }).catch(() => false)) {
      await text.click({ timeout: 5000 }).catch(async () => text.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
  }
  return false;
}

test('TARGET-016B Number Series Lines route and checkbox recovery', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  let listState: Awaited<ReturnType<typeof captureState>> | undefined;
  let linesState: Awaited<ReturnType<typeof captureState>> | undefined;
  let afterWriteState: Awaited<ReturnType<typeof captureState>> | undefined;
  let writeAttempt: { status: 'not-attempted' | 'attempted-visible' | 'attempted-not-visible' | 'blocked'; reason: string } = {
    status: 'not-attempted',
    reason: 'No write attempt before Lines headers were inventoried.'
  };

  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);

  listState = await captureState(page, 'target-016b-010-number-series-list-u-cust-context', 'Number Series list before opening lines.');
  if (!codePattern(probeSeries.code).test(listState.text)) {
    blockedBy.push(`${probeSeries.code} is not visible on Number Series page.`);
  } else if (!(await selectSeriesRow(page, probeSeries.code))) {
    blockedBy.push(`${probeSeries.code} row could not be selected.`);
  } else if (!(await clickFirstVisible(page, [/^Zeilen$|^Lines$/i]))) {
    blockedBy.push('Scoped Zeilen/Lines action was not visible.');
  } else {
    await assertSafeContext(page);
    linesState = await captureState(page, 'target-016b-020-u-cust-lines-control-inventory', 'U-CUST Number Series Lines control and checkbox inventory.');

    const startHeader = selectLinesHeader(linesState, /^Startnr\.$|^Starting No\.$/i);
    const endHeader = selectLinesHeader(linesState, /^Endnr\.$|^Ending No\.$/i);
    if (!startHeader || !endHeader) {
      writeAttempt = {
        status: 'blocked',
        reason: `Unique Lines-page Startnr./Endnr. headers were not resolved. Start=${Boolean(startHeader)} End=${Boolean(endHeader)}.`
      };
    } else {
      await typeIntoLinesCell(page, startHeader, probeSeries.startNo);
      await typeIntoLinesCell(page, endHeader, probeSeries.endNo);
      await assertSafeContext(page);
      afterWriteState = await captureState(page, 'target-016b-030-u-cust-lines-after-targeted-cell-route', 'After targeted Lines-page Startnr./Endnr. cell route.');
      const visibleAfter = codePattern(probeSeries.startNo).test(afterWriteState.text) && codePattern(probeSeries.endNo).test(afterWriteState.text);
      writeAttempt = {
        status: visibleAfter ? 'attempted-visible' : 'attempted-not-visible',
        reason: visibleAfter
          ? 'Targeted Lines-page header-coordinate route made U-CUST Startnr./Endnr. visible.'
          : 'Targeted Lines-page header-coordinate route did not make U-CUST Startnr./Endnr. visible.'
      };
    }
  }

  const allControls = [...(listState?.controls ?? []), ...(linesState?.controls ?? [])];
  const checkboxControls = allControls.filter((control) => control.type === 'checkbox' || control.role === 'checkbox' || control.ariaChecked !== null);
  const pageCheckboxControls = checkboxControls.filter(
    (control) => control.role !== 'menuitemcheckbox' && control.rect.y > 120 && control.rect.x > 500
  );
  const startNoControls = allControls.filter((control) => /Startnr|Starting No/i.test(`${control.ariaLabel} ${control.title} ${control.controlName} ${control.text}`));
  const endNoControls = allControls.filter((control) => /Endnr|Ending No/i.test(`${control.ariaLabel} ${control.title} ${control.controlName} ${control.text}`));
  const checkboxLabels = pageCheckboxControls.map((control) =>
    clean(`${control.ariaLabel || control.title || control.controlName || control.text || control.role}=${control.checked ?? control.ariaChecked ?? 'unknown'}`)
  );
  const startNoVisible = Boolean(afterWriteState && codePattern(probeSeries.startNo).test(afterWriteState.text));
  const resultStatus = blockedBy.length ? 'blocked' : startNoVisible ? 'observed' : 'diagnostic-observed';

  const editableStartNoControls = startNoControls.filter(
    (control) => /INPUT|TEXTAREA|SELECT/i.test(control.tagName) || /textbox|combobox/i.test(control.role)
  );
  const editableEndNoControls = endNoControls.filter(
    (control) => /INPUT|TEXTAREA|SELECT/i.test(control.tagName) || /textbox|combobox/i.test(control.role)
  );

  if (!editableStartNoControls.length && writeAttempt.status !== 'attempted-visible') {
    blockedBy.push('No unique visible Startnr./Starting No. editor control was discovered; value entry depended on targeted header-coordinate route.');
  }
  if (!editableEndNoControls.length && writeAttempt.status !== 'attempted-visible') {
    blockedBy.push('No unique visible Endnr./Ending No. editor control was discovered; value entry depended on targeted header-coordinate route.');
  }
  if (!pageCheckboxControls.length) {
    blockedBy.push('No visible checkbox controls were discovered on Number Series or Lines; checkbox semantics remain open.');
  }

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-lines-route-checkbox-diagnostic',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    proved: [
      ...(listState ? ['Number Series list context for U-CUST was captured in playthru / UNIVERSAARL-DE.'] : []),
      ...(linesState ? ['Scoped Zeilen/Lines action opened U-CUST Number Series Lines for diagnostic inventory.'] : []),
      ...(pageCheckboxControls.length ? [`Visible number-series checkbox states were captured: ${checkboxLabels.slice(0, 12).join('; ')}.`] : []),
      ...(linesState?.headers.length ? [`Line/header candidates captured: ${linesState.headers.map((entry) => entry.text).slice(0, 12).join(' | ')}.`] : []),
      ...(writeAttempt.status === 'attempted-visible' ? ['U-CUST Startnr. and Endnr. became visible after a targeted Lines-page cell route.'] : [])
    ],
    notProved: [
      ...(writeAttempt.status === 'attempted-visible'
        ? ['Only U-CUST Startnr./Endnr. was set; the remaining U-* series lines are not configured yet.']
        : ['U-CUST Startnr./Endnr. value persistence is still not proven.']),
      'No setup assignment was made in Sales & Receivables, Purchases & Payables or Inventory Setup.',
      'No customer, vendor, item, document draft, preview posting, posting or ledger trace was created.',
      ...(pageCheckboxControls.length
        ? ['Checkbox meaning is inventoried, but no checkbox was changed or chosen as a target value yet.']
        : ['Checkbox controls were not yet proven visible in the captured DOM inventory.'])
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016b-number-series-lines-route-recovery/TARGET-016B-result.json',
      'playwright/projects/fibu-book5/evidence/target-016b-number-series-lines-route-recovery/*.txt',
      'playwright/projects/fibu-book5/evidence/target-016b-number-series-lines-route-recovery/*.controls.json',
      'playwright/projects/fibu-book5/evidence/target-016b-number-series-lines-route-recovery/*.screenshot.json',
      'playwright/projects/fibu-book5/img/target-016b-*.png'
    ],
    statePatch: {
      current: {
        activeCase: CASE_ID,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep: startNoVisible
          ? 'Apply the proven TARGET-016B Lines-page cell route to the remaining U-* series, then decide Standardnr./Manuelle Anz. checkbox semantics.'
          : 'Use TARGET-016B controls evidence to choose a non-blind route for Startnr./Endnr. and the relevant Number Series checkbox semantics.'
      },
      lastRunSummary: {
        caseId: CASE_ID,
        status: resultStatus,
        summary: startNoVisible
          ? 'TARGET-016B set U-CUST Startnr./Endnr. through a targeted Lines-page cell route and captured checkbox semantics. Remaining U-* lines and checkbox decisions stay open.'
          : 'TARGET-016B captured Number Series Lines field/header/control and checkbox diagnostics. It did not prove Startnr./Endnr. value persistence.',
        resultPath: 'playwright/projects/fibu-book5/evidence/target-016b-number-series-lines-route-recovery/TARGET-016B-result.json'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016b-number-series-lines-route-recovery/TARGET-016B-result.json',
      'playwright/projects/fibu-book5/img/target-016b-010-number-series-list-u-cust-context.png',
      'playwright/projects/fibu-book5/img/target-016b-020-u-cust-lines-control-inventory.png',
      ...(afterWriteState ? ['playwright/projects/fibu-book5/img/target-016b-030-u-cust-lines-after-targeted-cell-route.png'] : [])
    ],
    probeSeries,
    writeAttempt,
    checkboxControls: pageCheckboxControls.slice(0, 36),
    startNoControls: startNoControls.slice(0, 20),
    endNoControls: endNoControls.slice(0, 20),
    headers: (linesState?.headers ?? []).slice(0, 60),
    actions: (linesState?.actions ?? []).slice(0, 40),
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookChange: true,
      noSetupAssignment: true,
      setupChanged: writeAttempt.status === 'attempted-visible',
      checkboxChanged: false
    },
    smartDecisionCard: {
      caseId: CASE_ID,
      effectiveActionRequested: true,
      decision: 'Inventory Number Series Lines controls and checkbox states, then attempt Startnr./Endnr. only through a resolved Lines-page header-coordinate route.',
      alternativesConsidered: [
        'Repeat the failed blind Tab route: rejected.',
        'Type Startnr./Endnr. without a unique active editor: rejected.',
        'Assign U-* series in setup pages now: rejected until line and checkbox semantics are understood.'
      ],
      risk: 'Incorrect checkbox or line values would change later automatic numbering behavior.',
      fallback: 'Use the controls JSON to build a targeted editor route or stop with an exact UI blocker.'
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-016 proved U-* header rows but missed Startnr./Endnr. and ignored checkbox semantics.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Number Series cannot be treated as setup-ready until lines and checkbox behavior are understood.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-016B-NUMBER-SERIES-LINES-ROUTE-RECOVERY',
          status: 'ready-next',
          reason: 'Use this diagnostic evidence to choose a non-blind write route.'
        },
        {
          caseId: 'TARGET-017-NUMBER-SERIES-ASSIGNMENT-FIELD-DISCOVERY',
          status: 'needs-setup-first',
          reason: 'Assignment discovery waits until line values and checkbox semantics are clear.'
        },
        {
          caseId: 'TARGET-018-NUMBER-SERIES-ASSIGNMENT-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Setup assignment must not happen until the Number Series itself is correctly understood.'
        },
        {
          caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups follow numbering foundation.'
        },
        {
          caseId: 'TARGET-020-VAT-SETUP-READINESS',
          status: 'needs-source-check-first',
          reason: 'German VAT setup requires separate source-backed evidence.'
        }
      ],
      queueChangesMade: ['Added checkbox semantics to TARGET-016B scope.'],
      selectedNextCase: CASE_ID,
      whySelectedNextCaseIsBest: 'It closes the exact blocker before any setup assignment or master data.',
      risksBeforeNextCase: ['Do not change checkboxes without explicit field meaning.', 'Do not type into Startdatum instead of Startnr.'],
      requiredPreparation: [
        startNoVisible
          ? 'Repeat the proven route for the remaining U-* series only after duplicate/blank-line check.'
          : 'Read TARGET-016B controls JSON and screenshot QA before the next write attempt.'
      ]
    },
    warnings: blockedBy,
    blockedBy,
    requiresReview: !startNoVisible,
    safeToFinalizeState: startNoVisible,
    reason: startNoVisible
      ? 'TARGET-016B proved a targeted Lines-page route for U-CUST Startnr./Endnr. and captured checkbox/control semantics.'
      : 'TARGET-016B improved the diagnosis by adding checkbox/control inventory, but no safe Startnr./Endnr. write route was proven yet.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016B Number Series Lines Route Recovery',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      'Die Nummernserienzeilen wurden geoeffnet und die sichtbaren Feld-/Header-/Checkbox-Kandidaten wurden inventarisiert.',
      '',
      '## Wichtiges Learning',
      '',
      '- Nummernserien bestehen aus Kopfzeile, Zeilenwerten und Checkbox-Semantik.',
      '- Startnr./Endnr. duerfen nicht blind per Tab gesetzt werden, weil vorher Startdatum sichtbar ist.',
      '- Checkboxen wie manuelle oder Standardnummern muessen fachlich erfasst werden, bevor die Nummernserie als setupbereit gilt.',
      '',
      '## Grenze',
      '',
      startNoVisible
        ? '- U-CUST Startnr./Endnr. wurden ueber die gezielte Lines-Page-Route sichtbar gesetzt.'
        : '- Keine Werte wurden in TARGET-016B sichtbar geaendert.',
      '- Kein Setup wurde zugewiesen, keine Stammdaten, keine Vorschau, keine Buchung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
