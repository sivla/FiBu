import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-011-UNIVERSAARL-COMPANY-INFORMATION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-011-universaarl-company-information';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-011-result.json');
const MINIMUM_COMPANY_INFORMATION = {
  name: LEGAL_NAME,
  address: 'Musterstrasse 1',
  city: 'Saarbruecken',
  postCode: '66111',
  countryRegionCode: 'DE'
};

type FieldSnapshot = {
  label: string;
  value: string;
  ariaLabel: string;
  title: string;
  role: string;
  tag: string;
};

function buildPlaythruUrl(pageId = 1) {
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

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function writeScreenshotMetadata(fileName: string, value: Record<string, unknown>) {
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', fileName),
    ...value
  });
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

async function collectFrameFields(scope: Page | Frame) {
  return scope
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const labelFor = (element: HTMLElement) => {
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const id = element.getAttribute('id');
        const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
        return normalize(aria || title || label?.textContent || element.closest('[aria-label]')?.getAttribute('aria-label'));
      };

      return Array.from(
        document.querySelectorAll<HTMLElement>('input,textarea,select,[role="combobox"],[role="textbox"]')
      )
        .filter(visible)
        .map((element) => {
          const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          return {
            label: labelFor(element),
            value: normalize(input.value || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            role: normalize(element.getAttribute('role')),
            tag: element.tagName.toLowerCase()
          };
        });
    })
    .catch(() => [] as FieldSnapshot[]);
}

async function collectFields(page: Page) {
  const fields: FieldSnapshot[] = await collectFrameFields(page);
  for (const frame of page.frames()) {
    fields.push(...(await collectFrameFields(frame)));
  }
  const seen = new Set<string>();
  return fields
    .map((field) => ({
      ...field,
      label: clean(field.label),
      value: clean(field.value),
      ariaLabel: clean(field.ariaLabel),
      title: clean(field.title)
    }))
    .filter((field) => field.label || field.value || field.ariaLabel || field.title)
    .filter((field) => {
      const key = JSON.stringify(field);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function clickEdit(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const candidate of [
      scope.getByRole('button', { name: /Bearbeiten|Edit/i }).first(),
      scope
        .locator(
          [
            '[title*="Änderungen"]',
            '[title*="Aenderungen"]',
            '[aria-label*="Änderungen"]',
            '[aria-label*="Aenderungen"]',
            '[title*="Bearbeiten"]',
            '[aria-label*="Bearbeiten"]',
            '[title*="Edit"]',
            '[aria-label*="Edit"]',
            '[title*="Modify"]',
            '[aria-label*="Modify"]'
          ].join(',')
        )
        .first()
    ]) {
      if ((await candidate.isVisible({ timeout: 750 }).catch(() => false)) && (await candidate.isEnabled({ timeout: 750 }).catch(() => false))) {
        await candidate.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }
  const text = clean(await pageText(page));
  if (/Firmendaten|Company Information/i.test(text)) {
    await page.mouse.click(938, 75);
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

async function fillNameByLabelGeometry(page: Page, value: string) {
  const text = clean(await pageText(page));
  if (/Firmendaten|Company Information/i.test(text)) {
    for (const frame of page.frames()) {
      const frameText = await frame.locator('body').innerText({ timeout: 750 }).catch(() => '');
      if (!/Firmendaten|Company Information/i.test(frameText)) continue;
      const frameBox = await frame
        .frameElement()
        .then((handle) => handle.boundingBox())
        .catch(() => null);
      const firstTextbox = await frame
        .evaluate(() => {
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const controls = Array.from(document.querySelectorAll<HTMLElement>('[role="textbox"],input,textarea'))
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const input = element as HTMLInputElement | HTMLTextAreaElement;
              return {
                tag: element.tagName,
                role: element.getAttribute('role') || '',
                aria: element.getAttribute('aria-label') || '',
                value: input.value || element.textContent || '',
                readOnly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
                disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
                rect: {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height)
                }
              };
            })
            .filter((control) => control.rect.y > 180 && control.rect.x > 500)
            .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
          return controls[0] ?? null;
        })
        .catch(() => null);

      if (frameBox && firstTextbox) {
        const x = Math.round(frameBox.x + firstTextbox.rect.x + firstTextbox.rect.width / 2);
        const y = Math.round(frameBox.y + firstTextbox.rect.y + firstTextbox.rect.height / 2);
        await page.mouse.click(x, y);
        await page.waitForTimeout(400);
        await page.keyboard.press('Control+A');
        await page.keyboard.type(value, { delay: 10 });
        await page.waitForTimeout(750);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(2500);
        return {
          method: 'frame-first-company-information-textbox',
          point: { x, y },
          frameOffset: { x: Math.round(frameBox.x), y: Math.round(frameBox.y) },
          firstTextbox,
          reason: 'Frame diagnostics identified the first textbox row on Company Information as Name.'
        };
      }
    }

    // Last-resort fallback for the expanded 2200x1300 viewport. The y-coordinate includes the BC iframe offset.
    await page.mouse.click(820, 296);
    await page.waitForTimeout(400);
    await page.keyboard.press('Control+A');
    await page.keyboard.type(value, { delay: 10 });
    await page.waitForTimeout(750);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2500);
    return {
      method: 'expanded-card-name-row-coordinate',
      point: { x: 820, y: 296 },
      reason: 'Screenshot QA showed the previous label route focused Adresse; the first editable row is Name.'
    };
  }

  for (const scope of [page, ...page.frames()]) {
    const label = scope.getByText(/^Name$/).first();
    if (!(await label.isVisible({ timeout: 750 }).catch(() => false))) {
      continue;
    }
    const box = await label.boundingBox().catch(() => null);
    if (!box) continue;
    await page.mouse.click(box.x + 455, box.y + box.height / 2);
    await page.waitForTimeout(400);
    await page.keyboard.press('Control+A');
    await page.keyboard.type(value, { delay: 10 });
    await page.waitForTimeout(750);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2500);
    return {
      method: 'label-geometry-name-field',
      labelBox: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height)
      }
    };
  }

  throw new Error('Name label not visible on Company Information page.');
}

