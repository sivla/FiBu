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

const CASE_ID = 'PREP-033-MY-SETTINGS-READONLY-CONTEXT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'prep-033-my-settings-readonly-context';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'PREP-033-result.json');

type UiField = {
  label: string;
  value: string;
  ariaLabel: string;
  title: string;
  role: string;
  tag: string;
};

type UiAction = {
  label: string;
  role: string;
  tag: string;
  x: number;
  y: number;
};

function buildPlaythruUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('company');
  url.searchParams.delete('page');
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

async function writeText(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const normalized = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(filePath, normalized, 'utf8');
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

async function collectFrameActions(scope: Page | Frame) {
  return scope
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };

      return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const label = [element.innerText || element.textContent, element.getAttribute('aria-label'), element.getAttribute('title')]
            .map(normalize)
            .filter(Boolean)
            .join(' | ');
          return {
            label,
            role: normalize(element.getAttribute('role')),
            tag: element.tagName.toLowerCase(),
            x: Math.round(rect.x),
            y: Math.round(rect.y)
          };
        });
    })
    .catch(() => [] as UiAction[]);
}

async function collectActions(page: Page) {
  const actions: UiAction[] = await collectFrameActions(page);
  for (const frame of page.frames()) {
    actions.push(...(await collectFrameActions(frame)));
  }
  const seen = new Set<string>();
  return actions
    .map((action) => ({ ...action, label: clean(action.label) }))
    .filter((action) => action.label)
    .filter((action) => {
      const key = `${action.label}:${action.role}:${action.tag}`;
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
            return { element, label, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
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
            y: Math.round(chosen.y),
            width: Math.round(chosen.width),
            height: Math.round(chosen.height)
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

function pickSignals(text: string, fields: UiField[]) {
  const signalRegex = /My Settings|Meine Einstellungen|Company|Unternehmen|Mandant|Firma|Role|Rolle|Profile|Profil|Language|Sprache|Region|Work Date|Arbeitsdatum/i;
  const textSignals = text
    .split(/\n| {2,}/)
    .map(clean)
    .filter((line) => signalRegex.test(line))
    .slice(0, 80);
  const fieldSignals = fields.filter((field) =>
    signalRegex.test([field.label, field.ariaLabel, field.title, field.value].join(' '))
  );
  return { textSignals, fieldSignals };
}

test('PREP-033 observes My Settings context read-only', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const mySettingsUrl = buildPlaythruUrl();
  await page.goto(mySettingsUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);

  const currentUrl = page.url();
  expect(currentUrl, 'PREP-033 must stay in playthru.').toMatch(/playthru/i);

  const settingsClick = await clickSettingsButton(page);
  expect(settingsClick.clicked, `Settings menu must be reachable read-only: ${JSON.stringify(settingsClick)}`).toBe(true);
  await page.waitForTimeout(700);

  const mySettingsClick = await clickMySettingsMenuItem(page);
  expect(mySettingsClick.clicked, `My Settings menu item must be reachable read-only: ${JSON.stringify(mySettingsClick)}`).toBe(
    true
  );
  await page.waitForTimeout(1500);
  await maskPersonalDataForScreenshot(page);
  await page.waitForTimeout(250);

  const fullText = clean(await pageText(page));
  const compactText = clean(
    await compactPageText(page, {
      include: [/My Settings|Meine Einstellungen|Company|Unternehmen|Mandant|Firma|Role|Rolle|Language|Sprache|Work Date|Arbeitsdatum|OK|Cancel|Abbrechen/i],
      maxLines: 160
    })
  );
  const fields = await collectFields(page);
  const actions = await collectActions(page);
  const { textSignals, fieldSignals } = pickSignals(`${fullText}\n${compactText}`, fields);
  const riskyActionsVisible = actions
    .filter((action) => /\bOK\b|Save|Speichern|Apply|Ubernehmen|Übernehmen|Change|Wechseln|Company wechseln|Unternehmen wechseln/i.test(action.label))
    .map((action) => action.label)
    .slice(0, 40);
  const contextActions = actions
    .filter((action) => /Einstellungen|Settings|My Settings|Meine Einstellungen|\bOK\b|Abbrechen|Cancel|Mandant|Company|Rolle|Role|Sprache|Language/i.test(action.label))
    .map((action) => clean(action.label.replace(/Konto-Manager[^|]*/gi, 'Konto-Manager')))
    .slice(0, 40);

  const pageLooksLikeMySettings =
    /My Settings|Meine Einstellungen/i.test(fullText) ||
    fieldSignals.some((field) => /Company|Unternehmen|Mandant|Role|Rolle|Language|Sprache/i.test([field.label, field.ariaLabel, field.title].join(' ')));

  const resultStatus = pageLooksLikeMySettings ? 'observed' : 'blocked';
  const screenshotFile = 'prep-033-010-my-settings-readonly-context.png';

  await screenshot(page, screenshotFile, {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: pageLooksLikeMySettings ? 'candidate' : 'rejected',
    bookUse: pageLooksLikeMySettings ? 'navigation' : 'do-not-use',
    purpose: 'Read-only My Settings context: company, role, language and no-save boundary.',
    expectedPageText: [/My Settings|Meine Einstellungen|Company|Unternehmen|Role|Rolle|Language|Sprache|Work Date|Arbeitsdatum/i],
    knownLimitations: [
      'Keine Einstellungen gespeichert.',
      'Kein Company Switch.',
      'Keine Anlage von UNIVERSAARL-DE.',
      'Kein Setup, keine Buchung, keine API.'
    ]
  });

  await writeJson(path.join(EVIDENCE_DIR, screenshotFile.replace(/\.png$/i, '.screenshot.json')), {
    fileName: screenshotFile,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', screenshotFile),
    status: pageLooksLikeMySettings ? 'usable-context-screenshot' : 'rejected',
    page: 'My Settings / Meine Einstellungen, Settings-menu route',
    instance: EXPECTED_INSTANCE,
    company: 'current-shell-context; UNIVERSAARL-DE planned, not created',
    step: 'Read-only user context page',
    visibleLearning: 'My Settings shows user-context controls such as company, role, language or work date without requiring a data-changing action.',
    importantUi: ['Company/Unternehmen', 'Role/Rolle', 'Language/Sprache', 'OK/Cancel boundary'],
    internallyProves: pageLooksLikeMySettings
      ? ['My Settings opens in playthru through the Settings menu.', 'User context can be documented without saving settings.']
      : ['The Settings menu route stayed read-only but did not expose enough My Settings signals.'],
    doesNotProve: ['UNIVERSAARL-DE exists', 'company switch', 'saved settings', 'setup completeness'],
    finalScreenshotStatus: 'german-final-candidate-preflight',
    piiMasking: 'User name, OneDrive owner text and last-login text are masked client-side before screenshot/evidence extraction.',
    qaRequired: true
  });

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-ui-discovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    sourceCompany: 'current-shell-context-before-UNIVERSAARL-DE',
    page: {
      id: 'settings-menu-route',
      name: 'My Settings / Meine Einstellungen',
      source: 'Microsoft Learn describes opening My Settings from the Settings icon.'
    },
    sourceRefs: [
      'https://learn.microsoft.com/en-us/dynamics365/business-central/ui-change-basic-settings'
    ],
    currentUrl: sanitizeUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/img/${screenshotFile}`,
    observed: {
      pageTitle: await page.title(),
      textSignals: textSignals.slice(0, 60),
      fieldSignals: fieldSignals.slice(0, 60),
      riskyActionsVisible,
      contextActions,
      piiMasking: 'Visible user name, OneDrive owner text and last-login text were masked before evidence extraction.'
    },
    proved:
      resultStatus === 'observed'
        ? [
            'My Settings / Meine Einstellungen can be opened read-only in playthru from the Settings menu.',
            'The page is suitable for beginner-facing explanation of company, role and language context.',
            'No settings were saved and no company switch was performed.'
          ]
        : ['The Settings menu route stayed within playthru and did not perform write actions.'],
    notProved: [
      'UNIVERSAARL-DE was not created and its existence was not proven.',
      'No value was changed or saved.',
      'No setup, posting, preview, API shortcut or document action was performed.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/prep-033-my-settings-readonly-context/PREP-033-result.json',
      'playwright/projects/fibu-book5/evidence/prep-033-my-settings-readonly-context/README.md',
      'playwright/projects/fibu-book5/evidence/prep-033-my-settings-readonly-context/prep-033-010-my-settings-readonly-context.screenshot.json',
      'playwright/projects/fibu-book5/img/prep-033-010-my-settings-readonly-context.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/prep-033-my-settings-readonly-context/PREP-033-result.json',
      'playwright/projects/fibu-book5/img/prep-033-010-my-settings-readonly-context.png'
    ],
    warnings: resultStatus === 'observed' ? [] : ['My Settings signal was not strong enough for a usable book screenshot.'],
    blockedBy: resultStatus === 'observed' ? [] : ['my-settings-page-context-not-visible'],
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    statePatch: {},
    flags: {
      noWrite: true,
      noSave: true,
      noCompanySwitch: true,
      noCompanyCreated: true,
      noSetupChange: true,
      noPreview: true,
      noPost: true,
      noDraft: true,
      noApiShortcut: true,
      noBookChange: false
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'After UNIVERSAARL-DE exists, reopen My Settings in the final context and capture the same company, role, language and work-date fields without saving changes.',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'PREP-032 rewrote Chapter 4 as beginner-facing Universaarl ERP, Environment and Company text.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'My Settings is a read-only W0 context page that helps explain company, role and language before effective setup remains parked.',
      lookaheadReviewed: [
        {
          caseId: 'PREP-034-ROLE-CENTER-READONLY-SHELL-MAP',
          status: 'ready-next',
          reason: 'Role Center shell context is the next safe read-only UI chapter input.'
        },
        {
          caseId: 'PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING',
          status: 'ready-after-current',
          reason: 'Implementation planning remains useful while company creation rights are parked.'
        },
        {
          caseId: 'PREP-028-TESTING-STRATEGY-AND-UAT-MATRIX',
          status: 'ready-after-current',
          reason: 'Can improve book/UAT structure without BC changes.'
        },
        {
          caseId: 'PREP-029-AL-OBJECT-ANALYSIS-ROADMAP',
          status: 'ready-after-current',
          reason: 'Useful for later technical explanation, but less immediate than shell/read-only UI proof.'
        },
        {
          caseId: 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE',
          status: 'blocked',
          reason: 'Company creation remains parked until SUPER/company-create permissions are available.'
        }
      ],
      queueChangesMade: ['Mark PREP-033 done if observed; keep TARGET-009 parked.'],
      selectedNextCase: 'PREP-034-ROLE-CENTER-READONLY-SHELL-MAP',
      whySelectedNextCaseIsBest:
        'After My Settings context, Role Center is the next beginner-facing safe UI surface before effective setup can resume.',
      risksBeforeNextCase: ['Do not click search results that trigger setup or document creation.'],
      requiredPreparation: ['Use read-only Role Center route only.']
    },
    startedAt,
    finishedAt: new Date().toISOString()
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    path.join(EVIDENCE_DIR, 'README.md'),
    `# PREP-033 My Settings Read-only Context

Status: ${resultStatus}

Instanz: playthru
Zielcompany: UNIVERSAARL-DE ist geplant, aber noch nicht erstellt.

## Geprueft

- Read-only Aufruf ueber Einstellungen -> My Settings / Meine Einstellungen.
- Sichtbare Kontextsignale zu Company, Rolle, Sprache oder Arbeitsdatum.
- Sichtbare Risikoaktionen wie OK/Speichern/Wechseln wurden nur inventarisiert und nicht geklickt.

## Ergebnis

${resultStatus === 'observed' ? '- My Settings ist als read-only Kontextseite verwendbar.' : '- My Settings konnte nicht ausreichend sichtbar belegt werden.'}

## Grenzen

- Keine Einstellung gespeichert.
- Kein Company Switch.
- Keine Anlage von UNIVERSAARL-DE.
- Kein Setup, keine Buchung, keine API.

## Naechster Schritt

PREP-034 soll die Role-Center-/Shell-Oberflaeche read-only kartieren.
`
  );

  expect(resultStatus, 'My Settings context must be visible enough for PREP-033.').toBe('observed');
});
