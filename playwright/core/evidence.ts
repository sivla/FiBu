import fs from 'node:fs/promises';
import path from 'node:path';

export function evidencePath(projectName: string, testId: string, fileName: string) {
  return path.resolve('playwright/projects', projectName, 'evidence', testId, fileName);
}

export async function writeJsonEvidence(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

export async function writeTextEvidence(filePath: string, value: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, 'utf8');
}

type FinancialTarget = {
  id?: string;
  currencyCode: string;
  vatPercent: number;
  quantity: number;
  unitPrice: number;
  expectedVatAmount: number;
  expectedGrossAmount: number;
  dimensions?: Record<string, string>;
};

type FinancialActual = {
  currencyCode?: string;
  taxCode?: string;
  taxPercent?: number;
  netAmount?: number;
  vatAmount?: number;
  grossAmount?: number;
  dimensions?: Record<string, string>;
};

export function buildFinancialTargetVsLaborDelta(target: FinancialTarget, actual: FinancialActual) {
  const expected = {
    currencyCode: target.currencyCode,
    vatPercent: target.vatPercent,
    netAmount: target.unitPrice * target.quantity,
    vatAmount: target.expectedVatAmount,
    grossAmount: target.expectedGrossAmount,
    dimensions: target.dimensions ?? {}
  };
  const dimensionDifferences = Object.entries(expected.dimensions)
    .filter(([dimensionCode, expectedValue]) => actual.dimensions?.[dimensionCode] !== expectedValue)
    .map(
      ([dimensionCode, expectedValue]) =>
        `Dimension ${dimensionCode}: erwartet ${expectedValue}, Labor liefert ${
          actual.dimensions?.[dimensionCode] ?? 'nicht nachgewiesen'
        }`
    );
  const differences = [
    actual.currencyCode !== expected.currencyCode
      ? `Waehrung: erwartet ${expected.currencyCode}, Labor liefert ${actual.currencyCode ?? 'leer'}`
      : undefined,
    actual.taxPercent !== expected.vatPercent
      ? `Steuersatz: erwartet ${expected.vatPercent} %, Labor liefert ${actual.taxPercent ?? 'leer'} %`
      : undefined,
    actual.vatAmount !== expected.vatAmount
      ? `Steuerbetrag: erwartet ${expected.vatAmount}, Labor liefert ${actual.vatAmount ?? 'leer'}`
      : undefined,
    actual.grossAmount !== expected.grossAmount
      ? `Bruttobetrag: erwartet ${expected.grossAmount}, Labor liefert ${actual.grossAmount ?? 'leer'}`
      : undefined,
    ...dimensionDifferences
  ].filter((difference): difference is string => Boolean(difference));

  return {
    id: target.id ?? 'unknown-test',
    status: differences.length === 0 ? 'target-fit' : 'labor-delta',
    summary:
      differences.length === 0
        ? 'Der Laborlauf entspricht dem fachlichen Zielmodell.'
        : 'Der Klickpfad ist lauffaehig, aber das Labor entspricht noch nicht dem fachlichen Zielmodell.',
    expected,
    actual,
    differences,
    cause:
      differences.length === 0
        ? 'Kein abweichendes Setup erkannt.'
        : 'Die aktuelle Spielwiese nutzt ein anderes Buchungs-, Steuer- oder Waehrungssetup als das fachliche Zielmodell.',
    resolution:
      differences.length === 0
        ? 'Keine Setup-Korrektur erforderlich.'
        : 'Fuer finale Buchscreenshots Zielmandant oder explizites Ziel-Posting-/Steuer-Setup vorbereiten; dieser Lauf bleibt Labor-Evidence fuer Klickpfad und Datenbedarf.',
    bookImpact:
      differences.length === 0
        ? 'Der Buchfall kann als Zielbild verwendet werden.'
        : 'Buch muss Laborlauf und Ziel-Endstand trennen: Screenshots aus dem Labor beweisen Bedienpfad, aber nicht automatisch Steuer/Waehrung des Zielmodells.'
  };
}

export function renderFinancialTargetVsLaborDeltaMarkdown(
  delta: ReturnType<typeof buildFinancialTargetVsLaborDelta>,
  title = `${delta.id} Zielmodell vs. Labor`
) {
  const dimensionRows = Object.entries(delta.expected.dimensions).map(
    ([dimensionCode, expectedValue]) =>
      `| Dimension ${dimensionCode} | ${expectedValue} | ${delta.actual.dimensions?.[dimensionCode] ?? ''} |`
  );
  const actualOnlyDimensionRows = Object.entries(delta.actual.dimensions ?? {})
    .filter(([dimensionCode]) => !(dimensionCode in delta.expected.dimensions))
    .map(([dimensionCode, actualValue]) => `| Dimension ${dimensionCode} | nicht im Zielvergleich | ${actualValue} |`);

  return [
    `# ${title}`,
    '',
    delta.summary,
    '',
    '| Pruefpunkt | Ziel laut Buch | Ist im Labor |',
    '|---|---:|---:|',
    `| Waehrung | ${delta.expected.currencyCode} | ${delta.actual.currencyCode ?? ''} |`,
    `| Steuersatz | ${delta.expected.vatPercent} % | ${delta.actual.taxPercent ?? ''} % |`,
    `| Nettobetrag | ${delta.expected.netAmount} | ${delta.actual.netAmount ?? ''} |`,
    `| Steuerbetrag | ${delta.expected.vatAmount} | ${delta.actual.vatAmount ?? ''} |`,
    `| Bruttobetrag | ${delta.expected.grossAmount} | ${delta.actual.grossAmount ?? ''} |`,
    ...dimensionRows,
    ...actualOnlyDimensionRows,
    '',
    '## Abweichungen',
    '',
    ...(delta.differences.length > 0 ? delta.differences.map((difference) => `- ${difference}`) : ['- keine']),
    '',
    '## Ursache',
    '',
    delta.cause,
    '',
    '## Loesung',
    '',
    delta.resolution,
    '',
    '## Buchwirkung',
    '',
    delta.bookImpact,
    ''
  ].join('\n');
}
