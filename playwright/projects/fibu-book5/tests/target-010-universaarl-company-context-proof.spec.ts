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

const CASE_ID = 'TARGET-010-UNIVERSAARL-COMPANY-CONTEXT-PROOF';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-010-universaarl-company-context-proof';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-010-result.json');

type UiField = {
  label: string;
  value: string;
  ariaLabel: string;
  title: string;
  role: string;
  tag: string;
};

function buildPlaythruUrl(pageId?: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  if (pageId) {
    url.searchParams.set('page', String(pageId));
  } else {
    url.searchParams.delete('page');
  }
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
    .catch(() => [] as UiField[]);
}

async function collectFields(page: Page) {
  const fields: UiField[] = await collectFrameFields(page);
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

async function clickSettingsButton(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const label = [
              element.innerText || element.textContent,
              element.getAttribute('aria-label'),
              element.getAttribute('title')
            ]
              .map(normalize)
              .filter(Boolean)
              .join(' ');
            return { element, label, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          })
          .filter((entry) => entry.y <= 120)
          .filter((entry) => /Settings|Einstellungen|Setup and Extensions|Einrichtungen und Erweiterungen/i.test(entry.label))
          .sort((left, right) => right.x - left.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'settings-button-not-found' };
        chosen.element.click();
        return {
          clicked: true,
          chosen: {
            label: chosen.label,
            x: Math.round(chosen.x),
            y: Math.round(chosen.y),
            width: Math.round(chosen.width),
            height: Math.round(chosen.height)
          }
        };
      })
      .catch((error) => ({ clicked: false, reason: 'settings-evaluate-error', error: String(error) }));
    if (result.clicked) return result;
  }
  return { clicked: false, reason: 'settings-button-not-found-in-any-frame' };
}

async function clickMySettingsMenuItem(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const label = [
              element.innerText || element.textContent,
              element.getAttribute('aria-label'),
              element.getAttribute('title')
            ]
              .map(normalize)
              .filter(Boolean)
              .join(' ');
            return { element, label, x: rect.x, y: rect.y };
          })
          .filter((entry) => /My Settings|Meine Einstellungen/i.test(entry.label))
          .sort((left, right) => left.y - right.y || left.x - right.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'my-settings-menuitem-not-found' };
        chosen.element.click();
        return {
          clicked: true,
          chosen: {
            label: chosen.label,
            x: Math.round(chosen.x),
            y: Math.round(chosen.y)
          }
        };
      })
      .catch((error) => ({ clicked: false, reason: 'my-settings-evaluate-error', error: String(error) }));
    if (result.clicked) return result;
  }
  return { clicked: false, reason: 'my-settings-menuitem-not-found-in-any-frame' };
}

async function maskPersonalDataForScreenshot(page: Page) {
  const replacements = [
    {
      pattern: /Meine Einstellungen\s*-\s*[^\n]+/i,
      replacement: 'Meine Einstellungen - Benutzer'
    },
    {
      pattern: /My Settings\s*-\s*[^\n]+/i,
      replacement: 'My Settings - User'
    },
    {
      pattern: /Dateien von [^\n]+ auf OneDrive/i,
      replacement: 'Cloud-Speicher'
    },
    {
      pattern: /Ihre letzte Anmeldung erfolgte[^\n]+/i,
      replacement: 'Ihre letzte Anmeldung wurde fuer den Screenshot maskiert.'
    }
  ];

  for (const frame of page.frames()) {
    await frame
      .evaluate((entries) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const textNodes: Text[] = [];
        while (walker.nextNode()) {
          textNodes.push(walker.currentNode as Text);
        }
        for (const node of textNodes) {
          let value = node.nodeValue || '';
          for (const entry of entries) {
            value = value.replace(new RegExp(entry.pattern, entry.flags), entry.replacement);
          }
          node.nodeValue = value;
        }
        for (const element of Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))) {
          let value = element.value || '';
          for (const entry of entries) {
            value = value.replace(new RegExp(entry.pattern, entry.flags), entry.replacement);
          }
          if (value !== element.value) {
            element.value = value;
          }
        }
      }, replacements.map((entry) => ({ pattern: entry.pattern.source, flags: entry.pattern.flags, replacement: entry.replacement })))
      .catch(() => undefined);
  }
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

