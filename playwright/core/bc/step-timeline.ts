import type { Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { captureBcVisualState, writeBcVisualState, type BcVisualStateSnapshot } from './visual-state-capture';

export type BcStepVerdict = 'proven' | 'not-proven' | 'blocked' | 'unknown';

export type BcStepTimelineEntry = {
  stepId: string;
  action: string;
  claim: string;
  verdict: BcStepVerdict;
  stopReason: string | null;
  beforeScreenshot: string;
  afterScreenshot: string;
  beforeVisualState: string;
  afterVisualState: string;
  urlBefore: string;
  urlAfter: string;
  beforeClassification: BcVisualStateSnapshot['classification'];
  afterClassification: BcVisualStateSnapshot['classification'];
  beforeAllClassifications: BcVisualStateSnapshot['allClassifications'];
  afterAllClassifications: BcVisualStateSnapshot['allClassifications'];
};

export type BcStepTimeline = {
  schemaVersion: 1;
  purpose: 'bc-step-timeline';
  caseId: string;
  project: string;
  evidenceId: string;
  createdAt: string;
  updatedAt: string;
  liveActionsExecuted: boolean;
  businessCentralOpened: boolean;
  playwrightLiveRunExecuted: boolean;
  entries: BcStepTimelineEntry[];
};

type StepInput = {
  stepId: string;
  action: string;
  claim: string;
  expectedPageText?: RegExp[];
  run?: () => Promise<void>;
  verdict?: BcStepVerdict | ((before: BcVisualStateSnapshot, after: BcVisualStateSnapshot) => BcStepVerdict);
  stopReason?: string | null | ((before: BcVisualStateSnapshot, after: BcVisualStateSnapshot) => string | null);
};

type TimelineOptions = {
  project: string;
  evidenceId: string;
  caseId: string;
  evidenceDir: string;
  evidenceDirRelative: string;
  fileName?: string;
};

function safeStepId(stepId: string) {
  return stepId.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function relativeJoin(base: string, fileName: string) {
  return `${base.replace(/\\/g, '/')}/${fileName}`;
}

async function screenshotAndState(
  page: Page,
  options: TimelineOptions,
  stepId: string,
  phase: 'before' | 'after',
  expectedPageText: RegExp[] | undefined,
  purpose: string
) {
  const fileStem = `${safeStepId(stepId)}-${phase}`;
  const screenshotFileName = `${fileStem}.png`;
  const visualStateFileName = `${fileStem}.visual-state.json`;
  const screenshotPath = path.join(options.evidenceDir, screenshotFileName);
  const visualStatePath = path.join(options.evidenceDir, visualStateFileName);

  await fs.mkdir(options.evidenceDir, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const screenshotRelativePath = relativeJoin(options.evidenceDirRelative, screenshotFileName);
  const snapshot = await captureBcVisualState(page, {
    screenshotPath: screenshotRelativePath,
    expectedPageText,
    purpose
  });
  await writeBcVisualState(visualStatePath, snapshot);

  return {
    screenshot: screenshotRelativePath,
    visualState: relativeJoin(options.evidenceDirRelative, visualStateFileName),
    snapshot
  };
}

export function createBcStepTimeline(options: TimelineOptions) {
  const now = new Date().toISOString();
  const timeline: BcStepTimeline = {
    schemaVersion: 1,
    purpose: 'bc-step-timeline',
    caseId: options.caseId,
    project: options.project,
    evidenceId: options.evidenceId,
    createdAt: now,
    updatedAt: now,
    liveActionsExecuted: false,
    businessCentralOpened: false,
    playwrightLiveRunExecuted: false,
    entries: []
  };

  return {
    timeline,
    async step(page: Page, input: StepInput) {
      const before = await screenshotAndState(
        page,
        options,
        input.stepId,
        'before',
        input.expectedPageText,
        `${input.stepId}: before ${input.action}`
      );
      let actionError: unknown = null;
      try {
        await input.run?.();
      } catch (error) {
        actionError = error;
      }
      const after = await screenshotAndState(
        page,
        options,
        input.stepId,
        'after',
        input.expectedPageText,
        `${input.stepId}: after ${input.action}`
      );
      const computedVerdict =
        typeof input.verdict === 'function' ? input.verdict(before.snapshot, after.snapshot) : input.verdict ?? 'unknown';
      const actionErrorReason = actionError instanceof Error ? actionError.message : actionError ? String(actionError) : null;
      const stopReason = actionErrorReason
        ? actionErrorReason
        : typeof input.stopReason === 'function'
          ? input.stopReason(before.snapshot, after.snapshot)
          : input.stopReason ?? null;
      const entry: BcStepTimelineEntry = {
        stepId: input.stepId,
        action: input.action,
        claim: input.claim,
        verdict: actionError ? 'blocked' : computedVerdict,
        stopReason,
        beforeScreenshot: before.screenshot,
        afterScreenshot: after.screenshot,
        beforeVisualState: before.visualState,
        afterVisualState: after.visualState,
        urlBefore: before.snapshot.url,
        urlAfter: after.snapshot.url,
        beforeClassification: before.snapshot.classification,
        afterClassification: after.snapshot.classification,
        beforeAllClassifications: before.snapshot.allClassifications,
        afterAllClassifications: after.snapshot.allClassifications
      };
      timeline.entries.push(entry);
      timeline.updatedAt = new Date().toISOString();
      if (actionError) throw actionError;
      return entry;
    },
    async write() {
      const fileName = options.fileName ?? 'step-timeline.json';
      const timelinePath = path.join(options.evidenceDir, fileName);
      await fs.mkdir(options.evidenceDir, { recursive: true });
      await fs.writeFile(timelinePath, JSON.stringify(timeline, null, 2), 'utf8');
      return relativeJoin(options.evidenceDirRelative, fileName);
    }
  };
}
