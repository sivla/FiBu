import { test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBcReady
} from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-006-COMPANY-CREATION-SPECIFIC-ASSISTED-SETUP-ROUTE';
const EVIDENCE_ID = 'target-006-company-creation-specific-assisted-setup-route';
const PROJECT = 'fibu-book5';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);

type UiElement = {
  frameUrl: string;
  tagName: string;
  role: string | null;
  text: string;
  ariaLabel: string;
  title: string;
  visible: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  risk: string[];
};

function compactUiElement(element: UiElement): UiElement {
  return {
    ...element,
    frameUrl: sanitizeUrl(element.frameUrl),
    text: element.text.length > 220 ? `${element.text.slice(0, 220)}...` : element.text,
    ariaLabel: element.ariaLabel.length > 160 ? `${element.ariaLabel.slice(0, 160)}...` : element.ariaLabel,
    title: element.title.length > 160 ? `${element.title.slice(0, 160)}...` : element.title
  };
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('company');
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

function sanitizeUrl(value: string) {
  const url = new URL(value);
  const allowedParams = ['page', 'company'];
  for (const key of [...url.searchParams.keys()]) {
    if (!allowedParams.includes(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}

function sanitizeEvidenceText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function sanitizeBusinessText(value: string) {
  return sanitizeEvidenceText(value)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(
      (line) =>
        !/allowedEndpoints|allowedResources|tokenFactory|requestExecutor|O365MSAL|shouldAttachOauthTokens/i.test(line)
    )
    .filter(
      (line) =>
        !/originAuthorityValidator|trustedOriginAuthorities|clientId|authority:|cacheLocation|parentPageOrigin|upn:/i.test(line)
    )
    .join('\n');
}

async function writeJson(fileName: string, value: unknown) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), JSON.stringify(value, null, 2), 'utf8');
}

async function writeText(fileName: string, value: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), normalized, 'utf8');
}

function riskFor(label: string) {
  const risk: string[] = [];
  if (/finish|fertig|ok$|^ok|create|erstellen|save|speichern|yes|ja\b|weiter|next|starten/i.test(label)) {
    risk.push('could-confirm-effective-action');
  }
  if (/copy|kopieren|testunternehmen|test company|demo|cronos|cronus|sample/i.test(label)) {
    risk.push('copy-test-demo-or-cronus-route');
  }
  if (/learn\.microsoft|training|hilfe|help|support/i.test(label)) {
    risk.push('external-help-or-learn-route');
  }
  return risk;
}

async function collectUiElements(page: import('@playwright/test').Page, pattern: RegExp) {
  const elements: UiElement[] = [];
  for (const frame of page.frames()) {
    const candidates = await frame
      .locator('a,button,[role="button"],[role="menuitem"],[role="option"],[aria-label],[title],tr,[role="row"]')
      .evaluateAll((nodes) =>
        nodes.slice(0, 250).map((node) => {
          const element = node as HTMLElement;
          const rect = element.getBoundingClientRect();
          return {
            tagName: element.tagName,
            role: element.getAttribute('role'),
            text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
            ariaLabel: element.getAttribute('aria-label') || '',
            title: element.getAttribute('title') || '',
            visible: rect.width > 0 && rect.height > 0,
            boundingBox: rect.width > 0 && rect.height > 0
              ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
              : null
          };
        })
      )
      .catch(() => []);

    for (const candidate of candidates) {
      const label = [candidate.text, candidate.ariaLabel, candidate.title].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (!label || !pattern.test(label)) {
        continue;
      }
      elements.push({
        frameUrl: frame.url(),
        tagName: candidate.tagName,
        role: candidate.role,
        text: sanitizeEvidenceText(candidate.text),
        ariaLabel: sanitizeEvidenceText(candidate.ariaLabel),
        title: sanitizeEvidenceText(candidate.title),
        visible: candidate.visible,
        boundingBox: candidate.boundingBox,
        risk: riskFor(label)
      });
    }
  }
  return elements;
}

async function writeScreenshotMetadata(fileName: string, value: Record<string, unknown>) {
  await writeJson(fileName.replace(/\.png$/i, '.screenshot.json'), {
    fileName,
    imagePath: path.resolve('playwright/projects/fibu-book5/img', fileName),
    ...value
  });
}