test('TARGET-010 proves UNIVERSAARL-DE company context and reads Company Information without setup changes', async ({
  page
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const roleCenterUrl = buildPlaythruUrl();
  const companyInformationUrl = buildPlaythruUrl(1);

  const resultBase = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-target-readonly',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    legalName: LEGAL_NAME,
    flags: {
      noWrite: true,
      noSave: true,
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noDraft: true,
      noSetupChange: true,
      noCompanyCreate: true,
      noApiShortcut: true,
      noBookChange: true,
      noSearch: true
    },
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-010-universaarl-company-context-proof/TARGET-010-result.json',
      'playwright/projects/fibu-book5/img/target-010-010-role-center-company-context.png',
      'playwright/projects/fibu-book5/img/target-010-020-my-settings-company-context.png',
      'playwright/projects/fibu-book5/img/target-010-030-company-information-readonly.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-010-universaarl-company-context-proof/TARGET-010-result.json',
      'playwright/projects/fibu-book5/evidence/target-010-universaarl-company-context-proof/010-role-center-context.txt',
      'playwright/projects/fibu-book5/evidence/target-010-universaarl-company-context-proof/020-my-settings-context.txt',
      'playwright/projects/fibu-book5/evidence/target-010-universaarl-company-context-proof/030-company-information-context.txt'
    ]
  };

  try {
    await page.goto(roleCenterUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    expect(page.url(), 'TARGET-010 must stay in playthru.').toMatch(/playthru/i);
    expect(companyParamIsTarget(page.url()), 'TARGET-010 role center URL must be scoped to UNIVERSAARL-DE.').toBe(true);

    const roleCenterText = clean(
      await compactPageText(page, {
        include: [/Business Central|Suchen|Search|UNIVERSAARL|Mandant|Company|Role Center|Einstellungen|Settings/i],
        maxLines: 100
      })
    );
    const roleCenterCompanyHeaderVisible = /UNIVERSAARL-DE/i.test(roleCenterText);
    await writeText('010-role-center-context.txt', roleCenterText);
    await screenshot(page, 'target-010-010-role-center-company-context.png', {
      projectName: PROJECT,
      testId: EVIDENCE_ID,
      status: 'candidate',
      bookUse: 'navigation',
      purpose: 'Role Center mit URL-Kontext company=UNIVERSAARL-DE oeffnen; keine Suche und keine wirksame Aktion.',
      expectedPageText: [/Business Central|Suchen|Search/i],
      knownLimitations: ['Der Screenshot allein zeigt den Mandanten nicht zwingend sichtbar; My Settings und URL-Kontext ergaenzen den Beweis.']
    });
    await writeScreenshotMetadata('target-010-010-role-center-company-context.png', {
      status: 'german-final-candidate-context',
      page: 'Role Center / Business Central Shell',
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      step: 'Direct playthru URL with company=UNIVERSAARL-DE',
      visibleLearning: 'Die Startseite ist der Einstieg. Fuer den Mandantenbeweis braucht man zusaetzlich den sichtbaren Company-Kontext.',
      importantUi: ['Topbar', 'Search/Suchen', 'Settings/Einstellungen', 'current page shell'],
      internallyProves: ['Business Central opened in playthru.', 'The browser context is scoped to company=UNIVERSAARL-DE.'],
      doesNotProve: ['Company Information values', 'setup completeness', 'posting readiness'],
      finalScreenshotStatus: 'draft-candidate',
      qaRequired: true
    });

    const settingsClick = await clickSettingsButton(page);
    let mySettingsObserved = false;
    let mySettingsTargetCompanyVisible = false;
    let mySettingsFields: UiField[] = [];
    let mySettingsText = '';
    let mySettingsClick: unknown = { clicked: false, reason: 'not-attempted-settings-button-missing' };
    if (settingsClick.clicked) {
      await page.waitForTimeout(700);
      mySettingsClick = await clickMySettingsMenuItem(page);
      await page.waitForTimeout(1500);
      await maskPersonalDataForScreenshot(page);
      mySettingsText = clean(
        await compactPageText(page, {
          include: [
            /My Settings|Meine Einstellungen|Company|Unternehmen|Mandant|Firma|Role|Rolle|Language|Sprache|Work Date|Arbeitsdatum|UNIVERSAARL/i
          ],
          maxLines: 120
        })
      );
      mySettingsFields = await collectFields(page);
      mySettingsObserved = /My Settings|Meine Einstellungen/i.test(clean(await pageText(page)));
      mySettingsTargetCompanyVisible = mySettingsFields.some((field) => /UNIVERSAARL-DE/i.test(field.value));
      await writeText('020-my-settings-context.txt', mySettingsText);
      await screenshot(page, 'target-010-020-my-settings-company-context.png', {
        projectName: PROJECT,
        testId: EVIDENCE_ID,
        status: mySettingsObserved ? 'candidate' : 'rejected',
        bookUse: mySettingsObserved ? 'navigation' : 'do-not-use',
        purpose:
          'Meine Einstellungen zeigt Rollen-/Sprache-/Arbeitsdatums-Kontext; der Mandant kann vom aktiven Shell-Kontext abweichen und ist daher kein alleiniger Aktiv-Company-Beweis.',
        expectedPageText: [/My Settings|Meine Einstellungen|Company|Unternehmen|Mandant|Role|Rolle|Language|Sprache/i],
        knownLimitations: ['Kein OK, kein Speichern, kein Company-Wechsel-Dialog, keine Setup-Aenderung.']
      });
      await writeScreenshotMetadata('target-010-020-my-settings-company-context.png', {
        status: mySettingsObserved ? 'german-final-candidate-context' : 'rejected',
        page: 'My Settings / Meine Einstellungen',
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        step: 'Settings menu -> My Settings, read-only',
        visibleLearning:
          'Meine Einstellungen zeigt Benutzerkontext wie Rolle, Sprache und Arbeitsdatum. Der dortige Mandant ist nicht automatisch der aktive Shell-Mandant, wenn die URL explizit eine Company setzt.',
        importantUi: ['Mandant/Company', 'Rolle/Role', 'Sprache/Language', 'Arbeitsdatum/Work Date', 'Abbrechen/Cancel'],
        internallyProves: mySettingsObserved
          ? ['Visible My Settings context opened without saving.', 'My Settings can expose a default company value that differs from the active shell header.']
          : ['Settings route stayed read-only, but visible My Settings context was incomplete.'],
        doesNotProve: [
          'active company by itself',
          'Company Information setup values',
          'posting readiness',
          'VAT or chart-of-accounts setup'
        ],
        finalScreenshotStatus: mySettingsObserved ? 'draft-candidate' : 'do-not-use',
        piiMasking: 'User-specific title and last-login text are masked before screenshot.',
        qaRequired: true
      });
    }

    await page.goto(companyInformationUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    expect(page.url(), 'Company Information page must stay in playthru.').toMatch(/playthru/i);
    expect(companyParamIsTarget(page.url()), 'Company Information URL must be scoped to UNIVERSAARL-DE.').toBe(true);

    const companyInformationFullText = clean(await pageText(page));
    const companyInformationObserved = /Company Information|Unternehmensinformationen|Firmendaten|Company Name|Name|Address|Adresse/i.test(
      companyInformationFullText
    );
    const companyInformationText = clean(
      await compactPageText(page, {
        include: [
          /Company Information|Unternehmensinformationen|Firmendaten|Company Name|Name|Address|Adresse|Country|Land|VAT|USt|Phone|Telefon|E-Mail|Email|Picture|Bild/i
        ],
        maxLines: 180
      })
    );
    const companyInformationFields = await collectFields(page);
    await writeText('030-company-information-context.txt', companyInformationText);
    await screenshot(page, 'target-010-030-company-information-readonly.png', {
      projectName: PROJECT,
      testId: EVIDENCE_ID,
      status: companyInformationObserved ? 'candidate' : 'rejected',
      bookUse: companyInformationObserved ? 'field-proof' : 'do-not-use',
      purpose:
        'Company Information/Firmendaten fuer UNIVERSAARL-DE read-only oeffnen; relevante Felder sichtbar machen, ohne Werte zu aendern.',
      expectedPageText: [/Company Information|Unternehmensinformationen|Firmendaten|Company Name|Name|Address|Adresse/i],
      knownLimitations: ['Keine Werte geaendert oder gespeichert; noch kein Foundation-Setup und keine Buchungsfaehigkeit.']
    });
    await writeScreenshotMetadata('target-010-030-company-information-readonly.png', {
      status: companyInformationObserved ? 'german-final-candidate-field-context' : 'rejected',
      page: 'Company Information / Firmendaten, Page 1',
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      step: 'Direct read-only open with company=UNIVERSAARL-DE',
      visibleLearning:
        'Firmendaten enthalten Name, Adresse, Land/Region, Kontakt- und Steuer-/Registrierungsfelder. Diese Seite ist der erste Foundation-Setup-Ort.',
      importantUi: ['Name', 'Address/Adresse', 'Country/Region', 'VAT/USt', 'Contact fields'],
      internallyProves: companyInformationObserved
        ? ['Page 1 opens in playthru under company=UNIVERSAARL-DE.', 'Company Information can be inspected before setup changes.']
        : ['The direct page route stayed scoped to playthru/UNIVERSAARL-DE, but the expected page text was not visible.'],
      doesNotProve: ['saved company legal data', 'number series', 'posting groups', 'VAT setup', 'posting readiness'],
      finalScreenshotStatus: companyInformationObserved ? 'draft-candidate' : 'do-not-use',
      qaRequired: true
    });

    const resultStatus = companyInformationObserved && roleCenterCompanyHeaderVisible && mySettingsObserved ? 'observed' : 'blocked';
    const blockedBy = [
      ...(roleCenterCompanyHeaderVisible ? [] : ['role-center-company-header-not-visible']),
      ...(mySettingsObserved ? [] : ['my-settings-context-not-visible']),
      ...(companyInformationObserved ? [] : ['company-information-page-context-not-visible'])
    ];
    const mySettingsCompanyMismatch =
      mySettingsObserved && !mySettingsTargetCompanyVisible
        ? ['My Settings did not show UNIVERSAARL-DE as Mandant; it appears to expose a personal/default company value. Active company proof uses the Role Center header plus company-scoped URL instead.']
        : [];

    const result = {
      ...resultBase,
      resultStatus,
      proved:
        resultStatus === 'observed'
          ? [
              'Business Central opened in playthru with company=UNIVERSAARL-DE.',
              'Role Center visibly showed UNIVERSAARL-DE as shell company context.',
              'My Settings / Meine Einstellungen was opened read-only and captured as user-context evidence, but not used alone as active-company proof.',
              'Company Information / Firmendaten was opened read-only by Page 1 under company=UNIVERSAARL-DE.',
              'No Search/Tell-Me route, no setup save and no posting/preview/document action was used.'
            ]
          : [
              'Business Central opened in playthru with company=UNIVERSAARL-DE.',
              'The test stayed read-only and did not perform setup, posting, preview or document actions.'
            ],
      notProved: [
        'No Company Information value was changed or saved.',
        'My Settings is not accepted as the sole active-company proof because it may show a personal/default company value.',
        'No Number Series, Posting Groups, VAT setup, Dimensions, master data, preview or posting readiness is proven.',
        'The URL/context proof is not a business-process or ledger proof.'
      ],
      warnings:
        resultStatus === 'observed'
          ? mySettingsCompanyMismatch
          : ['One or more visible UI context checks stayed incomplete; do not start setup until fixed or consciously accepted.'],
      blockedBy,
      requiresReview: resultStatus !== 'observed',
      safeToFinalizeState: resultStatus === 'observed',
      statePatch: {},
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        roleCenterUrl: sanitizeUrl(roleCenterUrl.toString()),
        finalRoleCenterUrl: sanitizeUrl(roleCenterUrl.toString()),
        roleCenterCompanyHeaderVisible,
        mySettingsOpened: mySettingsObserved,
        mySettingsTargetCompanyVisible,
        mySettingsFieldCompanyValues: mySettingsFields
          .filter((field) => /CRONUS|UNIVERSAARL|Mandant|Company|Unternehmen/i.test(`${field.label} ${field.value} ${field.title}`))
          .slice(0, 20),
        settingsClick,
        mySettingsClick,
        mySettingsTextSignals: mySettingsText.split('\n').slice(0, 80),
        mySettingsFields: mySettingsFields.slice(0, 80),
        companyInformationUrl: sanitizeUrl(companyInformationUrl.toString()),
        finalCompanyInformationUrl: sanitizeUrl(page.url()),
        companyInformationObserved,
        companyInformationTextSignals: companyInformationText.split('\n').slice(0, 120),
        companyInformationFields: companyInformationFields.slice(0, 120),
        screenshots: [
          'playwright/projects/fibu-book5/img/target-010-010-role-center-company-context.png',
          'playwright/projects/fibu-book5/img/target-010-020-my-settings-company-context.png',
          'playwright/projects/fibu-book5/img/target-010-030-company-information-readonly.png'
        ]
      },
      nextStepDecisionCard: {
        currentCase: CASE_ID,
        plannedNextCaseBeforeReview: 'TARGET-011-UNIVERSAARL-COMPANY-INFORMATION',
        lastEvidenceSummary:
          'TARGET-009 created/verified UNIVERSAARL-DE using the no-data company creation wizard. TARGET-010 checks whether the active context and Company Information can be read safely.',
        isPlannedNextCaseStillSensible: resultStatus === 'observed',
        reason:
          resultStatus === 'observed'
            ? 'Company context and Company Information page are now read-only proven, so a separate setup-decision case may prepare actual values.'
            : 'A visible context blocker remains; setup should not start until the blocker is resolved.',
        lookaheadReviewed: [
          {
            caseId: 'TARGET-011-UNIVERSAARL-COMPANY-INFORMATION',
            status: resultStatus === 'observed' ? 'ready-after-current' : 'blocked',
            reason:
              resultStatus === 'observed'
                ? 'The read-only page and context proof exist; next case can decide and set legal company values.'
                : 'Company Information setup waits for complete visible context proof.'
          },
          {
            caseId: 'TARGET-012-W1-FOUNDATION-READINESS',
            status: 'needs-setup-first',
            reason: 'Foundation readiness depends on Company Information and setup decisions.'
          },
          {
            caseId: 'TARGET-013-NUMBER-SERIES-AND-POSTING-GROUPS',
            status: 'needs-setup-first',
            reason: 'Number series and posting groups follow after Company Information/foundation setup.'
          },
          {
            caseId: 'TARGET-007-DIMENSIONS-FOUNDATION',
            status: 'needs-setup-first',
            reason: 'Dimensions should be created after the base company setup scope is fixed.'
          },
          {
            caseId: 'TARGET-DATA-FOUNDATION-001-CORE-MASTERDATA-PLAN',
            status: 'ready-after-current',
            reason: 'Master data planning can proceed, but creation waits for setup gates.'
          }
        ],
        queueChangesMade: [],
        selectedNextCase:
          resultStatus === 'observed'
            ? 'TARGET-011-UNIVERSAARL-COMPANY-INFORMATION'
            : 'TARGET-010-FOLLOWUP-VISIBLE-COMPANY-CONTEXT',
        whySelectedNextCaseIsBest:
          resultStatus === 'observed'
            ? 'The next valuable step is a controlled Company Information setup decision, not more company-creation probing.'
            : 'The safest next step is to fix the visible context proof before any setup values are entered.',
        risksBeforeNextCase: resultStatus === 'observed' ? ['Company Information save must be an explicit setup case.'] : blockedBy,
        requiredPreparation:
          resultStatus === 'observed'
            ? ['Prepare exact Universaarl GmbH Company Information values and before/after screenshots.']
            : ['Retake or repair the blocked visible context path.']
      }
    };

    await writeJson(RESULT_PATH, result);
    expect(resultStatus, `TARGET-010 must observe both My Settings and Company Information context: ${blockedBy.join(', ')}`).toBe(
      'observed'
    );
  } catch (error) {
    const blockedResult = {
      ...resultBase,
      resultStatus: 'blocked',
      proved: ['The test stopped before performing any setup, posting, preview, document or API action.'],
      notProved: [
        'UNIVERSAARL-DE active company context was not fully proven.',
        'Company Information read-only context was not fully proven.'
      ],
      warnings: [String(error)],
      blockedBy: ['target-010-playwright-error'],
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        lastUrl: page.url() ? sanitizeUrl(page.url()) : '',
        error: String(error)
      }
    };
    await writeJson(RESULT_PATH, blockedResult);
    throw error;
  }
});
