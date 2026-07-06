import { type Frame, type Page } from '@playwright/test';

export type BcCardControlDiagnostic = {
  caption: string;
  selectedLabel: {
    text: string;
    tagName: string;
    role: string | null;
    ariaLabel: string;
    title: string;
    rect: { x: number; y: number; width: number; height: number };
    score: number;
    scoreReasons: string[];
  } | null;
  nearbyControls: Array<{
    tagName: string;
    role: string | null;
    ariaLabel: string;
    title: string;
    placeholder: string;
    value: string;
    text: string;
    disabled: boolean;
    readOnly: boolean;
    editable: boolean;
    checked: boolean | null;
    rect: { x: number; y: number; width: number; height: number };
  }>;
  nearbyButtons: Array<{
    tagName: string;
    role: string | null;
    ariaLabel: string;
    title: string;
    text: string;
    rect: { x: number; y: number; width: number; height: number };
  }>;
  rejectedBackgroundCandidates: Array<{
    text: string;
    tagName: string;
    role: string | null;
    rect: { x: number; y: number; width: number; height: number };
    reason: string;
  }>;
  diagnosis:
    | 'active-card-label-with-control'
    | 'active-card-label-with-button'
    | 'label-only'
    | 'background-list-only'
    | 'caption-not-visible';
};

export type BcCardControlDiagnosisResult = {
  scopeUrl: string;
  targetTextMatched: boolean;
  diagnostics: BcCardControlDiagnostic[];
  summary: {
    captions: number;
    activeCardLabelWithControl: number;
    activeCardLabelWithButton: number;
    labelOnly: number;
    backgroundListOnly: number;
    captionNotVisible: number;
  };
};

type CollectActiveCardControlDiagnosticsOptions = {
  targetText?: RegExp;
};

function scopeUrl(scope: Page | Frame): string {
  return scope.url();
}

async function frameText(scope: Page | Frame) {
  return scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
}

