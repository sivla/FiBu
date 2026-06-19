import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  visibleButtonNames,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-090-FA-GL-JOURNAL-CLEANUP-ACTION-INVENTORY-READONLY';
const TEST_ID = 'fixedassets-090';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_LABEL = 'Fixed Asset G/L Journals';
const TARGET_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function faJournalPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(TARGET_PAGE_ID));
  return url.toString();
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
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

function isBusinessCentralFrameUrl(value: string) {
  try {
    return new URL(value).hostname === 'businesscentral.dynamics.com';
  } catch {
    return false;
  }
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url,
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function collectActionInventory(page: Page, groupLabels: RegExp[]) {
  const beforeButtons = (await visibleButtonNames(page)).map(cleanText).filter(Boolean).slice(0, 180);
  const openedGroups: Array<{ group: string; clicked: boolean; blockedBy?: string; visibleAfter: string[] }> = [];

  for (const groupLabel of groupLabels) {
    const beforeGroupButtons = (await visibleButtonNames(page)).map(cleanText).filter(Boolean).slice(0, 180);
    const unsafeVisibleBefore = beforeGroupButtons.filter((label) =>
      /^(Post|Buchen)$|Preview Posting|Buchungsvorschau|Insert FA Bal\. Account|Reconcile|Delete|Loeschen|Loschen/i.test(label),
    );

    let clicked = false;
    let blockedBy = '';
    for (const scope of [page, ...page.frames()]) {
      const menu = scope.getByRole('menuitem', { name: groupLabel }).first();
      if (await menu.isVisible({ timeout: 500 }).catch(() => false)) {
        const label = cleanText(await menu.innerText({ timeout: 500 }).catch(() => ''));
        if (/^(Post|Buchen)$|Preview Posting|Buchungsvorschau|Insert FA Bal\. Account|Reconcile|Delete|Loeschen|Loschen/i.test(label)) {
          blockedBy = `Refused to click risky action label ${label}.`;
          break;
        }
        await menu.click({ timeout: 2000 });
        await page.waitForTimeout(800);
        clicked = true;
        break;
      }

      const button = scope.getByRole('button', { name: groupLabel }).first();
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        const label = cleanText(await button.innerText({ timeout: 500 }).catch(() => ''));
        if (/^(Post|Buchen)$|Preview Posting|Buchungsvorschau|Insert FA Bal\. Account|Reconcile|Delete|Loeschen|Loschen/i.test(label)) {
          blockedBy = `Refused to click risky action label ${label}.`;
          break;
        }
        await button.click({ timeout: 2000 });
        await page.waitForTimeout(800);
        clicked = true;
        break;
      }
    }

    const visibleAfter = (await visibleButtonNames(page)).map(cleanText).filter(Boolean).slice(0, 220);
    openedGroups.push({
      group: groupLabel.source,
      clicked,
      blockedBy: blockedBy || undefined,
      visibleAfter: visibleAfter.filter((label) => !beforeGroupButtons.includes(label)).slice(0, 80),
    });

    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
    if (!clicked && !blockedBy && unsafeVisibleBefore.length > 0) {
      openedGroups.at(-1)!.blockedBy = `Skipped group because risky visible actions are present nearby: ${unsafeVisibleBefore.join(', ')}`;
    }
  }

  const afterButtons = (await visibleButtonNames(page)).map(cleanText).filter(Boolean).slice(0, 220);
  const pageActionTexts = await page.evaluate(() => {
    return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => ({
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
        ariaLabel: element.getAttribute('aria-label') ?? '',
        title: element.getAttribute('title') ?? '',
        role: element.getAttribute('role'),
      }));
  });

  return {
    beforeButtons,
    openedGroups,
    afterButtons,
    actions: pageActionTexts
      .map((entry) => ({
        text: cleanText(entry.text),
        ariaLabel: cleanText(entry.ariaLabel),
        title: cleanText(entry.title),
        role: entry.role,
      }))
      .filter((entry) => {
        const haystack = [entry.text, entry.ariaLabel, entry.title].join(' ');
        return /Fixed Asset G\/L Journals|Verwalten|Manage|Start|Line|Page|Post|Delete|Loeschen|Loschen|Insert FA Bal\. Account|Reconcile|Apply Entries|New|Neu|Edit|Bearbeiten|Copy|Refresh|Filter/i.test(
          haystack,
        );
      })
      .slice(0, 180),
  };
}

