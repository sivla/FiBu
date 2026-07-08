import assert from 'node:assert/strict';
import type { BcStepTimeline } from './step-timeline';

const timeline: BcStepTimeline = {
  schemaVersion: 1,
  purpose: 'bc-step-timeline',
  caseId: 'SELFTEST-READFIRST',
  project: 'fibu-book5',
  evidenceId: 'selftest-readfirst',
  createdAt: '2026-07-08T00:00:00.000Z',
  updatedAt: '2026-07-08T00:00:01.000Z',
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  entries: [
    {
      stepId: '010-open-configuration-packages-pane',
      action: 'open configuration packages read-first',
      claim: 'Configuration Packages is visible as a foreground pane, not a failed Role Center route.',
      verdict: 'proven',
      stopReason: null,
      beforeScreenshot: 'playwright/projects/fibu-book5/evidence/selftest-readfirst/010-before.png',
      afterScreenshot: 'playwright/projects/fibu-book5/evidence/selftest-readfirst/010-after.png',
      beforeVisualState: 'playwright/projects/fibu-book5/evidence/selftest-readfirst/010-before.visual-state.json',
      afterVisualState: 'playwright/projects/fibu-book5/evidence/selftest-readfirst/010-after.visual-state.json',
      urlBefore: 'https://businesscentral.dynamics.com/{tenant}/playthru?company=UNIVERSAARL-DE',
      urlAfter: 'https://businesscentral.dynamics.com/{tenant}/playthru?company=UNIVERSAARL-DE&page=8615',
      beforeClassification: 'role-center-background',
      afterClassification: 'side-pane-open',
      beforeAllClassifications: ['role-center-background'],
      afterAllClassifications: ['side-pane-open', 'role-center-background', 'target-page-open']
    }
  ]
};

assert.equal(timeline.schemaVersion, 1);
assert.equal(timeline.purpose, 'bc-step-timeline');
assert.equal(timeline.entries.length, 1);

const [entry] = timeline.entries;
assert.equal(entry.verdict, 'proven');
assert.equal(entry.afterClassification, 'side-pane-open');
assert.ok(entry.afterAllClassifications.includes('role-center-background'));
assert.ok(entry.beforeScreenshot.endsWith('.png'));
assert.ok(entry.afterVisualState.endsWith('.visual-state.json'));
assert.match(entry.claim, /foreground pane/i);

console.log(
  JSON.stringify(
    {
      schemaVersion: 1,
      purpose: 'bc-step-timeline-selftest',
      ok: true,
      modeledCases: ['foreground-pane-over-role-center', 'timeline-entry-schema'],
      liveActionsExecuted: false,
      businessCentralOpened: false,
      playwrightLiveRunExecuted: false
    },
    null,
    2
  )
);

