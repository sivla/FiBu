import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';

import {
  compactPageText,
  pageText,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-196-FA-GL-JOURNAL-ERROR-MESSAGES-READONLY';
const TEST_ID = 'fixedassets-196';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const SOURCE_RESULT_PATH = 'playwright/projects/fibu-book5/evidence/fixedassets-194/FIXEDASSETS-194-result.json';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(180_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

function safeEvidenceText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe/i.test(line))
    .join('\n');
}

async function sourceErrorMessagesUrl() {
  const raw = await fs.readFile(SOURCE_RESULT_PATH, 'utf8');
  const parsed = JSON.parse(raw) as {
    environment?: { urlAfterRun?: string };
  };
  const candidate = parsed.environment?.urlAfterRun;
  if (!candidate) {
    throw new Error(`Source result ${SOURCE_RESULT_PATH} has no environment.urlAfterRun.`);
  }

  const url = new URL(candidate);
  const decoded = decodeURIComponent(url.toString());
  if (!decoded.includes(EXPECTED_INSTANCE)) {
    throw new Error(`Source Error Messages URL is outside ${EXPECTED_INSTANCE}.`);
  }
  if (url.searchParams.get('company') !== EXPECTED_COMPANY) {
    throw new Error(`Source Error Messages URL is not company ${EXPECTED_COMPANY}.`);
  }
  if (url.searchParams.get('page') !== '700') {
    throw new Error('Source URL is not Business Central Error Messages page 700.');
  }

  return url.toString();
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url: safeUrl(url),
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    page700InUrl: new URL(url).searchParams.get('page') === '700',
    errorMessagesVisible: /Error Messages|Fehlermeldungen/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function dialogTexts(page: Page) {
  return page
    .locator('[role="dialog"], .ms-Dialog, [aria-modal="true"]')
    .evaluateAll((elements) =>
      elements.map((element) =>
        cleanText(element.textContent),
      ),
    )
    .catch(() => []);
}

async function visibleErrorMessageData(page: Page) {
  const entries: Array<{
    frameUrl: string;
    index: number;
    tagName: string;
    role: string;
    text: string;
    ariaLabel: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  async function fromScope(scope: Page | Frame) {
    return scope.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    const candidates = [...document.querySelectorAll<HTMLElement>('[role="row"], [role="gridcell"], [role="cell"], table tr, [aria-label], [title]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          text: norm(element.innerText || element.textContent),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => [entry.text, entry.ariaLabel, entry.title].some(Boolean));

    return candidates.slice(0, 260);
    }).catch(() => []);
  }

  for (const frame of page.frames()) {
    const frameEntries = await fromScope(frame);
    entries.push(...frameEntries.map((entry) => ({ ...entry, frameUrl: safeUrl(frame.url()).slice(0, 180) })));
  }

  return entries;
}

function concreteErrorLines(text: string, visibleData: Awaited<ReturnType<typeof visibleErrorMessageData>>) {
  const combined = [
    text,
    ...visibleData.flatMap((entry) => [entry.text, entry.ariaLabel, entry.title]),
  ].join('\n');
  const seen = new Set<string>();
  return combined
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/^(Error Messages:?|Hilfe & Dokumentation|Depreciation Book Code|Description|Message Type|Context|Liste mit Titel|Business Central)$/i.test(line))
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|Account Manager|Konto-Manager|App-Startfeld|Copilot|Suchen|Einstellungen|Hilfe|Benachrichtigungen/i.test(line))
    .filter((line) => !/Post financial transactions|Process incoming and outgoing payments|Make quotes, orders|Manage purchase invoices|Verwalten Sie Shopify|Durchsucht alle Berichte|Open the record that is associated|Hier sehen Sie|Filterbereich anzeigen|Breite Layoutansicht|Infobox|Sortieren nach|Menu .* o ffnen|Details o ffnen/i.test(line))
    .filter((line) => !/^(Finance|Cash Management|Sales|Purchasing|Shopify|Alle Berichte|Open related record|Start|Alle|Support|Troubleshooting|Fehlerspeicherort|Quelle|Kontext|Details)$/i.test(line))
    .filter((line) => /Error|Fehler|must|muss|missing|fehlt|does not exist|nicht vorhanden|value|Wert|Depreciation|FA |Fixed Asset|Anlage|G\/L|Sachkonto|Bal\.|Account|Konto|Code/i.test(line))
    .filter((line) => !/^[A-Z]{1,3}$|^undefined$/i.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, 80);
}