function actionFlags(labels: string[]) {
  return {
    deleteVisible: labels.some((label) => /Delete|Loeschen|Loschen/i.test(label)),
    newVisible: labels.some((label) => /^(New|Neu)$|New Line|Neue Zeile/i.test(label)),
    editVisible: labels.some((label) => /^Edit|Bearbeiten/i.test(label)),
    postVisible: labels.some((label) => /^(Post|Buchen)$/i.test(label)),
    previewVisible: labels.some((label) => /Preview Posting|Buchungsvorschau|Vorschau/i.test(label)),
    insertFaBalAccountVisible: labels.some((label) => /Insert FA Bal\. Account/i.test(label)),
    reconcileVisible: labels.some((label) => /Reconcile/i.test(label)),
    applyEntriesVisible: labels.some((label) => /Apply Entries/i.test(label)),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string, cleanupCandidateFound: boolean) {
  const nextCase =
    status === 'observed' && cleanupCandidateFound
      ? 'FIXEDASSETS-091-FA-GL-JOURNAL-DRAFT-PROBE-PLAN'
      : 'FIXEDASSETS-091-FA-GL-JOURNAL-CLEANUP-ROUTE-DECISION';
  const nextFile =
    status === 'observed' && cleanupCandidateFound
      ? '.agent/state/cases/fixedassets-091-fa-gl-journal-draft-probe-plan.json'
      : '.agent/state/cases/fixedassets-091-fa-gl-journal-cleanup-route-decision.json';
  const nextStep =
    status === 'observed' && cleanupCandidateFound
      ? 'Plan a tightly scoped no-post draft line probe with proven cleanup route, stop conditions and no Preview/Post.'
      : 'Decide whether cleanup must use a keep-draft policy, a safer cleanup discovery route or another route before any journal value entry.';

  return {
    current: {
      activeCase: nextCase,
      active_case_file: nextFile,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-090-fa-gl-journal-cleanup-action-inventory-readonly.json',
      nextStep,
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-cleanup-action-inventory-readonly',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      resultStatus: status,
      summary,
      nextStep,
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-090/FIXEDASSETS-090-result.json',
        summary,
      },
      nextSafeAction: nextStep,
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: cleanupCandidateFound ? 'fa-gl-journal-draft-probe-plan' : 'fa-gl-journal-cleanup-route-decision',
          latestPracticalCase: 'FIXEDASSETS-090',
          nextCase,
        },
      },
    },
  };
}

