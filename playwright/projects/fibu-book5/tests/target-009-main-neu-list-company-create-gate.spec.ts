import { expect, test } from '@playwright/test';
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

const CASE_ID = 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const EVIDENCE_ID = 'target-009-main-neu-list-company-create-gate';
const PROJECT = 'fibu-book5';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-009-result.json');

function buildPlaythruUrl(pageId = 357) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('company');
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

async function relevantWizardText(page: import('@playwright/test').Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Neues Unternehmen erstellen|unterstutzten Setup|grundlegende Informationen|Name fur das Unternehmen|Daten und die Einrichtung/i,
        /Auswertung|Contoso|Produktion|Nur Einrichtungsdaten|Neu erstellen|Keine Daten|Keine Beispieldaten|Keine Einrichtungsdaten/i,
        /Zuruck|Weiter|Fertig stellen|Fehler|Error|UNIVERSAARL|Universaarl/i
      ],
      maxLines: 120
    })
  );
}

async function clickWizardButton(page: import('@playwright/test').Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope.getByRole('button', { name: label }).first();
    if ((await button.isVisible({ timeout: 500 }).catch(() => false)) && (await button.isEnabled({ timeout: 500 }).catch(() => false))) {
      await button.click();
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

async function isWizardButtonEnabled(page: import('@playwright/test').Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const button = scope.getByRole('button', { name: label }).first();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      return await button.isEnabled({ timeout: 500 }).catch(() => false);
    }
  }
  return false;
}

async function fillWizardCompanyName(page: import('@playwright/test').Page, value: string) {
  for (const scope of [page, ...page.frames()]) {
    const inputs = scope.locator('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), [contenteditable="true"]');
    const inputCount = await inputs.count().catch(() => 0);
    for (let index = 0; index < inputCount; index += 1) {
      const input = inputs.nth(index);
      if (!(await input.isVisible({ timeout: 500 }).catch(() => false))) continue;
      const box = await input.boundingBox().catch(() => null);
      if (!box || box.y < 300) continue;
      await input.fill(value, { timeout: 3000 }).catch(async () => {
        await input.click({ timeout: 1000 });
        await page.keyboard.press('Control+A');
        await page.keyboard.type(value, { delay: 10 });
      });
      await page.waitForTimeout(750);
      return {
        filled: true,
        method: 'editable-input',
        index,
        box: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height)
        },
        visibleValue: await input.inputValue({ timeout: 1000 }).catch(() => '')
      };
    }

    const textboxes = scope.getByRole('textbox');
    const count = await textboxes.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const textbox = textboxes.nth(index);
      if ((await textbox.isVisible({ timeout: 500 }).catch(() => false)) && (await textbox.isEditable({ timeout: 500 }).catch(() => false))) {
        await textbox.fill(value, { timeout: 3000 });
        await page.waitForTimeout(750);
        return {
          filled: true,
          method: 'role=textbox',
          index,
          visibleValue: await textbox.inputValue({ timeout: 1000 }).catch(() => '')
        };
      }
    }
  }

  return {
    filled: false,
    method: 'role=textbox-not-found',
    index: -1,
    visibleValue: ''
  };
}

async function tooltipAfterHover(page: import('@playwright/test').Page, x: number, y: number) {
  await page.mouse.move(x, y);
  await page.waitForTimeout(900);
  const text = clean(
    await compactPageText(page, {
      include: [/Neu|Erstellen Sie einen neuen Eintrag|Verwandte Aktionen|Tooltip|Mandanten/i],
      maxLines: 80
    })
  );
  return text;
}

async function openNewDropdown(page: import('@playwright/test').Page) {
  await page.mouse.move(580, 111);
  await page.waitForTimeout(700);
  const tooltip = await tooltipAfterHover(page, 580, 111);
  await page.mouse.click(580, 111);
  await page.waitForTimeout(1000);
  return tooltip;
}

