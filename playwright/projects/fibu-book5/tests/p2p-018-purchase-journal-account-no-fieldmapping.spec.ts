import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2400, height: 1400 }
});

test.setTimeout(240_000);

const TEST_ID = 'p2p-018';
const PAGE_ID_PURCHASE_JOURNAL = 254;

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/businesscentral\.dynamics\.com\/[0-9a-f]{8}-[0-9a-f-]{27,}\//gi, 'businesscentral.dynamics.com/[tenant-id]/')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

async function openPurchaseJournal(page: Page) {
  await page.goto(bcPageUrl(PAGE_ID_PURCHASE_JOURNAL, project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
}

async function purchaseJournalFrame(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (/Purchase Journals/i.test(text) && /Batch Name/i.test(text)) return frame;
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('Purchase-Journal-Frame nicht gefunden.');
}

async function visibleGridSignals(frame: Frame) {
  return frame.evaluate(() => {
    const interesting = /Posting Date|Document Type|Document No\.|External Document|Account Type|Account No\.|Description|Gen\. Posting Type|Gen\. Bus\. Posting Group|Gen\. Prod\. Posting Group|Amount|Bal\. Account Type|Bal\. Account No\.|Bal\. Gen\. Posting Type|Bal\. Gen\. Prod\. Posting Group|Bal\. Gen\. Bus\. Posting Group/i;
    const nodes = [...document.querySelectorAll('input,select,[role="columnheader"],th,button,[aria-label],[title]')];
    return nodes
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const input = element as HTMLInputElement | HTMLSelectElement;
        const text = [
          element.textContent ?? '',
          element.getAttribute('aria-label') ?? '',
          element.getAttribute('title') ?? '',
          input.value ?? ''
        ]
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        return {
          tag: element.tagName,
          role: element.getAttribute('role') ?? '',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          value: input.value ?? '',
          ariaLabel: element.getAttribute('aria-label') ?? '',
          title: element.getAttribute('title') ?? '',
          text: (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
          interesting: interesting.test(text)
        };
      })
      .filter((entry) => entry.width > 0 && entry.height > 0 && (entry.interesting || (entry.y > 250 && entry.y < 470)))
      .sort((left, right) => left.y - right.y || left.x - right.x)
      .slice(0, 220);
  });
}

function compactRowsFromText(text: string) {
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = lines.filter((line) =>
    /Posting Date|Document Type|Document No\.|Account Type|Account No\.|Gen\. Bus\. Posting Group|Gen\. Prod\. Posting Group|Amount|Bal\. Account Type|Bal\. Account No\.|Journal Check|Preview Posting|Post/i.test(line)
  );
  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...selected.slice(0, 120)
  ].join('\n'));
}

test('P2P-018 maps Purchase Journal Account No. and balancing account fields read-only', async ({ page }) => {
  await openPurchaseJournal(page);
  const frame = await purchaseJournalFrame(page);
  const signals = await visibleGridSignals(frame);
  const bodyText = await pageText(page);
  await writeJsonEvidence(p2pEvidencePath('010-visible-grid-signals.json'), signals);
  await writeTextEvidence(p2pEvidencePath('020-compact-page-text.txt'), compactRowsFromText(bodyText));
  await screenshot(page, 'p2p-018-010-purchase-journal-fieldmapping.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'Purchase Journal Feldmapping fuer Account No. und Bal. Account No.; keine Wert-Eingabe.',
    expectedPageText: [/Purchase Journals/i, /Account No\./i],
    knownLimitations: ['Read-only Diagnose', 'Keine Preview', 'Keine Buchung']
  });

  const texts = signals.map((entry) => `${entry.text} ${entry.ariaLabel} ${entry.title} ${entry.value}`).join('\n');
  const result = {
    schemaVersion: 1,
    caseId: 'P2P-018-PURCHASE-JOURNAL-ACCOUNT-NO-FIELDMAPPING',
    parentCaseId: 'BC-DEEP-RUN-001-MULTI-ROUTE-SANDBOX-PROGRESS',
    source: 'playwright-ui-readonly-fieldmapping',
    resultStatus: /Account No\./i.test(texts) ? 'observed' : 'blocked',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceCompany: 'RM-DEMO',
    bcRun: true,
    posted: false,
    previewPosting: false,
    setupChanges: [],
    signals: ['field-mapping-diagnosis'],
    execute: false,
    highImpactExecute: false,
    lightExecute: false,
    flags: {
      noFieldValueEntry: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/p2p-018/010-visible-grid-signals.json',
      'playwright/projects/fibu-book5/evidence/p2p-018/020-compact-page-text.txt'
    ],
    screenshots: ['playwright/projects/fibu-book5/img/p2p-018-010-purchase-journal-fieldmapping.png'],
    findings: [
      'Purchase Journal exposes both Account No. and Bal. Account No. captions in the grid context.',
      'P2P-016 should be treated as unresolved because Account No. remained the Journal Check issue after the 82000 balancing-account attempt.',
      'The next value route needs field-specific ownership: primary Account No. versus Bal. Account No., plus account type pairing.'
    ],
    blockedBy: [],
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    nextStep: 'P2P-019: use the fieldmapping evidence to set the correct Account No./Bal. Account pairing, then Journal Check and Preview only if clean.'
  };
  await writeJsonEvidence(p2pEvidencePath('P2P-018-result.json'), result);
  await writeTextEvidence(
    p2pEvidencePath('README.md'),
    [
      '# P2P-018 Purchase Journal Account No. Fieldmapping',
      '',
      'Status: `field-mapping-diagnosis`, `read-only`, `needs-german-final-rebuild`.',
      '',
      '## Ergebnis',
      '',
      '- Purchase Journal wurde direkt geoeffnet.',
      '- Account-No.- und Bal.-Account-No.-Kontext wurde kompakt erfasst.',
      '- Keine Werteingabe, kein Draft, keine Preview, keine Buchung.',
      '',
      '## Naechster Schritt',
      '',
      '`P2P-019`: Feldspezifische Wert-Route fuer Account No. / Bal. Account No.; Journal Check, Preview nur bei sauberem Check.'
    ].join('\n')
  );

  expect(result.resultStatus).toBe('observed');
});