export async function collectActiveCardControlDiagnostics(
  page: Page,
  captions: string[],
  options: CollectActiveCardControlDiagnosticsOptions = {},
): Promise<BcCardControlDiagnosisResult> {
  const scopes: Array<Page | Frame> = [page, ...page.frames()];
  const scopedResults: BcCardControlDiagnosisResult[] = [];

  for (const scope of scopes) {
    const text = await frameText(scope);
    if (options.targetText && !options.targetText.test(text)) {
      continue;
    }

    const result = await scope.evaluate(
      ({ captionValues, targetPattern }) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        };
        const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const containsPattern = (element: HTMLElement, pattern: RegExp) => {
          const text = normalize(element.innerText || element.textContent);
          const ariaLabel = normalize(element.getAttribute('aria-label'));
          const title = normalize(element.getAttribute('title'));
          return pattern.test(text) || pattern.test(ariaLabel) || pattern.test(title);
        };
        const isGridCandidate = (element: HTMLElement) => {
          const role = normalize(element.getAttribute('role')).toLowerCase();
          const tagName = element.tagName.toUpperCase();
          return (
            tagName === 'TH' ||
            role === 'columnheader' ||
            Boolean(element.closest('table')) ||
            Boolean(element.closest('[role="grid"],[role="treegrid"],[aria-rowindex]'))
          );
        };

        const allElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const controls = Array.from(
          document.querySelectorAll<HTMLElement>('input,textarea,select,[contenteditable="true"],[role="combobox"]'),
        ).filter(visible);
        const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a')).filter(visible);

        const targetTextMatched = targetPattern ? new RegExp(targetPattern, 'i').test(normalize(document.body.innerText)) : true;

        const diagnostics = captionValues.map((caption) => {
          const captionPattern = new RegExp(`(^|\\b)${escape(caption).replace(/\\s+/g, '\\s+')}($|\\b)`, 'i');
          const rawCandidates = allElements
            .map((element) => {
              const text = normalize(element.innerText || element.textContent);
              const ariaLabel = normalize(element.getAttribute('aria-label'));
              const title = normalize(element.getAttribute('title'));
              return {
                element,
                text,
                tagName: element.tagName.toUpperCase(),
                role: normalize(element.getAttribute('role')) || null,
                ariaLabel,
                title,
                rect: rectOf(element),
                isGrid: isGridCandidate(element),
              };
            })
            .filter((candidate) => candidate.text.length > 0 && candidate.text.length <= 160)
            .filter((candidate) => containsPattern(candidate.element, captionPattern));

          const scoreCandidate = (candidate: (typeof rawCandidates)[number]) => {
            const reasons: string[] = [];
            let score = 0;
            const textEqualsCaption = candidate.text.toLowerCase() === caption.toLowerCase();
            const textStartsCaption = candidate.text.toLowerCase().startsWith(caption.toLowerCase());

            if (textEqualsCaption) {
              score += 20;
              reasons.push('exact-caption-text');
            } else if (textStartsCaption) {
              score += 10;
              reasons.push('caption-prefix');
            }

            if (candidate.isGrid) {
              score -= 50;
              reasons.push('background-grid-or-columnheader-penalty');
            } else {
              score += 12;
              reasons.push('not-grid');
            }

            const candidateCenterY = candidate.rect.y + candidate.rect.height / 2;
            const rowControls = controls
              .filter((control) => {
                const rect = rectOf(control);
                const controlCenterY = rect.y + rect.height / 2;
                return Math.abs(controlCenterY - candidateCenterY) <= 22 && rect.x >= candidate.rect.x - 20;
              })
              .sort((a, b) => rectOf(a).x - rectOf(b).x);
            const rowButtons = buttons
              .filter((button) => {
                const rect = rectOf(button);
                const buttonCenterY = rect.y + rect.height / 2;
                return Math.abs(buttonCenterY - candidateCenterY) <= 22 && rect.x >= candidate.rect.x - 20;
              })
              .sort((a, b) => rectOf(a).x - rectOf(b).x);

            if (rowControls.length > 0) {
              score += 35;
              reasons.push('nearby-editable-control');
            }

            if (rowButtons.length > 0) {
              score += 10;
              reasons.push('nearby-button');
            }

            if (candidate.rect.width > 0 && candidate.rect.height > 0) {
              score += 3;
              reasons.push('visible-rect');
            }

            return { score, reasons, rowControls, rowButtons };
          };

          const scored = rawCandidates
            .map((candidate) => {
              const scoring = scoreCandidate(candidate);
              return { ...candidate, score: scoring.score, scoreReasons: scoring.reasons, rowControls: scoring.rowControls, rowButtons: scoring.rowButtons };
            })
            .sort((a, b) => b.score - a.score || a.rect.y - b.rect.y || a.rect.x - b.rect.x);

          const selected = scored[0];
          const selectedControls = selected
            ? selected.rowControls
                .map((element) => ({
                  tagName: element.tagName.toUpperCase(),
                  role: normalize(element.getAttribute('role')) || null,
                  ariaLabel: normalize(element.getAttribute('aria-label')),
                  title: normalize(element.getAttribute('title')),
                  placeholder: normalize((element as HTMLInputElement).placeholder),
                  value: normalize((element as HTMLInputElement).value),
                  text: normalize(element.textContent),
                  disabled: 'disabled' in element ? Boolean((element as HTMLInputElement).disabled) : false,
                  readOnly: 'readOnly' in element ? Boolean((element as HTMLInputElement).readOnly) : false,
                  editable:
                    (element.getAttribute('contenteditable') === 'true' || element.tagName.toUpperCase() === 'SELECT' || 'value' in element) &&
                    !('disabled' in element && Boolean((element as HTMLInputElement).disabled)) &&
                    !('readOnly' in element && Boolean((element as HTMLInputElement).readOnly)),
                  checked:
                    element instanceof HTMLInputElement && element.type === 'checkbox'
                      ? element.checked
                      : null,
                  rect: rectOf(element),
                }))
                .slice(0, 4)
            : [];
          const selectedButtons = selected
            ? selected.rowButtons
                .map((element) => ({
                  tagName: element.tagName.toUpperCase(),
                  role: normalize(element.getAttribute('role')) || null,
                  ariaLabel: normalize(element.getAttribute('aria-label')),
                  title: normalize(element.getAttribute('title')),
                  text: normalize(element.textContent),
                  rect: rectOf(element),
                }))
                .slice(0, 4)
            : [];
          const rejectedBackgroundCandidates = scored
            .filter((candidate) => candidate.isGrid)
            .map((candidate) => ({
              text: candidate.text,
              tagName: candidate.tagName,
              role: candidate.role,
              rect: candidate.rect,
              reason: 'background-grid-or-columnheader',
            }))
            .slice(0, 4);

          const diagnosis: BcCardControlDiagnostic['diagnosis'] = !selected
            ? rejectedBackgroundCandidates.length > 0
              ? 'background-list-only'
              : 'caption-not-visible'
            : !selected.isGrid && selectedControls.length > 0
              ? 'active-card-label-with-control'
              : !selected.isGrid && selectedButtons.length > 0
                ? 'active-card-label-with-button'
                : rejectedBackgroundCandidates.length > 0 && selected.isGrid
                  ? 'background-list-only'
                  : 'label-only';

          return {
            caption,
            selectedLabel: selected
              ? {
                  text: selected.text,
                  tagName: selected.tagName,
                  role: selected.role,
                  ariaLabel: selected.ariaLabel,
                  title: selected.title,
                  rect: selected.rect,
                  score: selected.score,
                  scoreReasons: selected.scoreReasons,
                }
              : null,
            nearbyControls: selectedControls,
            nearbyButtons: selectedButtons,
            rejectedBackgroundCandidates,
            diagnosis,
          };
        });

        const summary = {
          captions: diagnostics.length,
          activeCardLabelWithControl: diagnostics.filter((entry) => entry.diagnosis === 'active-card-label-with-control').length,
          activeCardLabelWithButton: diagnostics.filter((entry) => entry.diagnosis === 'active-card-label-with-button').length,
          labelOnly: diagnostics.filter((entry) => entry.diagnosis === 'label-only').length,
          backgroundListOnly: diagnostics.filter((entry) => entry.diagnosis === 'background-list-only').length,
          captionNotVisible: diagnostics.filter((entry) => entry.diagnosis === 'caption-not-visible').length,
        };

        return {
          targetTextMatched,
          diagnostics,
          summary,
        };
      },
      { captionValues: captions, targetPattern: options.targetText?.source ?? '' },
    );

    scopedResults.push({
      scopeUrl: scopeUrl(scope),
      ...result,
    });
  }

  if (scopedResults.length === 0) {
    return {
      scopeUrl: page.url(),
      targetTextMatched: false,
      diagnostics: captions.map((caption) => ({
        caption,
        selectedLabel: null,
        nearbyControls: [],
        nearbyButtons: [],
        rejectedBackgroundCandidates: [],
        diagnosis: 'caption-not-visible',
      })),
      summary: {
        captions: captions.length,
        activeCardLabelWithControl: 0,
        activeCardLabelWithButton: 0,
        labelOnly: 0,
        backgroundListOnly: 0,
        captionNotVisible: captions.length,
      },
    };
  }

  return scopedResults.sort(
    (a, b) =>
      b.summary.activeCardLabelWithControl - a.summary.activeCardLabelWithControl ||
      b.summary.activeCardLabelWithButton - a.summary.activeCardLabelWithButton ||
      a.summary.backgroundListOnly - b.summary.backgroundListOnly,
  )[0];
}