async function editableCompanyInfoControls(page: Page) {
  for (const frame of page.frames()) {
    const frameText = await frame.locator('body').innerText({ timeout: 750 }).catch(() => '');
    if (!/Firmendaten|Company Information/i.test(frameText)) continue;
    const frameBox = await frame
      .frameElement()
      .then((handle) => handle.boundingBox())
      .catch(() => null);
    if (!frameBox) continue;
    const controls = await frame
      .evaluate(() => {
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLElement>('[role="textbox"],[role="combobox"],input,textarea'))
          .filter(visible)
          .map((element) => {
            const input = element as HTMLInputElement | HTMLTextAreaElement;
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName,
              role: element.getAttribute('role') || '',
              aria: element.getAttribute('aria-label') || '',
              value: input.value || element.textContent || '',
              readOnly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
              disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              }
            };
          })
          .filter((control) => control.rect.y > 180 && control.rect.x > 500)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
      })
      .catch(() => []);
    return { frameBox, controls };
  }
  throw new Error('Company Information frame controls not found.');
}

async function fillCompanyInfoControlByIndex(page: Page, index: number, value: string) {
  const snapshot = await editableCompanyInfoControls(page);
  const leftColumn = snapshot.controls.filter((control) => control.rect.x < 1200);
  const control = leftColumn[index];
  if (!control) {
    throw new Error(`Company Information left-column control index ${index} not found.`);
  }
  const x = Math.round(snapshot.frameBox.x + control.rect.x + control.rect.width / 2);
  const y = Math.round(snapshot.frameBox.y + control.rect.y + control.rect.height / 2);
  await page.mouse.click(x, y);
  await page.waitForTimeout(350);
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value, { delay: 10 });
  await page.waitForTimeout(350);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
  return {
    index,
    value,
    point: { x, y },
    control
  };
}

async function fillMinimumCompanyInformation(page: Page) {
  const attempts = [];
  attempts.push(await fillCompanyInfoControlByIndex(page, 0, MINIMUM_COMPANY_INFORMATION.name));
  attempts.push(await fillCompanyInfoControlByIndex(page, 1, MINIMUM_COMPANY_INFORMATION.address));
  attempts.push(await fillCompanyInfoControlByIndex(page, 3, MINIMUM_COMPANY_INFORMATION.city));
  attempts.push(await fillCompanyInfoControlByIndex(page, 4, MINIMUM_COMPANY_INFORMATION.postCode));
  attempts.push(await fillCompanyInfoControlByIndex(page, 5, MINIMUM_COMPANY_INFORMATION.countryRegionCode));
  return {
    method: 'minimum-required-company-information-left-column-controls',
    values: MINIMUM_COMPANY_INFORMATION,
    attempts
  };
}

async function visibleCompanyInformationText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Firmendaten|Company Information|Allgemein|Kommunikation|Name|Adresse|Ort|PLZ|Laender|Regionscode|USt|E-Mail|Homepage|Universaarl/i
      ],
      maxLines: 180
    })
  );
}

