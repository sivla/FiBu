import assert from 'node:assert/strict';
import fs from 'node:fs';

import { analyzeJournalCellCandidates } from './journal-grid-candidates';

const target = {
  rowRequiredSignals: ['G05001', 'FA-CNC-01', 'HGB'],
  columnSignals: ['Bal. Account No.', 'Bal Account No', 'Gegenkonto'],
  forbiddenSignals: ['K30000'],
  expectedValue: '82000',
};

const fa172 = JSON.parse(
  fs.readFileSync('playwright/projects/fibu-book5/evidence/fixedassets-172/010-balaccount-82000-preflight-signals.json', 'utf8'),
);

const fa172Before = analyzeJournalCellCandidates(
  {
    headers: fa172.beforeSignals.relevantHeaders,
    rows: fa172.beforeSignals.relevantRows,
    controls: fa172.beforeSignals.balAccountCandidates,
  },
  target,
);
assert.equal(fa172Before.success, false);
assert.equal(fa172Before.status, 'blocked-missing-row-anchor');
assert.equal(fa172Before.visibleSignals.columnSignalVisible, true);
assert.equal(fa172Before.visibleSignals.editableCandidateCount, 0);

const safeSynthetic = analyzeJournalCellCandidates(
  {
    headers: ['Document No.', 'Account No.', 'Depreciation Book Code', 'Bal. Account No.'],
    rows: ['G05001 Fixed Asset FA-CNC-01 HGB Acquisition Cost CNC Maschine FRA'],
    controls: [
      {
        index: 4,
        ariaLabel: 'Bal. Account No.',
        rowText: 'G05001 Fixed Asset FA-CNC-01 HGB Acquisition Cost CNC Maschine FRA',
        cellText: 'Bal. Account No.',
        value: '',
        readOnly: false,
        disabled: false,
      },
    ],
  },
  target,
);
assert.equal(safeSynthetic.success, true);
assert.equal(safeSynthetic.status, 'single-editable-candidate');
assert.equal(safeSynthetic.editableCandidates.length, 1);

const forbiddenSynthetic = analyzeJournalCellCandidates(
  {
    headers: ['Bal. Account No.'],
    rows: ['G05001 Fixed Asset FA-CNC-01 HGB K30000'],
    controls: [
      {
        index: 1,
        ariaLabel: 'Bal. Account No.',
        rowText: 'G05001 Fixed Asset FA-CNC-01 HGB K30000',
        cellText: 'Bal. Account No.',
        value: '',
      },
    ],
  },
  target,
);
assert.equal(forbiddenSynthetic.success, false);
assert.equal(forbiddenSynthetic.status, 'blocked-forbidden-signal-visible');

console.log('journal-grid-candidates selftest OK');
