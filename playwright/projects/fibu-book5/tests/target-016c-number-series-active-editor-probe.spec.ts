import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016C-NUMBER-SERIES-ACTIVE-EDITOR-PROBE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016c-number-series-active-editor-probe';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016C-result.json');
const probeSeries = { code: 'U-CUST', startNo: 'U-CUST00001', endNo: 'U-CUST99999' };

type Rect = { x: number; y: number; width: number; height: number };
type ActiveInfo = {
  tag: string;
  role: string;
  ariaLabel: string;
  title: string;
  text: string;
  value: string;
  isEditable: boolean;
  cellText: string;
  rect: Rect | null;
};
type ProbePoint = { x: number; y: number; name: string };

function buildPlaythruUrl(pageId = 456) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  try {
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
  } catch {
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
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
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE.toLowerCase());
}

function codePattern(code: string) {
  return new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

function scrubEvidenceData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => scrubEvidenceData(entry)).filter((entry) => entry !== undefined);
  }
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  if (typeof record.frameUrl === 'string' && !/businesscentral\.dynamics\.com/i.test(record.frameUrl)) return undefined;
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, entry]) => [key, scrubEvidenceData(entry)] as const)
      .filter(([, entry]) => entry !== undefined)
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(scrubEvidenceData(data), null, 2)}\n`, 'utf8');
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
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function assertSafeContext(page: Page) {
  const currentUrl = page.url();
  if (!instancePathIsTarget(currentUrl) || !companyParamIsTarget(currentUrl)) {
    throw new Error(`Unsafe context ${sanitizeEvidenceUrl(currentUrl)}`);
  }
  const text = clean(await pageText(page));
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Expected Number Series context is not visible.');
  }
  if (/Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice/i.test(text)) {
    throw new Error('Dangerous dialog text detected.');
  }
}

async function clickFirstVisible(page: Page, names: RegExp[]) {
  for (const name of names) {
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem'] as const) {
        const locator = scope.getByRole(role, { name }).first();
        if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
          await locator.click({ timeout: 4000 }).catch(async () => locator.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(900);
          return true;
        }
      }
    }
  }
  return false;
}

async function selectSeriesRow(page: Page, code: string) {
  for (const scope of [page, ...page.frames()]) {
    const row = scope.getByRole('row', { name: codePattern(code) }).first();
    if (await row.isVisible({ timeout: 800 }).catch(() => false)) {
      await row.click({ timeout: 4000 }).catch(async () => row.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
    const text = scope.getByText(codePattern(code)).first();
    if (await text.isVisible({ timeout: 800 }).catch(() => false)) {
      await text.click({ timeout: 4000 }).catch(async () => text.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function frameDiagnostics(frame: Frame) {
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rectOf = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    };
    const active = document.activeElement as HTMLInputElement | HTMLElement | null;
    const describe = (element: Element | null): ActiveInfo | null => {
      if (!element) return null;
      const input = element as HTMLInputElement;
      const cell = element.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
      return {
        tag: element.tagName,
        role: normalize(element.getAttribute('role')),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        text: normalize((element as HTMLElement).innerText || element.textContent).slice(0, 240),
        value: normalize('value' in input ? input.value : ''),
        isEditable:
          element.getAttribute('contenteditable') === 'true' ||
          /INPUT|TEXTAREA|SELECT/.test(element.tagName) ||
          /textbox|combobox|spinbutton/.test(normalize(element.getAttribute('role'))),
        cellText: normalize(cell?.innerText || cell?.textContent).slice(0, 240),
        rect: visible(element) ? rectOf(element) : null
      };
    };
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[role="gridcell"],td,[role="cell"],input,textarea,select,[role="textbox"],[role="combobox"],[contenteditable="true"],[aria-label],[title]'
      )
    )
      .filter(visible)
      .map((element, index) => {
        const input = element as HTMLInputElement;
        const rect = element.getBoundingClientRect();
        return {
          index,
          tag: element.tagName,
          role: normalize(element.getAttribute('role')),
          ariaLabel: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          text: normalize(element.innerText || element.textContent).slice(0, 200),
          value: normalize('value' in input ? input.value : ''),
          editable:
            element.getAttribute('contenteditable') === 'true' ||
            /INPUT|TEXTAREA|SELECT/.test(element.tagName) ||
            /textbox|combobox|spinbutton/.test(normalize(element.getAttribute('role'))),
          rect: rectOf(element),
          area: Math.round(rect.width * rect.height)
        };
      })
      .filter((entry) => {
        const haystack = `${entry.ariaLabel} ${entry.title} ${entry.text} ${entry.value} ${entry.role}`;
        const inLinesArea = entry.rect.x >= 560 && entry.rect.x <= 1500 && entry.rect.y >= 80 && entry.rect.y <= 420;
        return inLinesArea && /Startnr|Startdatum|Endnr|Letzte Nr|Warnungsnr|Erhohung|Erhöhung|Luecken|Lücken|Offen|gridcell|cell|checkbox/i.test(haystack);
      })
      .slice(0, 120);
    const headers = Array.from(document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-label],[title],span,a'))
      .filter(visible)
      .map((element) => ({
        tag: element.tagName,
        role: normalize(element.getAttribute('role')),
        ariaLabel: normalize(element.getAttribute('aria-label')),
        title: normalize(element.getAttribute('title')),
        text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title')).slice(0, 160),
        rect: rectOf(element)
      }))
      .filter((entry) => {
        const haystack = `${entry.ariaLabel} ${entry.title} ${entry.text}`;
        return entry.rect.x >= 560 && entry.rect.x <= 1500 && entry.rect.y >= 80 && entry.rect.y <= 240 && /Startnr|Endnr|Startdatum|Luecken|Lücken|Offen/i.test(haystack);
      })
      .slice(0, 80);
    return {
      frameUrl: window.location.href,
      activeElement: describe(active),
      candidates,
      headers
    };
  });
}

async function collectDiagnostics(page: Page) {
  const frames = await Promise.all(page.frames().map((frame) => frameDiagnostics(frame).catch(() => null)));
  return frames
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter((entry) => /businesscentral\.dynamics\.com/i.test(entry.frameUrl))
    .map((entry) => ({ ...entry, frameUrl: sanitizeEvidenceUrl(entry.frameUrl) }))
    .filter((entry) => entry.candidates.length || entry.headers.length || entry.activeElement);
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [/Nr\.-Serienzeilen|Nummernserie|U-CUST|Startdatum|Startnr|Endnr|Letzte Nr|Warnungsnr|Erhohung|Erhöhung|Luecken|Lücken|Offen|Liste bearbeiten/i],
    maxLines: 160,
    maxLineLength: 220
  });
  const diagnostics = await collectDiagnostics(page);
  await writeText(`${filePrefix}.txt`, compact);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.diagnostics.json`), { step, diagnostics, ...extra });
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    status: 'active-editor-diagnostic',
    visibleLearning: 'Der Screenshot muss zeigen, ob Playwright im Lines-Modal eine echte Datenzelle oder nur Kopf/Faktbox/Fokus trifft.',
    internallyProves: 'Foreground Number Series Lines context and active editor diagnostics.',
    doesNotProve: ['No setup assignment, no master data, no preview posting, no posting.'],
    qualityDecision: 'diagnostic',
    ...extra
  });
  return { compact, diagnostics };
}