function compactErrorMessageData(visibleData: Awaited<ReturnType<typeof visibleErrorMessageData>>) {
  return visibleData
    .filter((entry) => {
      const label = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
      return /Error Messages|Description|Message Type|Status|In dieser Ansicht kann nichts angezeigt werden|Details|Kontext|Datensatz|Feldname|Fehlerspeicherort|Quelle|Support|Troubleshooting|\(Leer\)/i.test(label);
    })
    .filter((entry) => !/Finance|Cash Management|Sales|Purchasing|Shopify|Alle Berichte|Suchen|Einstellungen|Konto-Manager|Copilot|Benachrichtigungen/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
    .slice(0, 80);
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: 'FIXEDASSETS-197-FA-GL-JOURNAL-PREVIEW-BLOCKER-DECISION',
      active_case_file: '.agent/state/cases/fixedassets-197-fa-gl-journal-preview-blocker-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-196-fa-gl-journal-error-messages-readonly.json',
      requiresStrongModel: true,
      nextStep: status === 'observed'
        ? 'FIXEDASSETS-197: locally decide the next FA G/L Journal setup/data fix from the captured Error Messages details before retrying Preview Posting.'
        : 'FIXEDASSETS-197: locally decide whether the empty direct Error Messages page means the next safe route must capture details immediately after Preview Posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-error-message-details' : 'blocked-error-message-details',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-196/FIXEDASSETS-196-result.json',
        summary,
      },
      nextSafeAction: status === 'observed'
        ? 'Run local decision review; do not retry Preview Posting or change setup yet.'
        : 'Run local blocker review; do not retry Preview Posting or change setup yet.',
    },
  };
}