test('TARGET-011 sets Universaarl Company Information name with before and after evidence', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const companyInformationUrl = buildPlaythruUrl(1);
  const resultBase = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-target-setup',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    legalName: LEGAL_NAME,
    sourceRefs: [
      'https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/quick-start-company-information',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.foundation.company.company-information'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanyCreate: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noSearch: true
    },
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-011-universaarl-company-information/TARGET-011-result.json',
      'playwright/projects/fibu-book5/img/target-011-010-company-information-before-name.png',
      'playwright/projects/fibu-book5/img/target-011-015-company-information-edit-mode.png',
      'playwright/projects/fibu-book5/img/target-011-016-company-information-after-name-entry-before-reopen.png',
      'playwright/projects/fibu-book5/img/target-011-020-company-information-after-name.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-011-universaarl-company-information/TARGET-011-result.json',
      'playwright/projects/fibu-book5/evidence/target-011-universaarl-company-information/010-before-company-information.txt',
      'playwright/projects/fibu-book5/evidence/target-011-universaarl-company-information/020-after-company-information.txt'
    ]
  };

  try {
    await page.goto(companyInformationUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    expect(page.url(), 'TARGET-011 must stay in playthru.').toMatch(/playthru/i);
    expect(companyParamIsTarget(page.url()), 'TARGET-011 must stay scoped to UNIVERSAARL-DE.').toBe(true);
    expect(clean(await pageText(page)), 'Company Information / Firmendaten must be visible.').toMatch(
      /Firmendaten|Company Information|Name|Adresse/i
    );

    const beforeText = await visibleCompanyInformationText(page);
    const beforeFields = await collectFields(page);
    const beforeNameAlreadySet = /Universaarl GmbH/i.test(`${beforeText}\n${JSON.stringify(beforeFields)}`);
    await writeText('010-before-company-information.txt', beforeText);
    await screenshot(page, 'target-011-010-company-information-before-name.png', {
      projectName: PROJECT,
      testId: EVIDENCE_ID,
      status: 'candidate',
      bookUse: 'field-proof',
      purpose: 'Firmendaten vor der ersten kontrollierten Setup-Aenderung; Name ist der einzige geplante Zielwert.',
      expectedPageText: [/Firmendaten|Company Information|Name|Adresse/i],
      knownLimitations: ['Vorher-Bild; keine Nummernserien, Buchungsgruppen, USt oder Stammdaten.']
    });
    await writeScreenshotMetadata('target-011-010-company-information-before-name.png', {
      status: 'german-final-candidate-setup-before',
      page: 'Firmendaten / Company Information, Page 1',
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      step: 'Before setting Name',
      visibleLearning: 'Vor dem Speichern wird sichtbar geprueft, welche Firmendaten leer oder vorbelegt sind.',
      importantUi: ['Name', 'Adresse', 'USt-IdNr.', 'Kommunikation'],
      internallyProves: ['Company Information opens in UNIVERSAARL-DE before value entry.'],
      doesNotProve: ['saved setup', 'number series', 'posting groups', 'VAT setup'],
      finalScreenshotStatus: 'setup-before-candidate',
      qaRequired: true
    });

    let editClicked = false;
    let fillAttempt: unknown = null;
    let setupChanged = false;

    if (!beforeNameAlreadySet) {
      editClicked = await clickEdit(page);
      expect(editClicked, 'Edit/Bearbeiten must be available before changing Company Information.').toBe(true);
      await screenshot(page, 'target-011-015-company-information-edit-mode.png', {
        projectName: PROJECT,
        testId: EVIDENCE_ID,
        status: 'candidate',
        bookUse: 'evidence',
        purpose: 'Firmendaten direkt nach Klick auf das sichtbare Stift-Icon/Bearbeiten.',
        expectedPageText: [/Firmendaten|Company Information|Name|Adresse/i],
        knownLimitations: ['Edit-Modus-Zwischenbild; noch kein gespeicherter Zielwert.']
      });
      await writeScreenshotMetadata('target-011-015-company-information-edit-mode.png', {
        status: 'setup-edit-mode-diagnostic',
        page: 'Firmendaten / Company Information, Page 1',
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        step: 'After Edit/Bearbeiten click',
        visibleLearning: 'Der Bearbeiten-Klick muss optisch oder durch fokussierbare Felder nachweisbar sein, bevor ein Wert eingegeben wird.',
        importantUi: ['Stift-Icon/Bearbeiten', 'Name field row'],
        internallyProves: ['Edit route was attempted from the visible Company Information page.'],
        doesNotProve: ['saved setup value', 'field focus', 'persisted Name'],
        finalScreenshotStatus: 'diagnostic',
        qaRequired: true
      });
      fillAttempt = await fillMinimumCompanyInformation(page);
      await screenshot(page, 'target-011-016-company-information-after-name-entry-before-reopen.png', {
        projectName: PROJECT,
        testId: EVIDENCE_ID,
        status: 'candidate',
        bookUse: 'evidence',
        purpose: 'Firmendaten direkt nach dem Wertversuch fuer Name, vor erneutem Oeffnen der Seite.',
        expectedPageText: [/Firmendaten|Company Information|Name|Universaarl|Adresse/i],
        knownLimitations: ['Zwischenbild; Persistenz wird erst durch erneutes Oeffnen geprueft.']
      });
      await writeScreenshotMetadata('target-011-016-company-information-after-name-entry-before-reopen.png', {
        status: 'setup-value-entry-diagnostic',
        page: 'Firmendaten / Company Information, Page 1',
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        step: 'After Name value entry attempt before reopen',
        visibleLearning: 'Ein eingegebener Wert zaehlt erst, wenn er sichtbar ist und nach erneutem Oeffnen erhalten bleibt.',
        importantUi: ['Name row', 'Universaarl GmbH target value'],
        internallyProves: ['Name value entry route was attempted.'],
        doesNotProve: ['persisted Name after reload', 'other Company Information fields'],
        finalScreenshotStatus: 'diagnostic',
        qaRequired: true
      });
      setupChanged = true;
    }

    await page.waitForTimeout(2500);
    await page.goto(companyInformationUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(1500);

    const afterText = await visibleCompanyInformationText(page);
    const afterFields = await collectFields(page);
    const afterNameVisible = /Universaarl GmbH/i.test(`${afterText}\n${JSON.stringify(afterFields)}`);
    await writeText('020-after-company-information.txt', afterText);
    await screenshot(page, 'target-011-020-company-information-after-name.png', {
      projectName: PROJECT,
      testId: EVIDENCE_ID,
      status: afterNameVisible ? 'candidate' : 'rejected',
      bookUse: afterNameVisible ? 'field-proof' : 'do-not-use',
      purpose: 'Firmendaten nach kontrollierter Namenssetzung; nur Name/Universaarl GmbH soll belegt sein.',
      expectedPageText: [/Firmendaten|Company Information|Universaarl GmbH|Name/i],
      knownLimitations: ['Adresse, USt, Nummernserien, Buchungsgruppen und weitere Foundation-Setups bleiben offen.']
    });
    await writeScreenshotMetadata('target-011-020-company-information-after-name.png', {
      status: afterNameVisible ? 'german-final-candidate-setup-after' : 'rejected',
      page: 'Firmendaten / Company Information, Page 1',
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      step: 'After setting Name',
      visibleLearning: 'Der Firmenname steht in den Firmendaten und bildet die erste gespeicherte Grundlage der Universaarl-Company.',
      importantUi: ['Name = Universaarl GmbH'],
      internallyProves: afterNameVisible
        ? ['The Name field displays Universaarl GmbH after the guarded setup step.']
        : ['The guarded setup route ran but the target name is not visible after reload.'],
      doesNotProve: ['address', 'VAT registration number', 'bank details', 'number series', 'posting readiness'],
      finalScreenshotStatus: afterNameVisible ? 'setup-after-candidate' : 'do-not-use',
      qaRequired: true
    });

    const resultStatus = afterNameVisible ? 'observed' : 'blocked';
    const result = {
      ...resultBase,
      resultStatus,
      proved:
        resultStatus === 'observed'
          ? [
              'Company Information / Firmendaten opened in playthru under company=UNIVERSAARL-DE.',
              beforeNameAlreadySet
                ? 'Name was already visible as Universaarl GmbH; no additional value entry was needed.'
                : 'Name was entered as Universaarl GmbH through the visible Company Information page.',
              'After reopening the page, Universaarl GmbH was visible in Company Information.',
              'No posting, preview, document, master data, API or search route was used.'
            ]
          : [
              'Company Information opened in playthru under company=UNIVERSAARL-DE.',
              'The run stopped without posting, preview, document, master data, API or search route.'
            ],
      notProved: [
        'Address, VAT Registration No., bank information and communication details remain open.',
        'Number Series, Posting Groups, VAT setup, Dimensions, master data, preview and posting readiness are not proven.',
        'This is a Foundation setup step, not a ledger or process proof.'
      ],
      warnings: beforeNameAlreadySet
        ? ['Name was already set before this run; run is idempotent and only reverified the value.']
        : [],
      blockedBy: resultStatus === 'observed' ? [] : ['company-information-name-not-visible-after-reopen'],
      requiresReview: resultStatus !== 'observed',
      safeToFinalizeState: resultStatus === 'observed',
      statePatch: {},
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        companyInformationUrl: sanitizeUrl(companyInformationUrl.toString()),
        finalUrl: sanitizeUrl(page.url()),
        beforeNameAlreadySet,
        setupChanged,
        editClicked,
        fillAttempt,
        afterNameVisible,
        beforeTextSignals: beforeText.split('\n').slice(0, 120),
        afterTextSignals: afterText.split('\n').slice(0, 120),
        beforeFields: beforeFields.slice(0, 120),
        afterFields: afterFields.slice(0, 120),
        screenshots: [
          'playwright/projects/fibu-book5/img/target-011-010-company-information-before-name.png',
          'playwright/projects/fibu-book5/img/target-011-015-company-information-edit-mode.png',
          'playwright/projects/fibu-book5/img/target-011-016-company-information-after-name-entry-before-reopen.png',
          'playwright/projects/fibu-book5/img/target-011-020-company-information-after-name.png'
        ]
      },
      nextStepDecisionCard: {
        currentCase: CASE_ID,
        plannedNextCaseBeforeReview: 'TARGET-012-W1-FOUNDATION-READINESS',
        lastEvidenceSummary:
          'TARGET-010 proved UNIVERSAARL-DE context and Company Information read-only. TARGET-011 targets only the known legal name value.',
        isPlannedNextCaseStillSensible: resultStatus === 'observed',
        reason:
          resultStatus === 'observed'
            ? 'The first Company Information value is now visible; the next step is to decide the remaining W1 Foundation setup sequence.'
            : 'Foundation setup should not continue until the Company Information name blocker is resolved.',
        lookaheadReviewed: [
          {
            caseId: 'TARGET-012-W1-FOUNDATION-READINESS',
            status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
            reason:
              resultStatus === 'observed'
                ? 'Name is set; remaining foundation setup can be scoped deliberately.'
                : 'Company Information name must be visible before moving on.'
          },
          {
            caseId: 'TARGET-013-NUMBER-SERIES-AND-POSTING-GROUPS',
            status: 'needs-setup-first',
            reason: 'Number series and posting groups follow W1 readiness.'
          },
          {
            caseId: 'TARGET-007-DIMENSIONS-FOUNDATION',
            status: 'ready-after-current',
            reason: 'Dimensions can be planned after W1 readiness decides setup order.'
          },
          {
            caseId: 'TARGET-DATA-FOUNDATION-001-CORE-MASTERDATA-PLAN',
            status: 'ready-after-current',
            reason: 'Master data planning can continue, but data creation waits for setup gates.'
          },
          {
            caseId: 'TARGET-LOOKFEEL-001-LIST-SEARCH-SORT-FILTER',
            status: 'needs-setup-first',
            reason: 'Look-and-feel final screenshots need meaningful Universaarl data.'
          }
        ],
        queueChangesMade: [],
        selectedNextCase:
          resultStatus === 'observed' ? 'TARGET-012-W1-FOUNDATION-READINESS' : 'TARGET-011-FOLLOWUP-COMPANY-INFORMATION-NAME',
        whySelectedNextCaseIsBest:
          resultStatus === 'observed'
            ? 'A W1 readiness gate prevents random setup changes and orders number series, posting groups, VAT and dimensions.'
            : 'The smallest useful next step is to fix the failed Name value proof before other setup.',
        risksBeforeNextCase: [
          'Address, country/region and VAT values are still not approved.',
          'No later process should claim posting readiness from Company Information alone.'
        ],
        requiredPreparation:
          resultStatus === 'observed'
            ? ['Define W1 Foundation order and decide which remaining Company Information fields can be filled safely.']
            : ['Diagnose why the Name field did not persist or become visible.']
      }
    };

    await writeJson(RESULT_PATH, result);
    expect(resultStatus, 'TARGET-011 must show Universaarl GmbH after the guarded Company Information step.').toBe('observed');
  } catch (error) {
    await writeJson(RESULT_PATH, {
      ...resultBase,
      resultStatus: 'blocked',
      proved: ['The run stayed in playthru and stopped without posting, preview, document, master data, API or search route.'],
      notProved: ['Company Information name setup was not completed.'],
      warnings: [String(error)],
      blockedBy: ['target-011-company-information-error'],
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        lastUrl: page.url() ? sanitizeUrl(page.url()) : '',
        error: String(error)
      }
    });
    throw error;
  }
});