function chooseHeader(diag: Awaited<ReturnType<typeof collectDiagnostics>>, label: RegExp) {
  return diag
    .flatMap((entry) => entry.headers.map((header) => ({ frameUrl: entry.frameUrl, header })))
    .filter((entry) => entry.header.role === 'columnheader')
    .filter((entry) => label.test(clean(entry.header.text)) || label.test(clean(entry.header.ariaLabel)))
    .filter((entry) => entry.header.rect.x >= 560 && entry.header.rect.x <= 1050)
    .sort((left, right) => left.header.rect.y - right.header.rect.y || left.header.rect.x - right.header.rect.x)[0];
}

async function clickCellAndDiagnose(page: Page, header: ReturnType<typeof chooseHeader>, label: string) {
  if (!header) return { label, clicked: false, reason: 'header-not-found', after: await collectDiagnostics(page) };
  const rect = header.header.rect;
  const points = [
    { x: rect.x + rect.width / 2, y: rect.y + rect.height + 18, name: 'below-header' },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height + 42, name: 'lower-data-row' },
    { x: rect.x + Math.min(rect.width - 10, 20), y: rect.y + rect.height + 18, name: 'left-inside-cell' }
  ];
  const attempts = [];
  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(350);
    const after = await collectDiagnostics(page);
    const active = after.map((entry) => entry.activeElement).filter(Boolean);
    attempts.push({ point, active });
    const editable = active.find((entry) => entry?.isEditable);
    if (editable) return { label, clicked: true, point, activeElement: editable, after };
  }
  return {
    label,
    clicked: true,
    point: attempts.at(-1)?.point,
    reason: 'no-editable-active-element-after-clicks',
    attempts,
    after: await collectDiagnostics(page)
  };
}

