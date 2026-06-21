export type JournalGridText =
  | string
  | {
      text?: string;
      label?: string;
      rowText?: string;
      cellText?: string;
      value?: string;
      selectedText?: string;
      ariaLabel?: string;
      title?: string;
      rect?: JournalGridRect;
    };

export type JournalGridRect = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type JournalGridControl = {
  index?: number;
  tag?: string;
  label?: string;
  ariaLabel?: string;
  title?: string;
  value?: string;
  selectedText?: string;
  rowText?: string;
  cellText?: string;
  readOnly?: boolean;
  disabled?: boolean;
  rect?: JournalGridRect;
};

export type JournalGridSnapshot = {
  headers?: JournalGridText[];
  rows?: JournalGridText[];
  controls?: JournalGridControl[];
};

export type JournalCellCandidateTarget = {
  rowRequiredSignals: string[];
  columnSignals: string[];
  forbiddenSignals?: string[];
  expectedValue?: string;
};

export type JournalCellCandidate = {
  index?: number;
  score: number;
  reason: string[];
  labelText: string;
  rowText: string;
  cellText: string;
  valueText: string;
  readOnly: boolean;
  disabled: boolean;
};

export type JournalCellCandidateAnalysis = {
  success: boolean;
  status:
    | 'single-editable-candidate'
    | 'already-visible'
    | 'blocked-forbidden-signal-visible'
    | 'blocked-missing-row-anchor'
    | 'blocked-missing-column-signal'
    | 'blocked-no-editable-candidate'
    | 'blocked-multiple-editable-candidates';
  blockedBy: string[];
  visibleSignals: {
    rowAnchorCount: number;
    columnSignalVisible: boolean;
    forbiddenSignalsVisible: string[];
    expectedValueVisible: boolean;
    controlCandidateCount: number;
    editableCandidateCount: number;
  };
  candidates: JournalCellCandidate[];
  editableCandidates: JournalCellCandidate[];
};

export function normalizeJournalGridText(value: string | undefined | null) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function textFrom(value: JournalGridText) {
  if (typeof value === 'string') return normalizeJournalGridText(value);
  return normalizeJournalGridText(
    [value.text, value.label, value.rowText, value.cellText, value.value, value.selectedText, value.ariaLabel, value.title].join(' '),
  );
}

function lower(value: string) {
  return normalizeJournalGridText(value).toLowerCase();
}

function includesSignal(text: string, signal: string) {
  return lower(text).includes(lower(signal));
}

function includesAnySignal(text: string, signals: string[]) {
  return signals.some((signal) => includesSignal(text, signal));
}

function includesAllSignals(text: string, signals: string[]) {
  return signals.every((signal) => includesSignal(text, signal));
}

function controlLabelText(control: JournalGridControl) {
  return normalizeJournalGridText([control.label, control.ariaLabel, control.title, control.cellText].join(' '));
}

function controlValueText(control: JournalGridControl) {
  return normalizeJournalGridText([control.value, control.selectedText].join(' '));
}

function rectMidX(rect: JournalGridRect | undefined) {
  if (typeof rect?.x !== 'number') return undefined;
  const width = typeof rect.width === 'number' ? rect.width : 0;
  return rect.x + width / 2;
}

function rectMidY(rect: JournalGridRect | undefined) {
  if (typeof rect?.y !== 'number') return undefined;
  const height = typeof rect.height === 'number' ? rect.height : 0;
  return rect.y + height / 2;
}

function rectContainsX(rect: JournalGridRect | undefined, x: number | undefined) {
  if (typeof rect?.x !== 'number' || typeof x !== 'number') return false;
  const width = typeof rect.width === 'number' ? rect.width : 0;
  return x >= rect.x - 2 && x <= rect.x + width + 2;
}

function objectsWithTextAndRect(values: JournalGridText[]) {
  return values.filter((value): value is Exclude<JournalGridText, string> & { rect: JournalGridRect } => {
    return typeof value !== 'string' && Boolean(value.rect) && typeof value.rect?.x === 'number';
  });
}

function headerText(value: Exclude<JournalGridText, string>) {
  return normalizeJournalGridText([value.text, value.label, value.ariaLabel, value.title].join(' '));
}