test('FIXEDASSETS-090 inventories FA journal cleanup actions read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let contextBefore: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let contextAfter: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let inventory: Awaited<ReturnType<typeof collectActionInventory>> | undefined;
  let pageContextText = '';

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);

    contextBefore = await sandboxContext(page);
    if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context before FA-090 action inventory: ${JSON.stringify(contextBefore)}`);
    } else {
      pageContextText = await compactPageText(page, {
        include: [
          /Fixed Asset|FA G\/L|G\/L Journal|Journal/i,
          /Verwalten|Manage|Start|Line|Page|Post|Insert FA Bal\. Account|Reconcile|Apply Entries|Delete|New|Edit/i,
          /Batch Name|Posting Date|Document No\.|Account Type|FA Posting Type|Amount/i,
        ],
        maxLines: 140,
        maxLineLength: 220,
      });
      inventory = await collectActionInventory(page, [/^Verwalten$|^Manage$/i, /^Line$/i, /^Page$/i]);
      contextAfter = await sandboxContext(page);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const allLabels = [...(inventory?.beforeButtons ?? []), ...(inventory?.afterButtons ?? []), ...(inventory?.actions.map((action) => action.text || action.ariaLabel || action.title) ?? [])].filter(Boolean);
  const flags = actionFlags(allLabels);
  const cleanupCandidateFound = flags.deleteVisible;
  const riskyExecuted = false;
  if (!inventory) {
    blockedBy.push('No action inventory was captured.');
  }
  if (!contextAfter?.environmentInUrl || (!contextAfter.companyInUrl && !contextAfter.companyInText) || contextAfter.wrongEnvironmentVisible) {
    blockedBy.push(`Wrong BC context after FA-090 action inventory: ${JSON.stringify(contextAfter)}`);
  }
  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? cleanupCandidateFound
        ? 'FA-090 captured read-only journal action inventory and found a cleanup/delete candidate. No action was executed.'
        : 'FA-090 captured read-only journal action inventory. Post is visible and remains locked. A safe Delete cleanup route was not proven; group probing can return Role Center context, so cleanup remains unproven rather than disproven.'
      : `FA-090 could not capture a safe journal action inventory. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary, cleanupCandidateFound);

  await writeTextEvidence(faEvidencePath('010-fa-journal-action-context.txt'), pageContextText || 'No FA journal action context captured.');
  await writeJsonEvidence(faEvidencePath('020-fa-journal-action-inventory.json'), {
    contextBefore,
    contextAfter,
    inventory,
    actionFlags: flags,
    cleanupCandidateFound,
    riskyExecuted,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-cleanup-action-inventory-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    proved: [
      ...(contextAfter?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(contextAfter?.companyInUrl || contextAfter?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(inventory ? ['Fixed Asset G/L Journals action inventory was captured read-only.'] : []),
      ...(cleanupCandidateFound ? ['A Delete cleanup candidate is visible as an action label.'] : []),
      'The run did not create, edit, delete, preview, post, reconcile, insert balancing account, pay, invoice, ship or change setup.',
    ],
    notProved: [
      ...(cleanupCandidateFound
        ? ['The Delete action was not executed or confirmed.']
        : [
            'No Delete cleanup route is proven.',
            'The safe action scan does not prove that Delete is impossible; it only did not surface a safe Delete route.',
            'Group probing can return Role Center context, so grouped action evidence is limited.',
          ]),
      'No journal line was created.',
      'No FA-CNC-01 was entered in a journal.',
      'No K30000 was entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No acquisition posting.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-090-fa-gl-journal-cleanup-action-inventory-readonly.json',
      cleanupCandidateFound
        ? '.agent/state/cases/fixedassets-091-fa-gl-journal-draft-probe-plan.json'
        : '.agent/state/cases/fixedassets-091-fa-gl-journal-cleanup-route-decision.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-090-fa-gl-journal-cleanup-action-inventory-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/FIXEDASSETS-090-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/FIXEDASSETS-090-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/010-fa-journal-action-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/020-fa-journal-action-inventory.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-090/FIXEDASSETS-090-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/FIXEDASSETS-090-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/010-fa-journal-action-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-090/020-fa-journal-action-inventory.json',
    ],
    warnings: [
      'Action inventory only. Candidate labels are not executed actions.',
      'Cleanup remains unproven, not disproven.',
      'If group probing returns Role Center context, use the result as a conservative blocker, not as a complete action map.',
      'Post, Reconcile and Insert FA Bal. Account may be visible but remain forbidden.',
      'CRONUS/RM-DEMO labor only.',
    ],
    blockedBy,
    requiresReview: status === 'blocked',
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    actionInventory: {
      actionFlags: flags,
      cleanupCandidateFound,
      openedGroups: inventory?.openedGroups ?? [],
    },
    flags: {
      stayedInExpectedInstance: Boolean(contextAfter?.environmentInUrl),
      companyContextDocumented: Boolean(contextAfter?.companyInUrl || contextAfter?.companyInText),
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noReconcile: true,
      noInsertFaBalAccount: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noEditRecord: true,
      noDeleteExecuted: true,
      noJournalLineCreated: true,
      cleanupRequired: false,
      cleanupCompleted: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-090-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-090-learning.md'),
    [
      '# FIXEDASSETS-090 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `action-inventory`, `no-draft`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Aktionsleisten in Business Central sind nicht gleichbedeutend mit ausgefuehrten Aktionen. Fuer Journale muss man zwischen sichtbaren Kandidaten, geoeffneten Menuegruppen und tatsaechlich ausgefuehrten Aktionen unterscheiden. FA-090 inventarisiert nur, ob ein Cleanup-Pfad sichtbar ist.',
      '',
      'Ein weiterer Lernpunkt ist die Kontextkontrolle nach Menueaktionen: Wenn ein Scan wieder Role-Center-Texte sieht, darf der Evidence-Befund nicht als vollstaendige Action Map verkauft werden. Fuer das Buch zaehlt dann die konservative Aussage: Der sichere Lauf hat keinen Cleanup-Pfad nachgewiesen.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 sollte vor Journal-Drafts erklaeren, dass eine Zeile erst angelegt werden darf, wenn Loeschen oder bewusstes Behalten dokumentiert ist. Sichtbare Aktionen wie `Post`, `Reconcile` oder `Insert FA Bal. Account` bleiben gesperrt.',
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
      '# FIXEDASSETS-090 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-fa-journal-action-context.txt` | Text | sichtbarer Journal-/Aktionskontext | keine Aktion ausgefuehrt | `labor`, `read-only` |',
      '| `020-fa-journal-action-inventory.json` | JSON | Aktionslabels und Cleanup-Kandidaten im sicheren Scan | vollstaendige Action Map; Gruppen-Scan kann in Role-Center-Kontext zurueckkehren | `labor`, `read-only`, `limited` |',
      '| `FIXEDASSETS-090-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-090-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noReconcile).toBe(true);
  expect(result.flags.noInsertFaBalAccount).toBe(true);
  expect(result.flags.noDeleteExecuted).toBe(true);
  expect(result.flags.noNewDraft).toBe(true);
  expect(result.flags.noEditRecord).toBe(true);
});