async function clickCreateNewCompanyFromDropdown(page: import('@playwright/test').Page) {
  const tooltip = clean(
    await compactPageText(page, {
      include: [/Neues Unternehmen erstellen|Unterstutzung|Erstellen eines neuen Unternehmens|Neu/i],
      maxLines: 80
    })
  );
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    for (const candidate of [
      scope.getByRole('menuitem', { name: /Neues Unternehmen erstellen|Create New Company/i }).first(),
      scope.getByText(/Neues Unternehmen erstellen|Create New Company/i).first()
    ]) {
      if (await candidate.isVisible({ timeout: 750 }).catch(() => false)) {
        await candidate.hover().catch(() => undefined);
        await page.waitForTimeout(300);
        await candidate.click({ timeout: 3000 });
        await page.waitForTimeout(2500);
        return `${tooltip}\nclickMethod=visible-menuitem-or-text`;
      }
    }
  }

  await page.mouse.move(620, 183);
  await page.waitForTimeout(300);
  await page.mouse.click(620, 183);
  await page.waitForTimeout(2500);
  return `${tooltip}\nclickMethod=coordinate-fallback`;
}

async function activeElementInfo(page: import('@playwright/test').Page) {
  return page
    .evaluate(() => {
      const element = document.activeElement as HTMLInputElement | HTMLTextAreaElement | HTMLElement | null;
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') || '',
        ariaLabel: element.getAttribute('aria-label') || '',
        title: element.getAttribute('title') || '',
        value: 'value' in element ? String((element as HTMLInputElement).value || '') : '',
        text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    })
    .catch(() => null);
}

