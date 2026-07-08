import assert from 'node:assert/strict';
import { evaluateReadFirstPageProof, evaluateScreenshotQa } from './visual-proof-skills';
import type { BcVisualStateSnapshot } from './visual-state-capture';

function snapshot(overrides: Partial<BcVisualStateSnapshot>): BcVisualStateSnapshot {
  return {
    url: 'https://businesscentral.dynamics.com/example/playthru',
    pageTitle: 'Business Central',
    textExcerpt: '',
    focusedElement: null,
    signals: {
      targetTextVisible: false,
      sidePaneVisible: false,
      searchOverlayVisible: false,
      dialogVisible: false,
      roleCenterVisible: false,
      listSurfaceVisible: false,
      cardSurfaceVisible: false
    },
    classification: 'unknown',
    allClassifications: ['unknown'],
    notes: [],
    ...overrides
  };
}

{
  const result = evaluateReadFirstPageProof({
    snapshot: snapshot({
      classification: 'side-pane-open',
      textExcerpt: 'Rollencenter\nKonfigurationspakete\nU-VAT325-DISC\n0 Tabellen\n0 Datensaetze'
    }),
    expectedVisibleTexts: ['Konfigurationspakete', 'U-VAT325-DISC'],
    screenshots: ['foundation-package-existing-metadata-010-list-context.png'],
    pageContext: 'Configuration Packages side pane over Role Center'
  });
  assert.equal(result.ok, true);
  assert.equal(result.pageOpened, true);
  assert.equal(result.stopState, null);
  assert.equal(result.safeForWriteGate, false);
}

{
  const result = evaluateReadFirstPageProof({
    snapshot: snapshot({
      classification: 'search-overlay-open',
      textExcerpt: 'Seiten und Aufgaben\nKonfigurationspakete'
    }),
    expectedVisibleTexts: ['Konfigurationspakete'],
    screenshots: ['search-overlay.png'],
    pageContext: 'Tell-Me search overlay'
  });
  assert.equal(result.ok, false);
  assert.equal(result.stopState, 'stop-search-overlay-open');
}

{
  const result = evaluateScreenshotQa({
    snapshot: snapshot({
      classification: 'list-page-open',
      textExcerpt: 'Sachkonten\n1200 Bank\n3300 Verbindlichkeiten'
    }),
    screenshotPath: 'chart-of-accounts.png',
    claimedProof: 'Chart of Accounts starter accounts are visible',
    expectedVisibleValues: ['1200', '3300'],
    labOrFinal: 'draft'
  });
  assert.equal(result.ok, true);
  assert.equal(result.bookUsable, true);
}

{
  const result = evaluateScreenshotQa({
    snapshot: snapshot({
      classification: 'role-center-background',
      textExcerpt: 'Business Manager Role Center\nSachkonten'
    }),
    screenshotPath: 'role-center.png',
    claimedProof: 'final VAT setup proof',
    expectedVisibleValues: ['INLAND', 'VAT19'],
    labOrFinal: 'draft'
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 'rejected-wrong-surface');
  assert.equal(result.stopState, 'stop-wrong-surface');
}

console.log(
  JSON.stringify(
    {
      schemaVersion: 1,
      purpose: 'visual-proof-skills-selftest',
      ok: true,
      skills: ['read-first-page-proof', 'screenshot-qa'],
      modeledCases: [
        'side-pane-read-first-page-proof',
        'search-overlay-stop',
        'accepted-screenshot-qa',
        'wrong-surface-screenshot-reject'
      ],
      liveActionsExecuted: false,
      businessCentralOpened: false,
      playwrightLiveRunExecuted: false
    },
    null,
    2
  )
);