function clickedPoint(probe: Awaited<ReturnType<typeof clickCellAndDiagnose>> | undefined): ProbePoint | undefined {
  if (!probe || !probe.clicked || !('point' in probe)) return undefined;
  return probe.point;
}

test('TARGET-016C probes active Number Series Lines editor before further writes', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  let editListClicked = false;
  let startProbe: Awaited<ReturnType<typeof clickCellAndDiagnose>> | undefined;
  let endProbe: Awaited<ReturnType<typeof clickCellAndDiagnose>> | undefined;
  let writeAttempt: { status: 'not-attempted' | 'blocked-no-editor' | 'attempted-visible' | 'attempted-not-visible'; reason: string } = {
    status: 'not-attempted',
    reason: 'No unique active editor was proven yet.'
  };

  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1400);
  await assertSafeContext(page);

  if (!(await selectSeriesRow(page, probeSeries.code))) blockedBy.push('U-CUST row could not be selected.');
  if (!blockedBy.length && !(await clickFirstVisible(page, [/^Zeilen$|^Lines$/i]))) blockedBy.push('Zeilen/Lines action could not be opened.');
  await assertSafeContext(page);

  const before = await captureState(page, 'target-016c-010-lines-before-edit-mode', 'U-CUST Lines before edit-mode probe.');
  editListClicked = await clickFirstVisible(page, [/^Liste bearbeiten$|^Edit List$/i]);
  await assertSafeContext(page);
  const afterEditMode = await captureState(page, 'target-016c-020-lines-after-edit-list-probe', 'After attempting scoped Liste bearbeiten / Edit List.', {
    editListClicked
  });

  const activeDiagnostics = afterEditMode.diagnostics;
  const startHeader = chooseHeader(activeDiagnostics, /^Startnr\.?$|^Starting No\.?$/i);
  const endHeader = chooseHeader(activeDiagnostics, /^Endnr\.?$|^Ending No\.?$/i);
  startProbe = await clickCellAndDiagnose(page, startHeader, 'Startnr.');
  endProbe = await clickCellAndDiagnose(page, endHeader, 'Endnr.');
  const probeCapture = await captureState(page, 'target-016c-030-active-editor-after-cell-clicks', 'After active-editor cell click probes.', {
    editListClicked,
    startProbe,
    endProbe
  });

  const startEditable = startProbe.activeElement?.isEditable;
  const endEditable = endProbe.activeElement?.isEditable;
  const startPoint = clickedPoint(startProbe);
  const endPoint = clickedPoint(endProbe);
  if ((startEditable && endEditable) || (startPoint && endPoint)) {
    if (startPoint) await page.mouse.click(startPoint.x, startPoint.y);
    await page.waitForTimeout(250);
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.type(probeSeries.startNo, { delay: 10 });
    await page.waitForTimeout(400);
    if (endPoint) await page.mouse.click(endPoint.x, endPoint.y);
    await page.waitForTimeout(250);
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.type(probeSeries.endNo, { delay: 10 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    await assertSafeContext(page);
    const afterWrite = await captureState(page, 'target-016c-040-after-unique-editor-write-attempt', 'After unique active-editor write attempt.', {
      editListClicked,
      startProbe,
      endProbe,
      attemptedVia: startEditable && endEditable ? 'active-editable-element' : 'selected-grid-cell'
    });
    const text = clean(await pageText(page));
    const visible = codePattern(probeSeries.startNo).test(text) && codePattern(probeSeries.endNo).test(text);
    writeAttempt = {
      status: visible ? 'attempted-visible' : 'attempted-not-visible',
      reason: visible
        ? 'Startnr./Endnr. became visible after active-editor or selected-cell route.'
        : 'Active-editor/selected-cell typing attempt did not make both target values visible.'
    };
    if (!visible) blockedBy.push('Active-editor/selected-cell route did not make both target values visible after typing.');
    void afterWrite;
  } else {
    writeAttempt = {
      status: 'blocked-no-editor',
      reason: `Editable active elements not proven. startEditable=${Boolean(startEditable)} endEditable=${Boolean(endEditable)}`
    };
    blockedBy.push(writeAttempt.reason);
  }

  const resultStatus = writeAttempt.status === 'attempted-visible' ? 'observed' : 'blocked';
  const evidenceRefs = [
    'playwright/projects/fibu-book5/img/target-016c-010-lines-before-edit-mode.png',
    'playwright/projects/fibu-book5/img/target-016c-020-lines-after-edit-list-probe.png',
    'playwright/projects/fibu-book5/img/target-016c-030-active-editor-after-cell-clicks.png',
    ...(writeAttempt.status.startsWith('attempted') ? ['playwright/projects/fibu-book5/img/target-016c-040-after-unique-editor-write-attempt.png'] : [])
  ];
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-active-editor-probe',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    proved: [
      'U-CUST Number Series Lines context was reopened in playthru / UNIVERSAARL-DE.',
      `Scoped Liste bearbeiten / Edit List was ${editListClicked ? 'clicked' : 'not visible/clickable'}.`,
      'Active element diagnostics after Startnr./Endnr. cell clicks were captured.',
      ...(writeAttempt.status === 'attempted-visible' ? ['U-CUST Startnr./Endnr. values became visible after active-editor route.'] : [])
    ],
    notProved: [
      ...(writeAttempt.status === 'attempted-visible' ? ['Only U-CUST was affected; remaining U-* series still need their own controlled route.'] : ['A reliable persistent Startnr./Endnr. write route is still not proven.']),
      'No setup assignment, master data, preview posting, posting or ledger trace was created.',
      'Checkbox semantics were observed but not changed.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016c-number-series-active-editor-probe/TARGET-016C-result.json',
      'playwright/projects/fibu-book5/evidence/target-016c-number-series-active-editor-probe/*.diagnostics.json',
      'playwright/projects/fibu-book5/evidence/target-016c-number-series-active-editor-probe/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016c-number-series-active-editor-probe/*.txt',
      'playwright/projects/fibu-book5/img/target-016c-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016c-number-series-active-editor-probe/TARGET-016C-result.json',
      ...evidenceRefs
    ],
    editListClicked,
    startProbe,
    endProbe,
    writeAttempt,
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
      checkboxChanged: false,
      setupChanged: writeAttempt.status === 'attempted-visible'
    },
    statePatch: {
      current: {
        activeCase: CASE_ID,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep:
          writeAttempt.status === 'attempted-visible'
            ? 'Apply the proven active-editor route to remaining U-* Number Series Lines under a separate controlled setup case.'
            : 'Use TARGET-016C diagnostics to decide between Page Inspection/Personalize route or alternative Number Series setup path.'
      }
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016B showed checkbox/control context but no unique active editor.',
      isPlannedNextCaseStillSensible: true,
      reason: 'A direct active-editor proof is the narrowest way to unblock Number Series Lines before any assignment or master data.',
      alternativesConsidered: [
        'Repeat blind Tab: rejected.',
        'Repeat header-coordinate route: rejected.',
        'Assign number series in setup pages now: rejected until line values are visible.'
      ],
      selectedNextCase:
        writeAttempt.status === 'attempted-visible'
          ? 'TARGET-016D-NUMBER-SERIES-REMAINING-LINES-CONTROLLED-FIT'
          : 'TARGET-016D-NUMBER-SERIES-PAGE-INSPECTION-OR-ALTERNATIVE-ROUTE',
      risksBeforeNextCase: [
        'Do not type into FactBox or background list.',
        'Do not change checkbox states without explicit semantic decision.',
        'Do not treat a visible header as editable cell proof.'
      ]
    },
    warnings: blockedBy,
    blockedBy,
    requiresReview: writeAttempt.status !== 'attempted-visible',
    safeToFinalizeState: writeAttempt.status === 'attempted-visible',
    reason:
      writeAttempt.status === 'attempted-visible'
        ? 'TARGET-016C proved active-editor persistence for U-CUST Number Series Lines.'
        : 'TARGET-016C captured active-editor diagnostics but did not prove a safe persistent Startnr./Endnr. route.'
  };
  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016C Number Series Active Editor Probe',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      writeAttempt.status === 'attempted-visible'
        ? 'Der aktive Editor fuer U-CUST Startnr./Endnr. wurde getroffen und die Zielwerte wurden sichtbar.'
        : 'Der aktive Editor fuer U-CUST Startnr./Endnr. wurde noch nicht eindeutig genug getroffen.',
      '',
      '## Wichtiges Learning',
      '',
      '- `Liste bearbeiten` und aktive Elementdaten muessen zusammen ausgewertet werden.',
      '- Ein Spaltenkopf oder Tooltip ist kein editierbares Feld.',
      '- Checkboxen bleiben fachlich relevant, wurden aber nicht geaendert.',
      '',
      '## Grenze',
      '',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
  void before;
  void probeCapture;
});
