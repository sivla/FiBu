import assert from 'node:assert/strict';
import { classifyBcVisualState, type BcVisualStateSignals } from './visual-state-capture';

function classify(signals: Partial<BcVisualStateSignals>) {
  return classifyBcVisualState({
    targetTextVisible: false,
    sidePaneVisible: false,
    searchOverlayVisible: false,
    dialogVisible: false,
    roleCenterVisible: false,
    listSurfaceVisible: false,
    cardSurfaceVisible: false,
    ...signals
  });
}

{
  const result = classify({
    targetTextVisible: true,
    sidePaneVisible: true,
    roleCenterVisible: true,
    listSurfaceVisible: true
  });
  assert.equal(result.classification, 'side-pane-open');
  assert.ok(result.allClassifications.includes('role-center-background'));
  assert.ok(
    result.notes.some((note) => note.includes('Foreground side pane')),
    'side pane over role center must warn against false rejection'
  );
}

{
  const result = classify({
    searchOverlayVisible: true,
    targetTextVisible: true,
    roleCenterVisible: true
  });
  assert.equal(result.classification, 'search-overlay-open');
  assert.ok(result.notes.some((note) => note.includes('Search/Tell-Me overlay')));
}

{
  const result = classify({
    dialogVisible: true,
    targetTextVisible: true
  });
  assert.equal(result.classification, 'dialog-open');
}

{
  const result = classify({
    roleCenterVisible: true
  });
  assert.equal(result.classification, 'role-center-background');
}

{
  const result = classify({
    targetTextVisible: true,
    listSurfaceVisible: true
  });
  assert.equal(result.classification, 'list-page-open');
}

console.log(
  JSON.stringify(
    {
      schemaVersion: 1,
      purpose: 'bc-visual-state-capture-selftest',
      ok: true,
      modeledCases: [
        'configuration-packages-side-pane-over-role-center',
        'tell-me-search-overlay',
        'dialog-foreground',
        'role-center-background',
        'list-page-target'
      ],
      liveActionsExecuted: false,
      businessCentralOpened: false,
      playwrightLiveRunExecuted: false
    },
    null,
    2
  )
);