test('FIXEDASSETS-196 captures Error Messages details read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let targetUrl = '';
  let compactText = '';
  let fullText = '';
  let visibleData: Awaited<ReturnType<typeof visibleErrorMessageData>> = [];
  let compactVisibleData: Awaited<ReturnType<typeof visibleErrorMessageData>> = [];
  let dialogs: string[] = [];
  let errorLines: string[] = [];
  let emptyListVisible = false;

  try {
    targetUrl = await sourceErrorMessagesUrl();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(1800);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    }
    if (!context.page700InUrl || !context.errorMessagesVisible) {
      blockedBy.push(`Error Messages page 700 was not visible: ${JSON.stringify(context)}`);
    }

    dialogs = await dialogTexts(page);
    const riskyDialog = dialogs.find((text) => /\b(OK|Yes|Ja|Post|Buchen|Delete|Loeschen|Preview|Vorschau)\b/i.test(text));
    if (riskyDialog) {
      blockedBy.push(`Risky dialog visible on read-only Error Messages page: ${riskyDialog.slice(0, 240)}`);
    }

    visibleData = await visibleErrorMessageData(page);
    compactVisibleData = compactErrorMessageData(visibleData);
    fullText = await pageText(page);
    emptyListVisible =
      /In dieser Ansicht kann nichts angezeigt werden|Nothing to show in this view|There is nothing to show in this view/i.test(fullText) ||
      compactVisibleData.some((entry) => /In dieser Ansicht kann nichts angezeigt werden|Nothing to show/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`));
    compactText = await compactPageText(page, {
      include: [
        /Error Messages|Fehlermeldungen|Message Type|Description|Context|Record ID|Field|Table|Source|Depreciation|Anlage|FA|G\/L|Sachkonto|Account|Konto|must|muss|missing|fehlt|does not exist|nicht vorhanden|value|Wert/i,
      ],
      maxLines: 220,
      maxLineLength: 260,
    });
    errorLines = concreteErrorLines(compactText || fullText, compactVisibleData);
    if (emptyListVisible) {
      blockedBy.push('Error Messages page is visible but the list is empty in this read-only route.');
    }
    if (errorLines.length === 0) {
      blockedBy.push('Error Messages page opened, but no concrete error detail beyond page/list labels was readable.');
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary = status === 'observed'
    ? `FA-196 captured ${errorLines.length} concrete Error Messages detail line(s) read-only from the FA G/L Journal Preview Posting result.`
    : `FA-196 stayed read-only but did not capture concrete Error Messages details. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-error-messages-readonly.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-196-error-messages-readonly-capture',
    caseId: CASE_ID,
    sourceResult: SOURCE_RESULT_PATH,
    targetUrl: targetUrl ? safeUrl(targetUrl) : '',
    context,
    dialogs,
    visibleData: compactVisibleData,
    concreteErrorLines: errorLines,
    emptyListVisible,
    safety: {
      readOnly: true,
      noPreviewRetry: true,
      noPost: true,
      noJournalEdit: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    blockedBy,
  });
  await writeTextEvidence(
    faEvidencePath('020-error-messages-text.txt'),
    safeEvidenceText(compactText || fullText) || 'No readable Error Messages text was captured.',
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-196-error-messages-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-error-messages',
    resultStatus: status,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      sourceUrl: targetUrl ? safeUrl(targetUrl) : '',
      finalUrl: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(context?.page700InUrl && context.errorMessagesVisible ? ['The Business Central Error Messages page 700 was opened read-only.'] : []),
      ...(status === 'observed' && errorLines.length > 0 ? [`Concrete Error Messages detail lines were captured read-only (${errorLines.length}).`] : []),
      ...(emptyListVisible ? ['The Error Messages list was proven empty in this direct read-only route.'] : []),
      'No Preview Posting retry was executed.',
      'No main Post button or Post menuitem was clicked.',
      'No OK/Yes confirmation was clicked.',
      'No journal line was created, edited or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(errorLines.length === 0 ? ['Concrete Error Messages details were not readable in this route.'] : []),
      ...(emptyListVisible ? ['The original preview-error detail is not recoverable from the direct Error Messages URL because BC shows an empty list.'] : []),
      'No setup correction was executed.',
      'No Preview Posting retry after the error detail capture was executed.',
      'No Fixed Asset G/L Journal posting was executed.',
      'No FA Ledger Entry or posted G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-196-fa-gl-journal-error-messages-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-196/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-196/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-196/010-error-messages-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-196/020-error-messages-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-196/FIXEDASSETS-196-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-196/FIXEDASSETS-196-result.json',
    ],
    warnings: [
      'Read-only error-detail capture only. Do not treat as setup correction or posting permission.',
      'Posting remains locked until a local decision review consumes the captured error detail.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      noPreviewRetry: true,
      noMainPostClick: true,
      noPostMenuitemClick: true,
      noPostAndPrintClick: true,
      noInsertLine: true,
      noDeleteLine: true,
      noPost: true,
      noOkYesConfirmation: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      concreteErrorLines: errorLines,
      emptyListVisible,
      visibleEntryCount: compactVisibleData.length,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-196-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-196-learning.md'),
    [
      '# FIXEDASSETS-196 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `error-detail-capture`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was wurde nicht getan',
      '',
      '- Kein erneutes `Preview Posting`.',
      '- Kein `Post`, `Post and Print`, `OK` oder `Yes`.',
      '- Keine Journalzeile geaendert.',
      '- Kein Setup geaendert.',
      '- Keine Buchaussage im Buch geaendert.',
      '',
      '## Lernwert',
      '',
      'Eine `Error Messages`-Seite ist noch keine Ursachenentscheidung. Fuer Business-Central-Klickanleitungen muss der konkrete Fehlertext zuerst read-only gesichert werden. Erst danach darf entschieden werden, ob Stammdaten, Buchungsmatrix, Journalwert oder UI-Route korrigiert werden.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-196 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-error-messages-readonly.json` | JSON | Error-Messages-Kontext, sichtbare DOM-/Listenwerte, Safety Flags | keine Setup-Korrektur | `labor` oder `blocked` |',
      '| `020-error-messages-text.txt` | Text | kompakter sichtbarer Fehlerseiten-Text | keine vollstaendige BC-Rohseite | `labor` oder `blocked` |',
      '| `FIXEDASSETS-196-result.json` | JSON | Ergebnis, Grenzen, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-196-learning.md` | Markdown | Lernwert fuer Fehleranalyse vor Setup/Posting | keine Buchung | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noPreviewRetry).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