test('TARGET-009 creates UNIVERSAARL-DE through Neu dropdown -> Neues Unternehmen erstellen if BC saves it', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  const startedAt = new Date().toISOString();
  const companiesUrl = buildPlaythruUrl(357);

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  expect(page.url(), 'TARGET-009 must stay in playthru.').toMatch(/playthru/i);

  const beforeFullText = clean(await pageText(page));
  const alreadyExists = /UNIVERSAARL-DE|Universaarl GmbH/i.test(beforeFullText);
  await screenshot(page, 'target-009-010-before-neu-dropdown-create.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: 'candidate',
    bookUse: 'preflight',
    purpose: 'Mandantenliste vor kontrollierter Anlage ueber Pfeil neben Neu -> Neues Unternehmen erstellen.',
    expectedPageText: [/Mandanten|Neu|Name|Anzeigename/i],
    knownLimitations: ['Vorher-Bild; keine Zielcompany-Anlage.']
  });

  let createRouteEvidence: unknown = null;
  let mainNewTooltip = '';
  let dropdownTooltip = '';
  let createNewCompanyTooltip = '';
  let activeBeforeTyping: unknown = null;
  let activeAfterTyping: unknown = null;
  let afterText = '';
  let finalText = beforeFullText;
  let savedVisible = alreadyExists;
  let errorVisible = false;
  let wizardOpened = false;
  let wizardExpanded = false;
  let wizardTextBeforeNext = '';
  let wizardTextAfterNext = '';
  const wizardScreenshots: string[] = [];
  let safeNoDataDefaultVisible = false;
  let finishClicked = false;
  let secondNextClicked = false;
  let wizardAdvanceCount = 0;
  let wizardNameFill: unknown = null;

  if (!alreadyExists) {
    mainNewTooltip = await tooltipAfterHover(page, 523, 111);
    dropdownTooltip = await openNewDropdown(page);
    await screenshot(page, 'target-009-015-neu-dropdown-open-create-new-company-visible.png', {
      projectName: PROJECT,
      testId: EVIDENCE_ID,
      status: 'candidate',
      bookUse: 'clickguide',
      purpose: 'Dropdown neben Neu ist offen; der Menueintrag Neues Unternehmen erstellen muss sichtbar sein.',
      expectedPageText: [/Neues Unternehmen erstellen|Erstellen eines neuen Unternehmens|Neu/i],
      knownLimitations: ['Dropdown-Beweis vor der Auswahl; noch keine Company-Anlage.']
    });
    createNewCompanyTooltip = await clickCreateNewCompanyFromDropdown(page);
    createRouteEvidence = {
      route: 'Pfeil neben Neu -> Neues Unternehmen erstellen',
      mainNewTooltip,
      dropdownTooltip,
      createNewCompanyTooltip
    };
    await page.waitForTimeout(800);
    await screenshot(page, 'target-009-018-after-create-new-company-menuitem-click.png', {
      projectName: PROJECT,
      testId: EVIDENCE_ID,
      status: 'candidate',
      bookUse: 'evidence',
      purpose: 'Zielzustand direkt nach Klick auf Neues Unternehmen erstellen, bevor Werte eingegeben werden.',
      expectedPageText: [/Mandanten|Neu - Mandanten|Name|Anzeigename|Unternehmen|Company/i],
      knownLimitations: ['Zwischenbild; beweist noch keine gespeicherte Zielcompany.']
    });
    wizardTextBeforeNext = await relevantWizardText(page);
    wizardOpened = /Neues Unternehmen erstellen|unterstutzten Setup|Weiter|Fertig stellen/i.test(wizardTextBeforeNext);

    if (wizardOpened) {
      await page.mouse.click(1220, 404).catch(() => undefined);
      await page.waitForTimeout(1000);
      wizardExpanded = true;
      await screenshot(page, 'target-009-019-wizard-expanded-welcome.png', {
        projectName: PROJECT,
        testId: EVIDENCE_ID,
        status: 'candidate',
        bookUse: 'clickguide',
        purpose: 'Wizard Neues Unternehmen erstellen im vergroesserten Zustand vor Weiter.',
        expectedPageText: [/Neues Unternehmen erstellen|Weiter|Fertig stellen/i],
        knownLimitations: ['Nur Wizard-Navigation; noch keine Company erstellt.']
      });
      wizardScreenshots.push('playwright/projects/fibu-book5/img/target-009-019-wizard-expanded-welcome.png');

      const clickedNext = await clickWizardButton(page, /^Weiter$|^Next$/i);
      await page.waitForTimeout(1500);
      wizardTextAfterNext = await relevantWizardText(page);
      await screenshot(page, 'target-009-021-wizard-after-weiter.png', {
        projectName: PROJECT,
        testId: EVIDENCE_ID,
        status: 'candidate',
        bookUse: 'clickguide',
        purpose: clickedNext
          ? 'Wizard Neues Unternehmen erstellen nach Klick auf Weiter; Datenbasis und Pflichtfelder werden sichtbar.'
          : 'Wizard Neues Unternehmen erstellen ohne erfolgreichen Weiter-Klick; Button oder Fokus muss diagnostiziert werden.',
        expectedPageText: [/Neues Unternehmen erstellen|Zuruck|Weiter|Fertig stellen|Daten|Name|Unternehmen|Company/i],
        knownLimitations: ['Kein Fertig stellen, keine Company-Erstellung, keine Datenbasis bestaetigt.']
      });
      wizardScreenshots.push('playwright/projects/fibu-book5/img/target-009-021-wizard-after-weiter.png');
      safeNoDataDefaultVisible =
        /Neu erstellen\s*-\s*Keine Daten|Keine Beispieldaten\s*\/\s*Keine Einrichtungsdaten/i.test(wizardTextAfterNext) &&
        /Keine Beispieldaten\s*\/\s*Keine Einrichtungsdaten/i.test(wizardTextAfterNext);

      if (clickedNext && safeNoDataDefaultVisible) {
        wizardNameFill = await fillWizardCompanyName(page, TARGET_COMPANY);
        await page.waitForTimeout(700);
        await screenshot(page, 'target-009-022-wizard-name-entered-no-data-selected.png', {
          projectName: PROJECT,
          testId: EVIDENCE_ID,
          status: 'candidate',
          bookUse: 'process-proof',
          purpose: 'Wizard mit eingetragenem Company-Namen und sichtbarer Auswahl Neu erstellen - Keine Daten.',
          expectedPageText: [/UNIVERSAARL-DE|Neu erstellen|Keine Daten|Fertig stellen/i],
          knownLimitations: ['Vor Fertig stellen; noch kein Sichtnachweis in der Mandantenliste.']
        });
        wizardScreenshots.push('playwright/projects/fibu-book5/img/target-009-022-wizard-name-entered-no-data-selected.png');
        if (!(await isWizardButtonEnabled(page, /^Fertig stellen$|^Finish$/i))) {
          secondNextClicked = await clickWizardButton(page, /^Weiter$|^Next$/i);
          wizardAdvanceCount += secondNextClicked ? 1 : 0;
          await page.waitForTimeout(1500);
          await screenshot(page, 'target-009-023-wizard-after-second-weiter.png', {
            projectName: PROJECT,
            testId: EVIDENCE_ID,
            status: 'candidate',
            bookUse: 'clickguide',
            purpose: secondNextClicked
              ? 'Wizard nach zweitem Weiter auf dem No-Data-Pfad; prueft, ob Fertig stellen jetzt moeglich ist.'
              : 'Wizard nach Namenseingabe; Weiter war nicht klickbar und muss diagnostiziert werden.',
            expectedPageText: [/Neues Unternehmen erstellen|UNIVERSAARL-DE|Zuruck|Weiter|Fertig stellen|Keine Daten|Unternehmen/i],
            knownLimitations: ['Vor sichtbarem Speichernachweis in der Mandantenliste.']
          });
          wizardScreenshots.push('playwright/projects/fibu-book5/img/target-009-023-wizard-after-second-weiter.png');
        }
        const wizardLoopScreenshots = [
          'target-009-024-wizard-after-third-weiter.png',
          'target-009-025-wizard-after-fourth-weiter.png',
          'target-009-026-wizard-after-fifth-weiter.png'
        ];
        for (const fileName of wizardLoopScreenshots) {
          if (await isWizardButtonEnabled(page, /^Fertig stellen$|^Finish$/i)) break;
          if (!(await isWizardButtonEnabled(page, /^Weiter$|^Next$/i))) break;
          const clicked = await clickWizardButton(page, /^Weiter$|^Next$/i);
          if (!clicked) break;
          wizardAdvanceCount += 1;
          await screenshot(page, fileName, {
            projectName: PROJECT,
            testId: EVIDENCE_ID,
            status: 'candidate',
            bookUse: 'clickguide',
            purpose: `Wizard Neues Unternehmen erstellen nach weiterem Weiter-Schritt ${wizardAdvanceCount}; prueft naechste Pflichtseite vor Fertig stellen.`,
            expectedPageText: [/Neues Unternehmen erstellen|UNIVERSAARL-DE|Zuruck|Weiter|Fertig stellen|Benutzer|Unternehmen|Einrichtung|Setup/i],
            knownLimitations: ['Vor sichtbarem Speichernachweis in der Mandantenliste.']
          });
          wizardScreenshots.push(`playwright/projects/fibu-book5/img/${fileName}`);
        }
        if (await isWizardButtonEnabled(page, /^Fertig stellen$|^Finish$/i)) {
          finishClicked = await clickWizardButton(page, /^Fertig stellen$|^Finish$/i);
          await page.waitForTimeout(30_000);
          await screenshot(page, 'target-009-027-after-fertig-stellen-wait.png', {
            projectName: PROJECT,
            testId: EVIDENCE_ID,
            status: 'candidate',
            bookUse: 'evidence',
            purpose: 'Zustand nach Klick auf Fertig stellen und Wartezeit; zeigt, ob Business Central noch verarbeitet, blockiert oder zur Mandantenliste zurueckkehrt.',
            expectedPageText: [/Mandanten|Neues Unternehmen erstellen|UNIVERSAARL-DE|Einrichtungsstatus|Fehler|Error|Company|Unternehmen/i],
            knownLimitations: ['Zwischen-/Nachherbild; Sichtbarkeit in der Mandantenliste wird danach separat geprueft.']
          });
          wizardScreenshots.push('playwright/projects/fibu-book5/img/target-009-027-after-fertig-stellen-wait.png');
          finalText = clean(await pageText(page));
          savedVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(finalText);
          errorVisible = /Fehler|Error|Nicht gespeichert|not saved|validation|failed/i.test(finalText);
          if (!savedVisible) {
            await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
            await waitForBusinessCentralShell(page);
            await page.waitForTimeout(20_000);
            await screenshot(page, 'target-009-028-companies-after-fertig-stellen-recheck.png', {
              projectName: PROJECT,
              testId: EVIDENCE_ID,
              status: 'candidate',
              bookUse: 'evidence',
              purpose: 'Mandantenliste nach Fertig-stellen-Recheck; prueft, ob UNIVERSAARL-DE nach Verarbeitung sichtbar ist.',
              expectedPageText: [/Mandanten|Name|Anzeigename|UNIVERSAARL|Universaarl|CRONUS|My Company/i],
              knownLimitations: ['Kein Company-Wechsel, keine Company Information, kein Setup.']
            });
            wizardScreenshots.push('playwright/projects/fibu-book5/img/target-009-028-companies-after-fertig-stellen-recheck.png');
            finalText = clean(await pageText(page));
            savedVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(finalText);
            errorVisible = errorVisible || /Fehler|Error|Nicht gespeichert|not saved|validation|failed/i.test(finalText);
          }
        }
      }

      afterText = wizardTextAfterNext || wizardTextBeforeNext;
      if (!finishClicked) finalText = afterText;
      errorVisible = errorVisible || /Fehler|Error|Nicht gespeichert|not saved|validation/i.test(`${wizardTextBeforeNext}\n${wizardTextAfterNext}`);
    } else {
      // If BC ever opens a foreground "Neu - Mandanten" ListPart instead of the wizard,
      // type only after the target state has been photographed.
      await page.mouse.click(660, 262);
      await page.waitForTimeout(300);
      activeBeforeTyping = await activeElementInfo(page);
      await page.keyboard.type(TARGET_COMPANY, { delay: 10 });
      await page.keyboard.press('Tab');
      await page.keyboard.type(LEGAL_NAME, { delay: 10 });
      await page.keyboard.press('Tab');
      activeAfterTyping = await activeElementInfo(page);
      await page.waitForTimeout(2500);
      afterText = clean(
        await compactPageText(page, {
          include: [/Mandanten|Neu - Mandanten|UNIVERSAARL|Universaarl|CRONUS|My Company|Name|Anzeigename|Fehler|Error|Nicht gespeichert|Speichern/i],
          maxLines: 240
        })
      );

      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(1500);
      await page.goto(companiesUrl.toString(), { waitUntil: 'domcontentloaded' });
      await waitForBusinessCentralShell(page);
      await page.waitForTimeout(2500);
      finalText = clean(await pageText(page));
      savedVisible = /UNIVERSAARL-DE|Universaarl GmbH/i.test(finalText);
      errorVisible = /Fehler|Error|Nicht gespeichert|not saved|validation/i.test(`${afterText}\n${finalText}`);
    }
  }

  if (!wizardOpened) await screenshot(page, 'target-009-020-after-neues-unternehmen-erstellen-attempt.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: savedVisible ? 'candidate' : 'blocked',
    bookUse: savedVisible ? 'process-proof' : 'error',
    purpose: savedVisible
      ? 'Mandantenliste nach kontrollierter Anlage von UNIVERSAARL-DE.'
      : 'Mandantenliste nach kontrolliertem Anlageversuch; Zielcompany nicht sichtbar.',
    expectedPageText: [/Mandanten|UNIVERSAARL|Universaarl|Name|Anzeigename/i],
    knownLimitations: ['Kein Company-Wechsel, keine Company Information, kein Setup, kein Posting.']
  });
  if (!wizardOpened) await writeScreenshotMetadata('target-009-020-after-neues-unternehmen-erstellen-attempt.png', {
    status: savedVisible ? 'candidate' : 'blocked',
    bookUse: savedVisible ? 'company-creation-proof' : 'company-creation-blocker',
    page: 'Mandanten / Companies, Page 357',
    instance: EXPECTED_INSTANCE,
    company: 'current shell context before company switch',
    step: savedVisible ? 'After entering UNIVERSAARL-DE and returning to Companies list' : 'After controlled Neues Unternehmen erstellen save attempt',
    visibleLearning: savedVisible
      ? 'UNIVERSAARL-DE ist in der Mandantenliste sichtbar. Eine neue Company entsteht hier ueber den Dropdown-Pfad Pfeil neben Neu -> Neues Unternehmen erstellen und anschliessende Name/Anzeigename-Eingabe.'
      : 'Der kontrollierte Dropdown-Weg hat die Zielcompany nicht sichtbar gespeichert; der Fehler oder fehlende Speichernachweis bleibt der naechste Hebel.',
    importantUi: ['Neu', 'Name', 'Anzeigename', TARGET_COMPANY, LEGAL_NAME],
    internallyProves: savedVisible
      ? ['UNIVERSAARL-DE appears in the Companies list after the controlled Neu dropdown -> Neues Unternehmen erstellen route.']
      : ['UNIVERSAARL-DE is not visible after the controlled Neu dropdown -> Neues Unternehmen erstellen route attempt.'],
    doesNotProve: ['Company Information setup', 'foundation setup', 'chart of accounts', 'posting'],
    qualityDecision: savedVisible ? 'usable-company-creation-proof' : 'blocked-needs-error-diagnosis',
    finalScreenshotStatus: savedVisible ? 'german-final-candidate-preflight' : 'not-final-blocked'
  });

  const resultStatus = savedVisible ? (alreadyExists ? 'observed-existing' : 'observed-created') : 'blocked';
  const blockedBy = savedVisible
    ? []
    : [
        finishClicked
          ? 'finish-clicked-but-target-company-not-visible-after-recheck'
          : wizardOpened
            ? 'wizard-opened-route-needs-stepwise-data-basis-decision'
            : errorVisible
              ? 'error-or-not-saved-visible'
              : 'target-company-not-visible-after-create-attempt'
      ];
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE',
    lastEvidenceSummary:
      'PREP-039/PREP-040 established that the intended route is the arrow next to Neu and the menu item Neues Unternehmen erstellen, not the main Neu button.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'Company Creation remains the required dependency, and the route now explicitly uses the Neu dropdown menu item Neues Unternehmen erstellen without Copy/Testunternehmen/CRONUS.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-010-UNIVERSAARL-COMPANY-CONTEXT-PROOF',
        status: savedVisible ? 'ready-next' : 'blocked',
        reason: savedVisible ? 'UNIVERSAARL-DE is visible and can be opened/verified next.' : 'Company is not visible yet.'
      },
      {
        caseId: 'TARGET-004-FOUNDATION-SETUP-READINESS',
        status: savedVisible ? 'ready-after-current' : 'needs-setup-first',
        reason: 'Foundation setup only makes sense after target company context is proven.'
      },
      {
        caseId: 'TARGET-005-NUMBER-SERIES-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Needs company context and foundation baseline.'
      },
      {
        caseId: 'TARGET-006-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Needs company context and foundation baseline.'
      },
      {
        caseId: 'TARGET-007-DIMENSIONS-FOUNDATION',
        status: savedVisible ? 'ready-after-current' : 'blocked',
        reason: 'Dimensions belong after company and setup context.'
      }
    ],
    queueChangesMade: savedVisible
      ? ['Set next case to UNIVERSAARL-DE company context proof.']
      : ['Keep creation blocked and require error/save diagnostics.'],
    selectedNextCase: savedVisible
      ? 'TARGET-010-UNIVERSAARL-COMPANY-CONTEXT-PROOF'
      : 'TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-BLOCKER-DIAGNOSIS',
    whySelectedNextCaseIsBest: savedVisible
      ? 'After the company is visible, the next value is proving the active company context and Company Information before setup.'
      : 'The value entry route did not visibly save; next step must read the exact BC validation/save condition.',
    risksBeforeNextCase: savedVisible
      ? ['Company switch must be explicit and documented.', 'Company Information may still be empty.']
      : ['Do not retry blind typing; first diagnose save/error behavior.'],
    requiredPreparation: savedVisible
      ? ['Open/switch to UNIVERSAARL-DE intentionally.', 'Capture shell context and Company Information.']
      : ['Capture error details, active field info and save action behavior.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-target',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    targetCompany: TARGET_COMPANY,
    legalName: LEGAL_NAME,
    currentUrl: sanitizeUrl(page.url()),
    actionsTaken: alreadyExists
      ? ['Opened Companies page and stopped because UNIVERSAARL-DE is already visible.']
      : wizardOpened
        ? [
            'Opened Companies / Mandanten page 357 in playthru.',
            'Hovered Neu and the dropdown arrow.',
            'Opened the Neu dropdown.',
            'Selected Neues Unternehmen erstellen from the open Neu dropdown.',
            'Captured the opened assisted setup wizard.',
            'Maximized the wizard card.',
            'Clicked Weiter only for wizard page discovery.',
            ...(finishClicked
              ? [
                  'Confirmed the visible Neu erstellen - Keine Daten selection.',
                  'Entered UNIVERSAARL-DE in the wizard name field.',
                  'Clicked Fertig stellen.',
                  'Rechecked the Companies list for UNIVERSAARL-DE.'
                ]
              : ['Stopped before Fertig stellen, before data-basis confirmation and before company creation.'])
          ]
      : [
          'Opened Companies / Mandanten page 357 in playthru.',
          'Hovered Neu and the dropdown arrow.',
          'Opened the Neu dropdown.',
          'Selected Neues Unternehmen erstellen from the open Neu dropdown.',
          'Entered UNIVERSAARL-DE in the active Name field.',
          'Entered Universaarl GmbH in the next field.',
          'Left the row and reopened Companies page to verify persistence.'
        ],
    actionsNotTaken: [
      'No Copy/Kopieren route.',
      'No Testunternehmen/demo route.',
      'No CRONUS copy.',
      'No API shortcut.',
      'No company switch.',
      'No setup, preview posting, posting or payment.'
    ],
    flags: {
      noPost: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noTemplateCopy: true,
      noTestCompany: true,
      noCronusCopy: true,
      wizardOpened,
      wizardExpanded,
      noFinish: !finishClicked,
      safeNoDataDefaultVisible,
      finishClicked,
      secondNextClicked,
      wizardAdvanceCount,
      companyCreatedOrAlreadyVisible: savedVisible
    },
    observed: {
      alreadyExists,
      createRouteEvidence,
      mainNewTooltip,
      dropdownTooltip,
      createNewCompanyTooltip,
      activeBeforeTyping,
      activeAfterTyping,
      wizardOpened,
      wizardExpanded,
      wizardTextBeforeNext,
      wizardTextAfterNext,
      safeNoDataDefaultVisible,
      finishClicked,
      secondNextClicked,
      wizardAdvanceCount,
      wizardNameFill,
      afterText,
      savedVisible,
      errorVisible,
      screenshots: [
        'playwright/projects/fibu-book5/img/target-009-010-before-neu-dropdown-create.png',
        'playwright/projects/fibu-book5/img/target-009-015-neu-dropdown-open-create-new-company-visible.png',
        'playwright/projects/fibu-book5/img/target-009-018-after-create-new-company-menuitem-click.png',
        ...wizardScreenshots,
        ...(wizardOpened ? [] : ['playwright/projects/fibu-book5/img/target-009-020-after-neues-unternehmen-erstellen-attempt.png'])
      ]
    },
    proved: savedVisible
      ? [
          'Companies / Mandanten page 357 opens in playthru.',
          'UNIVERSAARL-DE is visible in the Companies list after the controlled Neu dropdown -> Neues Unternehmen erstellen route or was already visible.',
          'No Copy/Testunternehmen/CRONUS/API route was used.'
        ]
      : [
          'Companies / Mandanten page 357 opens in playthru.',
          wizardOpened
            ? 'The Neu dropdown -> Neues Unternehmen erstellen route opens the assisted setup wizard.'
            : 'The Neu dropdown -> Neues Unternehmen erstellen route was attempted with target values.',
          wizardOpened
            ? safeNoDataDefaultVisible
              ? 'The wizard showed the target data-basis option Neu erstellen - Keine Daten.'
              : 'The wizard can be maximized and advanced to the next page without using Copy/Testunternehmen/CRONUS/API.'
            : 'UNIVERSAARL-DE is not visible after the attempt.'
        ],
    notProved: [
      'No Company Information was configured.',
      'No foundation setup was configured.',
      'No chart of accounts, VAT setup, number series or posting groups were proven.',
      'No posting or ledger trace exists.'
    ],
    blockedBy,
    requiresReview: !savedVisible,
    safeToFinalizeState: true,
    statePatch: {},
    bookImpact: {
      draftOnly: true,
      beginnerTextReady: savedVisible,
      reason: savedVisible
        ? 'The book can now explain the actual Neu dropdown -> Neues Unternehmen erstellen company creation path and the after-create check.'
        : 'The book can explain the blocker, but not present the company as created.'
    },
    nextStepDecision,
    nextStep: nextStepDecision.selectedNextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-009-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-009.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-009-015-neu-dropdown-open-create-new-company-visible.screenshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-009-018-after-create-new-company-menuitem-click.screenshot.json`,
      ...(wizardOpened
        ? [
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-009-019-wizard-expanded-welcome.screenshot.json`,
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-009-021-wizard-after-weiter.screenshot.json`
          ]
        : [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-009-020-after-neues-unternehmen-erstellen-attempt.screenshot.json`])
    ],
    validationCommands: [
      'npm run fibu:target:main-neu-company-create-gate',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-009-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'TARGET-009.md',
    [
      '# TARGET-009 Pfeil neben Neu: Neues Unternehmen erstellen',
      '',
      '| Punkt | Ergebnis |',
      '|---|---|',
      '| Instanz | playthru |',
      '| Seite | Mandanten / Companies, Page 357 |',
      `| Zielcompany sichtbar | ${savedVisible ? 'ja' : 'nein'} |`,
      `| Company vorher schon vorhanden | ${alreadyExists ? 'ja' : 'nein'} |`,
      `| Fehler sichtbar | ${errorVisible ? 'ja' : 'nein'} |`,
      '| Copy/Test/CRONUS/API | nein |',
      '| Company Switch | nein |',
      '',
      '## Screenshot-QA',
      '',
      savedVisible
        ? 'Das Nachher-Bild muss `UNIVERSAARL-DE` oder `Universaarl GmbH` in der Mandantenliste zeigen. Es beweist noch keine Company-Information und kein Setup.'
        : 'Das Nachher-Bild zeigt die Mandantenliste nach dem Anlageversuch ohne sichtbare Zielcompany. Der naechste Schritt ist Fehler-/Save-Diagnose, kein blinder Retry.',
      '',
      '## Buchnotiz',
      '',
      savedVisible
        ? 'Die neue Company wird ueber `Mandanten`, den Pfeil neben `Neu` und den Eintrag `Neues Unternehmen erstellen` angelegt. Nach der Eingabe von Name und Anzeigename wird die Liste erneut geprueft. Erst wenn `UNIVERSAARL-DE` sichtbar ist, geht es mit dem Wechsel in die Company und der Company Information weiter.'
        : 'Der Pfad ueber den Pfeil neben `Neu` und `Neues Unternehmen erstellen` reicht erst dann als Buchpfad, wenn Business Central die neue Company sichtbar speichert oder eine konkrete Fehlermeldung zeigt.',
      ''
    ].join('\n')
  );
});