test('TARGET-006 map Unternehmen einrichten assisted setup route without confirmation', async ({ page }) => {
  test.setTimeout(180_000);

  const startedAt = new Date().toISOString();
  const assistedSetupUrl = buildPlaythruUrl(1801);
  const smartDecisionCard = {
    action: 'open-assisted-setup-row',
    effectiveAction: false,
    reason: 'TARGET-005 proved Page 1801 opens but did not map the Unternehmen einrichten row.',
    alternatives: [
      'repeat Companies direct New row save - rejected',
      'Copy Company/Testunternehmen/CRONUS - rejected',
      'API shortcut - rejected'
    ],
    risk: 'The row might open a setup wizard with Finish/OK/Create buttons. The test must stop before confirming anything.',
    fallback: 'Document row context and create a narrower follow-up route if no safe blank/setup-only data basis appears.',
    beginnerBookUse: 'Explain that Assisted Setup is a navigation area, but a wizard is not completed until its final confirmation is intentionally selected.'
  };

  await page.goto(assistedSetupUrl);
  await waitForBcReady(page, { expectedText: /Unterst.tztes Setup|Unterstutztes Setup|Assisted Setup|Unternehmen einrichten|Einrichtung/i, timeout: 60_000 });
  await dismissTours(page);

  const beforeText = await compactPageText(page, {
    include: /Unterst.tztes Setup|Unterstutztes Setup|Einrichtung|Setup|Unternehmen|Company|Mandant|Create New|No Data|Setup Data|Testunternehmen|CRONUS|Kopieren|Copy|Finish|Fertig|OK|Erstellen|Speichern/i,
    maxLines: 120
  }).then(sanitizeBusinessText);

  await screenshot(page, 'target-006-010-assisted-setup-before-row-click.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: 'candidate',
    bookUse: 'navigation',
    purpose: 'Assisted Setup Page 1801 before scoped Unternehmen einrichten row click.',
    expectedPageText: [/Unternehmen einrichten|Unterst.tztes Setup|Unterstutztes Setup|Assisted Setup/i],
    knownLimitations: ['No Finish/Create/OK/Save will be clicked.', 'Visible CRONUS DE shell context is not Universaarl final company context.']
  });
  await writeScreenshotMetadata('target-006-010-assisted-setup-before-row-click.png', {
    status: 'candidate',
    bookUse: 'navigation',
    page: 'Unterstuetztes Setup / Assisted Setup, Page 1801',
    instance: 'playthru',
    company: 'Shell context before UNIVERSAARL-DE exists',
    step: 'Before opening Unternehmen einrichten row',
    visibleLearning: 'Unterstuetztes Setup lists setup tasks. A row can be a navigation path, not yet a completed setup action.',
    importantUi: ['Unternehmen einrichten', 'Einrichtung starten', 'rows in Assisted Setup'],
    internallyProves: ['Page 1801 opens inside playthru.'],
    doesNotProve: ['UNIVERSAARL-DE creation', 'blank/setup-only data basis', 'wizard completion'],
    qualityDecision: 'usable-context-screenshot',
    finalScreenshotStatus: 'german-final-candidate-preflight'
  });

  const rowCandidates = await collectUiElements(page, /Unternehmen einrichten/i);
  const rowToClick = rowCandidates.find((candidate) => candidate.visible && candidate.boundingBox && candidate.risk.length === 0);
  let rowClick = { clicked: false, reason: 'no-safe-visible-unternehmen-einrichten-row', label: '' };
  if (rowToClick?.boundingBox) {
    await page.mouse.click(rowToClick.boundingBox.x + Math.min(rowToClick.boundingBox.width / 2, 240), rowToClick.boundingBox.y + rowToClick.boundingBox.height / 2);
    await page.waitForTimeout(5000);
    rowClick = { clicked: true, reason: 'clicked-visible-row-for-route-discovery-only', label: rowToClick.text || rowToClick.ariaLabel || rowToClick.title };
  }

  await dismissTours(page);
  const afterText = await compactPageText(page, {
    include: /Unterst.tztes Setup|Unterstutztes Setup|Einrichtung|Setup|Unternehmen|Company|Mandant|Create New|No Data|Setup Data|Production|Testunternehmen|CRONUS|Kopieren|Copy|Finish|Fertig|OK|Erstellen|Speichern|Weiter|Next|Starten/i,
    maxLines: 160
  }).then(sanitizeBusinessText);
  const fullText = await pageText(page).then(sanitizeBusinessText);
  const visibleRiskButtons = await collectUiElements(page, /Finish|Fertig|OK|Create|Erstellen|Save|Speichern|Weiter|Next|Starten|Copy|Kopieren|Testunternehmen|CRONUS|Demo|Sample/i);

  const hasBlankOrSetupOnlyOption = /Production\s*-\s*Setup Data Only|Create New\s*-\s*No Data|Setup Data Only|No Data|leere|leer|nur einricht/i.test(fullText);
  const hasCreateCompanyWizardSignal = /Create New Company|Neue Firma|Neues Unternehmen|Mandant erstellen|Company erstellen|Unternehmen erstellen/i.test(fullText);
  const hasForbiddenDataBasisSignal = /Copy Company|Kopieren|Testunternehmen|Evaluation\s*-\s*Sample Data|Sample Data|Demo|CRONUS/i.test(fullText);
  const externalHelpOpened = /learn\.microsoft|training|Microsoft Learn/i.test(page.url()) || /Microsoft Learn|Training/i.test(fullText);
  const blockedByRiskButton = visibleRiskButtons.some((entry) => entry.risk.includes('could-confirm-effective-action'));
  const routeUsableForCompanyCreationGate = rowClick.clicked && hasCreateCompanyWizardSignal && hasBlankOrSetupOnlyOption && !hasForbiddenDataBasisSignal && !externalHelpOpened;

  await screenshot(page, 'target-006-020-after-unternehmen-einrichten-route.png', {
    projectName: PROJECT,
    testId: EVIDENCE_ID,
    status: routeUsableForCompanyCreationGate ? 'candidate' : 'blocked',
    bookUse: routeUsableForCompanyCreationGate ? 'navigation' : 'do-not-use',
    purpose: 'Context after opening Unternehmen einrichten row, with confirmation buttons documented but not clicked.',
    expectedPageText: [/Unternehmen|Company|Einrichtung|Setup|Mandant|Business Central/i],
    knownLimitations: ['No Finish/Create/OK/Save/Weiter/Starten confirmation was clicked.']
  });
  await writeScreenshotMetadata('target-006-020-after-unternehmen-einrichten-route.png', {
    status: routeUsableForCompanyCreationGate ? 'candidate' : 'blocked',
    bookUse: routeUsableForCompanyCreationGate ? 'navigation' : 'do-not-use',
    page: routeUsableForCompanyCreationGate ? 'Create New Company candidate wizard context' : 'Assisted Setup follow-up context',
    instance: 'playthru',
    company: 'Shell context before UNIVERSAARL-DE exists',
    step: 'After scoped Unternehmen einrichten route click',
    visibleLearning: routeUsableForCompanyCreationGate
      ? 'A possible company creation wizard context is visible, but still needs field mapping before any confirmation.'
      : 'The row does not yet prove a clean blank/setup-only company creation route.',
    importantUi: visibleRiskButtons.map(compactUiElement).slice(0, 20).map((entry) => entry.text || entry.ariaLabel || entry.title).filter(Boolean),
    internallyProves: rowClick.clicked
      ? ['The scoped Unternehmen einrichten row was opened without confirmation.']
      : ['No safe visible Unternehmen einrichten row was clicked.'],
    doesNotProve: ['UNIVERSAARL-DE creation', 'wizard completion', 'setup data basis unless explicitly visible'],
    qualityDecision: routeUsableForCompanyCreationGate ? 'usable-route-context' : 'blocked-route-context',
    finalScreenshotStatus: routeUsableForCompanyCreationGate ? 'german-final-candidate-preflight' : 'not-final-blocked'
  });

  const resultStatus = routeUsableForCompanyCreationGate ? 'observed' : 'blocked';
  const blockedBy = routeUsableForCompanyCreationGate
    ? []
    : [
        rowClick.clicked ? 'unternehmen-einrichten-opened-but-clean-company-creation-data-basis-not-proven' : rowClick.reason,
        hasForbiddenDataBasisSignal ? 'forbidden-copy-test-demo-or-cronus-signal-visible' : '',
        externalHelpOpened ? 'external-help-route-opened' : '',
        blockedByRiskButton ? 'effective-confirmation-buttons-visible-and-not-clicked' : ''
      ].filter(Boolean);

  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary:
      'TARGET-005 proved direct Assisted Setup Page 1801 opens in playthru and shows Unternehmen einrichten, but no blank/setup-only company creation route was proven.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'The target company still does not exist. Opening the specific assisted setup row is the narrowest non-repeating UI discovery path after rejected direct row save, Copy Company, Testunternehmen, CRONUS and API routes.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-006-COMPANY-CREATION-SPECIFIC-ASSISTED-SETUP-ROUTE',
        status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-source-check-first',
        reason: resultStatus === 'observed'
          ? 'The route needs a field-level Smart Decision Card before any effective create action.'
          : 'The row did not prove a clean blank/setup-only creation basis.'
      },
      {
        caseId: 'TARGET-004-FOUNDATION-SETUP-READINESS',
        status: 'ready-after-current',
        reason: 'Only meaningful after UNIVERSAARL-DE exists.'
      },
      {
        caseId: 'TARGET-005-NUMBER-SERIES-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Requires created company and foundation setup context.'
      },
      {
        caseId: 'TARGET-006-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Requires created company and baseline setup.'
      },
      {
        caseId: 'TARGET-DATA-001-UNIVERSAARL-DATA-RICHNESS-PLAN',
        status: 'ready-after-current',
        reason: 'Data richness stays after company/foundation and must not overtake company creation.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: resultStatus === 'observed'
      ? 'TARGET-007-COMPANY-CREATION-SMART-DECISION-AND-FIELD-MAP'
      : 'TARGET-007-COMPANY-CREATION-SOURCE-ROUTE-DECISION',
    whySelectedNextCaseIsBest: resultStatus === 'observed'
      ? 'A possible route needs field mapping and a Smart Decision Card before any effective creation.'
      : 'The current route remains blocked; the next step must decide between a source-backed alternative, admin route, or allowed in-instance company-creation method without CRONUS/Demo data.',
    risksBeforeNextCase: [
      'Confirmation buttons may create or modify data.',
      'Visible CRONUS DE is only shell context and not a Universaarl basis.',
      'Copy/Test/Demo options must not become the target data basis.'
    ],
    requiredPreparation: [
      'Use Microsoft Learn source registry for company creation route.',
      'Map fields and data-basis options before any Finish/Create/OK/Save.',
      'Create a new case if the route remains blocked.'
    ]
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-universaarl-target',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: 'playthru',
    primaryCompany: TARGET_COMPANY,
    activeCompany: 'shell-context-before-universaarl-de-exists',
    targetGroup: 'Universaarl',
    legalName: 'Universaarl GmbH',
    currentUrl: sanitizeUrl(page.url()),
    pageTitle: await page.title().then(sanitizeEvidenceText).catch(() => ''),
    smartDecisionCards: [smartDecisionCard],
    actionsTaken: [
      'Opened direct Page 1801 in playthru.',
      rowClick.clicked ? 'Clicked the visible Unternehmen einrichten row for route discovery only.' : 'Did not click any row because no safe visible row was found.'
    ],
    actionsNotTaken: [
      'No Finish/Create/OK/Save/Weiter/Starten confirmation clicked.',
      'No Copy Company.',
      'No Testunternehmen.',
      'No CRONUS copy.',
      'No company switch.',
      'No API shortcut.',
      'No setup change.',
      'No draft created.',
      'No posting or preview posting.'
    ],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChangeFromTest: true,
      noFinishCreateOkSave: true,
      noCopyCompany: true,
      noTestCompany: true,
      noCronusCopy: true
    },
    routeDiscovery: {
      beforeUrl: sanitizeUrl(assistedSetupUrl),
      rowCandidates: rowCandidates.map(compactUiElement).slice(0, 20),
      rowClick,
      visibleRiskButtons: visibleRiskButtons.map(compactUiElement).slice(0, 25),
      hasBlankOrSetupOnlyOption,
      hasCreateCompanyWizardSignal,
      hasForbiddenDataBasisSignal,
      externalHelpOpened,
      blockedByRiskButton,
      routeUsableForCompanyCreationGate
    },
    uiErgonomics: {
      overlayDismissed: true,
      page: 'Assisted Setup Page 1801',
      rowClickScoped: rowClick.clicked,
      noGlobalSearchUsed: true,
      noExternalHelpClicked: true,
      confirmationButtonsOnlyObserved: true
    },
    visibleText: {
      beforeText,
      afterText
    },
    screenshots: [
      'playwright/projects/fibu-book5/img/target-006-010-assisted-setup-before-row-click.png',
      'playwright/projects/fibu-book5/img/target-006-020-after-unternehmen-einrichten-route.png'
    ],
    fieldsObserved: [],
    buttonsObserved: visibleRiskButtons.map(compactUiElement).slice(0, 25),
    dialogsObserved: [],
    entriesExpected: [],
    entriesObserved: [],
    setupChanged: false,
    posted: false,
    previewPosting: false,
    createdRecords: [],
    proved: [
      'Page 1801 Assisted Setup opens in playthru without company switch.',
      rowClick.clicked
        ? 'The scoped Unternehmen einrichten row can be opened without confirming Finish/Create/OK/Save.'
        : 'No safe scoped Unternehmen einrichten row was clicked.'
    ],
    notProved: [
      'UNIVERSAARL-DE was not created.',
      'No blank/setup-only company data basis is accepted unless visible in the follow-up context.',
      'No final German company setup proof exists yet.',
      'Visible CRONUS DE remains shell context only.'
    ],
    blockedBy,
    safeToFinalizeState: true,
    requiresReview: resultStatus !== 'observed',
    bookImpact: {
      draftOnly: true,
      beginnerTextReady: false,
      reason: 'The route is still preflight evidence. Final reader text needs a clean creation path or a documented block/fallback.'
    },
    supersedesLegacy: [],
    openQuestionsCreatedOrClosed: [
      {
        id: 'OQ-0001',
        status: routeUsableForCompanyCreationGate ? 'partially-explained-by-universaarl-evidence' : 'still-open',
        question: 'What is the safe UI-first route to create UNIVERSAARL-DE without CRONUS/sample data?'
      }
    ],
    nextStepDecision: nextStepDecisionCard,
    nextStep: nextStepDecisionCard.selectedNextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-006-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-006.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/route-map.json`
    ],
    validationCommands: [
      'npm run agent:preflight',
      'npm run agent:context',
      'npm run agent:dry-run',
      'npm run agent:run-plan',
      'npm run fibu:target:company-creation-specific-assisted-setup-route',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-006-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson('route-map.json', {
    caseId: CASE_ID,
    rowCandidates: rowCandidates.map(compactUiElement).slice(0, 20),
    rowClick,
    visibleRiskButtons: visibleRiskButtons.map(compactUiElement).slice(0, 25),
    hasBlankOrSetupOnlyOption,
    hasCreateCompanyWizardSignal,
    hasForbiddenDataBasisSignal,
    externalHelpOpened,
    routeUsableForCompanyCreationGate
  });
  await writeJson('TARGET-006-result.json', result);
  await writeText(
    'TARGET-006.md',
    [
      '# TARGET-006 Unternehmen einrichten Route',
      '',
      '| Punkt | Ergebnis |',
      '|---|---|',
      '| Instanz | playthru |',
      `| Zielcompany | ${TARGET_COMPANY} |`,
      `| Zeile geklickt | ${rowClick.clicked ? 'ja, nur Route Discovery' : 'nein'} |`,
      `| Blank/setup-only Option sichtbar | ${hasBlankOrSetupOnlyOption ? 'ja' : 'nein'} |`,
      `| Create-New-Company-Wizard-Signal | ${hasCreateCompanyWizardSignal ? 'ja' : 'nein'} |`,
      `| Copy/Test/Demo/CRONUS-Signal | ${hasForbiddenDataBasisSignal ? 'ja' : 'nein'} |`,
      `| Route fuer naechstes Gate nutzbar | ${routeUsableForCompanyCreationGate ? 'ja' : 'nein'} |`,
      '',
      '## Grenze',
      '',
      '- Keine Company wurde erstellt.',
      '- Kein Finish, Create, OK, Save, Weiter oder Starten wurde bestaetigt.',
      '- Keine CRONUS-/Demo-/Testcompany-Route wurde als Universaarl-Basis akzeptiert.',
      '- CRONUS DE bleibt nur Shell-Kontext vor der Universaarl-Anlage.',
      '',
      '## Naechster Schritt',
      '',
      resultStatus === 'observed'
        ? 'Als naechstes werden die sichtbaren Felder und Datenbasisoptionen gemappt, bevor eine wirksame Erstellung erlaubt wird.'
        : 'Als naechstes braucht es eine Quellen-/Routenentscheidung: alternative Microsoft-gestuetzte UI-Route, Admin-Route oder ein anderer erlaubter Company-Creation-Weg innerhalb playthru.',
      ''
    ].join('\n')
  );
});