export function analyzeJournalCellCandidates(
  snapshot: JournalGridSnapshot,
  target: JournalCellCandidateTarget,
): JournalCellCandidateAnalysis {
  const headers = (snapshot.headers ?? []).map(textFrom).filter(Boolean);
  const rows = (snapshot.rows ?? []).map(textFrom).filter(Boolean);
  const controls = snapshot.controls ?? [];
  const headerObjects = objectsWithTextAndRect(snapshot.headers ?? []);
  const targetHeaderObjects = headerObjects.filter((header) => includesAnySignal(headerText(header), target.columnSignals));
  const rowAnchorControls = controls.filter((control) => {
    const y = rectMidY(control.rect);
    if (typeof y !== 'number') return false;
    const sameRowControls = controls.filter((other) => {
      const otherY = rectMidY(other.rect);
      return typeof otherY === 'number' && Math.abs(otherY - y) <= 4;
    });
    const sameRowText = normalizeJournalGridText(
      sameRowControls.map((other) => [controlLabelText(other), other.rowText, other.cellText, controlValueText(other)].join(' ')).join(' '),
    );
    return includesAllSignals(sameRowText, target.rowRequiredSignals);
  });
  const combined = normalizeJournalGridText(
    [
      headers.join(' '),
      rows.join(' '),
      controls
        .map((control) => [controlLabelText(control), control.rowText, control.cellText, controlValueText(control)].join(' '))
        .join(' '),
    ].join(' '),
  );

  const rowAnchors = rows.filter((row) => includesAllSignals(row, target.rowRequiredSignals));
  const geometryRowAnchorCount = new Set(
    rowAnchorControls.map((control) => {
      const y = rectMidY(control.rect);
      return typeof y === 'number' ? Math.round(y) : undefined;
    }),
  ).size;
  const columnSignalVisible =
    headers.some((header) => includesAnySignal(header, target.columnSignals)) ||
    controls.some((control) => includesAnySignal(controlLabelText(control), target.columnSignals));
  const forbiddenSignalsVisible = (target.forbiddenSignals ?? []).filter((signal) => includesSignal(combined, signal));
  const candidates = controls
    .map<JournalCellCandidate>((control) => {
      const labelText = controlLabelText(control);
      const rowText = normalizeJournalGridText(control.rowText);
      const cellText = normalizeJournalGridText(control.cellText);
      const valueText = controlValueText(control);
      const reason: string[] = [];
      let score = 0;
      if (includesAnySignal(labelText, target.columnSignals)) {
        score += 4;
        reason.push('column-signal-in-label');
      }
      if (includesAnySignal(cellText, target.columnSignals)) {
        score += 2;
        reason.push('column-signal-in-cell');
      }
      if (includesAllSignals(rowText, target.rowRequiredSignals)) {
        score += 5;
        reason.push('row-required-signals');
      }
      const controlX = rectMidX(control.rect);
      const geometryHeader = targetHeaderObjects.find((header) => rectContainsX(header.rect, controlX));
      if (geometryHeader) {
        score += 4;
        reason.push('column-signal-by-geometry');
      }
      if (rowAnchorControls.includes(control)) {
        score += 5;
        reason.push('row-required-signals-by-geometry');
      }
      if (target.expectedValue && includesSignal(valueText, target.expectedValue)) {
        score += 2;
        reason.push('expected-value-currently-visible');
      }
      return {
        index: control.index,
        score,
        reason,
        labelText,
        rowText,
        cellText,
        valueText,
        readOnly: Boolean(control.readOnly),
        disabled: Boolean(control.disabled),
      };
    })
    .filter((candidate) => candidate.score >= 9);

  const editableCandidates = candidates.filter((candidate) => !candidate.readOnly && !candidate.disabled);
  const expectedValueCandidates = target.expectedValue
    ? candidates.filter(
        (candidate) =>
          includesSignal(candidate.valueText, target.expectedValue ?? '') ||
          includesSignal(candidate.cellText, target.expectedValue ?? ''),
      )
    : [];
  const expectedValueVisible = expectedValueCandidates.length > 0;
  const blockedBy: string[] = [];
  if (forbiddenSignalsVisible.length > 0) blockedBy.push(`forbidden-signals-visible:${forbiddenSignalsVisible.join(',')}`);
  if (rowAnchors.length === 0 && geometryRowAnchorCount === 0) blockedBy.push('missing-row-anchor');
  if (!columnSignalVisible) blockedBy.push('missing-column-signal');
  if (candidates.length === 0) blockedBy.push('no-control-candidate');
  if (!expectedValueVisible && editableCandidates.length === 0) blockedBy.push('no-editable-control-candidate');
  if (editableCandidates.length > 1) blockedBy.push(`multiple-editable-control-candidates:${editableCandidates.length}`);

  let status: JournalCellCandidateAnalysis['status'] = 'blocked-no-editable-candidate';
  if (forbiddenSignalsVisible.length > 0) {
    status = 'blocked-forbidden-signal-visible';
  } else if (target.expectedValue && expectedValueVisible) {
    status = 'already-visible';
  } else if (rowAnchors.length === 0 && geometryRowAnchorCount === 0) {
    status = 'blocked-missing-row-anchor';
  } else if (!columnSignalVisible) {
    status = 'blocked-missing-column-signal';
  } else if (editableCandidates.length === 1) {
    status = 'single-editable-candidate';
  } else if (editableCandidates.length > 1) {
    status = 'blocked-multiple-editable-candidates';
  }

  return {
    success: status === 'single-editable-candidate' || status === 'already-visible',
    status,
    blockedBy,
    visibleSignals: {
      rowAnchorCount: rowAnchors.length + geometryRowAnchorCount,
      columnSignalVisible,
      forbiddenSignalsVisible,
      expectedValueVisible,
      controlCandidateCount: candidates.length,
      editableCandidateCount: editableCandidates.length,
    },
    candidates,
    editableCandidates,
  };
}
