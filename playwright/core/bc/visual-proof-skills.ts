import type { BcVisualStateClassification, BcVisualStateSnapshot } from './visual-state-capture';

export type ReadFirstPageProofResult = {
  schemaVersion: 1;
  skill: 'read-first-page-proof';
  ok: boolean;
  pageOpened: boolean;
  pageContext: string;
  visualStateClassification: BcVisualStateClassification;
  screenshots: string[];
  proved: string[];
  notProved: string[];
  stopState: string | null;
  safeForWriteGate: false;
};

export type ScreenshotQaResult = {
  schemaVersion: 1;
  skill: 'screenshot-qa';
  ok: boolean;
  status: 'accepted-as-proof' | 'needs-retake-wide-layout' | 'rejected-wrong-surface';
  visibleProof: string[];
  missingProof: string[];
  retakeInstruction: string;
  bookUsable: boolean;
  stopState: string | null;
};

type ReadFirstPageProofInput = {
  snapshot: BcVisualStateSnapshot;
  expectedVisibleTexts: string[];
  screenshots: string[];
  pageContext: string;
};

type ScreenshotQaInput = {
  snapshot: BcVisualStateSnapshot;
  screenshotPath: string;
  claimedProof: string;
  expectedVisibleValues: string[];
  labOrFinal: 'draft' | 'final' | 'legacy' | 'rejected';
};

const acceptableReadFirstClassifications: BcVisualStateClassification[] = [
  'target-page-open',
  'side-pane-open',
  'list-page-open',
  'card-page-open'
];

function textContains(snapshot: BcVisualStateSnapshot, value: string) {
  return snapshot.textExcerpt.toLowerCase().includes(value.toLowerCase());
}

export function evaluateReadFirstPageProof(input: ReadFirstPageProofInput): ReadFirstPageProofResult {
  const visibleTexts = input.expectedVisibleTexts.filter((value) => textContains(input.snapshot, value));
  const missingTexts = input.expectedVisibleTexts.filter((value) => !textContains(input.snapshot, value));
  const classification = input.snapshot.classification;
  const pageOpened = acceptableReadFirstClassifications.includes(classification) && visibleTexts.length > 0;
  const stopState =
    classification === 'search-overlay-open'
      ? 'stop-search-overlay-open'
      : classification === 'role-center-background'
        ? 'stop-role-center-background'
        : classification === 'dialog-open'
          ? 'stop-dialog-open'
          : missingTexts.length > 0
            ? 'stop-expected-text-missing'
            : null;

  return {
    schemaVersion: 1,
    skill: 'read-first-page-proof',
    ok: pageOpened && stopState === null,
    pageOpened,
    pageContext: input.pageContext,
    visualStateClassification: classification,
    screenshots: input.screenshots,
    proved: visibleTexts.map((value) => `Visible: ${value}`),
    notProved: [
      ...missingTexts.map((value) => `Missing: ${value}`),
      ...(pageOpened ? [] : [`Visual state is ${classification}, not accepted read-first page proof.`])
    ],
    stopState,
    safeForWriteGate: false
  };
}

export function evaluateScreenshotQa(input: ScreenshotQaInput): ScreenshotQaResult {
  const visibleProof = input.expectedVisibleValues.filter((value) => textContains(input.snapshot, value));
  const missingProof = input.expectedVisibleValues.filter((value) => !textContains(input.snapshot, value));
  const wrongSurface = ['search-overlay-open', 'role-center-background', 'unknown'].includes(input.snapshot.classification);
  const finalFromNonFinal = input.labOrFinal !== 'final' && /final/i.test(input.claimedProof);

  const status: ScreenshotQaResult['status'] = wrongSurface
    ? 'rejected-wrong-surface'
    : missingProof.length > 0 || finalFromNonFinal
      ? 'needs-retake-wide-layout'
      : 'accepted-as-proof';
  const stopState =
    status === 'rejected-wrong-surface'
      ? 'stop-wrong-surface'
      : finalFromNonFinal
        ? 'stop-final-claim-from-nonfinal-evidence'
        : missingProof.length > 0
          ? 'stop-claimed-proof-not-visible'
          : null;

  return {
    schemaVersion: 1,
    skill: 'screenshot-qa',
    ok: status === 'accepted-as-proof',
    status,
    visibleProof,
    missingProof,
    retakeInstruction:
      status === 'accepted-as-proof'
        ? ''
        : `Retake ${input.screenshotPath} with the target page foreground visible, wide layout if needed, and visible values: ${missingProof.join(', ') || input.claimedProof}.`,
    bookUsable: status === 'accepted-as-proof' && input.labOrFinal !== 'rejected',
    stopState
  };
}
