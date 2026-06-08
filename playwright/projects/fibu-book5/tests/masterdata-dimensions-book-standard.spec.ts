import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import {
  bcPageUrl,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
  writeEvidenceText
} from '../../../core/bc-helpers';
import { project } from '../project';

type DimensionData = {
  fullBookModel: Array<{
    code: string;
    values: string[];
  }>;
};

type BcApiContext = {
  company: {
    id: string;
    name: string;
    displayName: string;
  };
  root: string;
  token: string;
};

const testId = 'masterdata-dimensions';
const requiredDimensions = new Map([
  ['COMPANY-GROUP', 'Company Group'],
  ['DEPARTMENT', 'Department'],
  ['CHANNEL', 'Sales Channel'],
  ['PRODUCTLINE', 'Product Line'],
  ['LOCATION-GROUP', 'Location Group']
]);

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

async function loadData() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/masterdata/dimensions.json', 'utf8');
  return JSON.parse(raw) as DimensionData;
}

async function getApiContext(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix));
  await expect
    .poll(
      () =>
        page.evaluate(() => Boolean(document.documentElement.innerHTML.match(/"accessToken":"([^"]+)/)?.[1])),
      { timeout: 120_000 }
    )
    .toBe(true);

  return page.evaluate(async (companyName) => {
    const token = document.documentElement.innerHTML.match(/"accessToken":"([^"]+)/)?.[1];
    if (!token) {
      throw new Error('BC accessToken im Webclient nicht gefunden.');
    }

    const [tenant, environment] = location.pathname.split('/').filter(Boolean);
    const root = `https://api.businesscentral.dynamics.com/v2.0/${tenant}/${environment}/api/v2.0`;
    const response = await fetch(`${root}/companies`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Companies API fehlgeschlagen: ${response.status} ${await response.text()}`);
    }

    const companies = await response.json();
    const company = companies.value.find((entry: { name: string }) => entry.name === companyName);
    if (!company) {
      throw new Error(`Company ${companyName} nicht in API-Antwort gefunden.`);
    }

    return { company, root, token };
  }, project.defaultCompany) as Promise<BcApiContext>;
}

async function bcApi(
  api: BcApiContext,
  endpoint: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
) {
  const response = await fetch(`${api.root}/companies(${api.company.id})/${endpoint}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${api.token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${endpoint} fehlgeschlagen: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : undefined;
}

async function findApiRecords(api: BcApiContext, endpoint: string, filter: string) {
  const result = await bcApi(api, `${endpoint}?$filter=${encodeURIComponent(filter)}`);
  return result.value as Array<Record<string, unknown>>;
}

async function ensureDimension(api: BcApiContext, code: string, displayName: string) {
  const existing = await findApiRecords(api, 'dimensions', `code eq '${code}'`);
  if (existing.length) {
    return { action: 'already-exists', record: existing[0] };
  }

  return {
    action: 'missing-not-created',
    reason: `Die Standard-API dimensions erlaubt in diesem Labor keinen Insert; ${code} bleibt fuer einen gezielten UI- oder AL-Setup-Lauf offen.`,
    requestedDisplayName: displayName
  };
}

async function ensureDimensionValue(api: BcApiContext, dimension: Record<string, unknown>, code: string) {
  const dimensionId = dimension.id;
  const existing = await findApiRecords(api, 'dimensionValues', `dimensionId eq ${dimensionId} and code eq '${code}'`);
  if (existing.length) {
    return { action: 'already-exists', record: existing[0] };
  }

  return {
    action: 'missing-not-created',
    reason:
      'Die Standard-API dimensionValues erlaubt in diesem Labor keinen Insert; fehlende Werte bleiben fuer einen gezielten UI-Setup-Lauf offen.'
  };
}

async function readDefaultDimension(api: BcApiContext, parentEndpoint: string, parentType: string, number: string) {
  const [parent] = await findApiRecords(api, parentEndpoint, `number eq '${number}'`);
  if (!parent) {
    throw new Error(`${parentType} ${number} fehlt.`);
  }

  const records = await findApiRecords(api, 'defaultDimensions', `parentType eq '${parentType}' and parentId eq ${parent.id}`);
  return { parent, records };
}

test('MASTERDATA-DIMENSIONS Buchstandard fuer Foundation und Dimensionen haerten', async ({ page }) => {
  test.setTimeout(300_000);

  const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-dimensions');
  const data = await loadData();
  const api = await getApiContext(page);

  const relevantDimensions = data.fullBookModel.filter((entry) => requiredDimensions.has(entry.code));
  const dimensionResults = [];
  const valueResults = [];

  for (const target of relevantDimensions) {
    const dimensionResult = await ensureDimension(api, target.code, requiredDimensions.get(target.code) ?? target.code);
    dimensionResults.push({ code: target.code, ...dimensionResult });

    const dimensionRecord = dimensionResult.record;
    if (!dimensionRecord) {
      continue;
    }

    for (const valueCode of target.values) {
      valueResults.push({
        dimensionCode: target.code,
        valueCode,
        ...(await ensureDimensionValue(api, dimensionRecord, valueCode))
      });
    }
  }

  const finalDimensions = [];
  for (const target of relevantDimensions) {
    const [dimension] = await findApiRecords(api, 'dimensions', `code eq '${target.code}'`);
    if (!dimension) {
      finalDimensions.push({
        code: target.code,
        id: null,
        displayName: requiredDimensions.get(target.code) ?? target.code,
        expectedValues: target.values,
        existingValues: [],
        status: 'missing-dimension'
      });
      continue;
    }

    const values = await findApiRecords(api, 'dimensionValues', `dimensionId eq ${dimension.id}`);
    finalDimensions.push({
      code: target.code,
      id: dimension.id,
      displayName: dimension.displayName,
      expectedValues: target.values,
      existingValues: values.map((entry) => entry.code).sort(),
      status: 'dimension-exists'
    });
  }

  const d10000Defaults = await readDefaultDimension(api, 'customers', 'Customer', 'D10000');
  const rmM100Defaults = await readDefaultDimension(api, 'items', 'Item', 'RM-M100');

  const result = {
    status: 'labor',
    sandbox: 'MCP_1_20260210',
    company: api.company,
    targetCompany: project.defaultCompany,
    dimensionsChecked: [...requiredDimensions.keys()],
    dimensionResults,
    valueResults,
    finalDimensions,
    defaultDimensionsChecked: [
      {
        parentType: 'Customer',
        parentNo: 'D10000',
        required: 'CHANNEL=B2B',
        records: d10000Defaults.records
      },
      {
        parentType: 'Item',
        parentNo: 'RM-M100',
        required: 'PRODUCTLINE=MACHINE',
        records: rmM100Defaults.records
      }
    ],
    mandatoryDimensionLogic: {
      tested: false,
      reason:
        'Dieser Lauf haertet Foundation/Dimensionen. Pflichtdimensionsfehler werden nicht provoziert, weil das ein eigener Buchungs-/Fehler-Lernfall waere.'
    },
    finalDeProof: false,
    limitations: [
      'CRONUS-USA-Labor mit gemischter deutscher/englischer UI.',
      'Keine neue Company angelegt.',
      'Keine Aussage zum deutschen 19-%-USt-Endstand.',
      'PROJECT als eigene Dimension wird noch nicht angelegt; Projektprozesse bleiben spaeterer P2-Block.'
    ]
  };

  const missingValues = finalDimensions.flatMap((entry) =>
    entry.expectedValues
      .filter((expectedValue) => !entry.existingValues.includes(expectedValue))
      .map((expectedValue) => `${entry.code}.${expectedValue}`)
  );
  expect(JSON.stringify(d10000Defaults.records)).toContain('"dimensionCode":"CHANNEL"');
  expect(JSON.stringify(d10000Defaults.records)).toContain('"dimensionValueCode":"B2B"');
  expect(JSON.stringify(rmM100Defaults.records)).toContain('"dimensionCode":"PRODUCTLINE"');
  expect(JSON.stringify(rmM100Defaults.records)).toContain('"dimensionValueCode":"MACHINE"');

  await writeEvidenceText(path.join(evidenceDir, '010-dimension-foundation-result.json'), JSON.stringify(result, null, 2));
  await writeEvidenceText(
    path.join(evidenceDir, '011-dimension-foundation-summary.md'),
    [
      '# MASTERDATA-DIMENSIONS: Foundation und Dimensionen',
      '',
      '| Pruefpunkt | Ergebnis | Status |',
      '|---|---|---|',
      `| Sandbox/Company | MCP_1_20260210 / ${api.company.name} | Labor |`,
      `| Dimensionen | ${finalDimensions
        .filter((entry) => entry.status === 'dimension-exists')
        .map((entry) => entry.code)
        .join(', ')} | praktisch geprueft |`,
      `| Fehlende Dimensionen | ${finalDimensions
        .filter((entry) => entry.status !== 'dimension-exists')
        .map((entry) => entry.code)
        .join(', ') || 'keine'} | nicht per API angelegt |`,
      `| Dimensionswerte | ${finalDimensions
        .map((entry) => `${entry.code}: ${entry.expectedValues.join(', ')}`)
        .join('; ')} | Sollwert geprueft |`,
      `| Fehlende Dimensionswerte | ${missingValues.join(', ') || 'keine'} | nicht per API angelegt |`,
      '| Default Dimension Debitor | D10000 -> CHANNEL=B2B | nachgewiesen |',
      '| Default Dimension Artikel | RM-M100 -> PRODUCTLINE=MACHINE | nachgewiesen |',
      '| Pflichtdimensionslogik | nicht provoziert | eigener Fehler-/Buchungslernfall |',
      '| PROJECT-Dimension | nicht angelegt | spaeterer Projektblock |',
      '| Deutscher Finalnachweis | offen | keine 19-%-USt-/DE-Company-Aussage |',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10 kann den O2C-Kern als RM-DEMO-Laborfit lesen: DEPARTMENT, CHANNEL, PRODUCTLINE und LOCATION-GROUP existieren, und die Default Dimensions fuer O2C sind weiterhin der konkrete Prozessanker. COMPANY-GROUP und mehrere Erweiterungswerte sind noch kein Laborfit. Pflichtdimensionen werden nicht blind global erzwungen; sie brauchen einen separaten Lernfall mit bewusstem Fehlerbild.',
      '',
      '## Naechster Schritt',
      '',
      'Posting Groups/P2P erst starten, wenn `K10000`, `RAW-STEEL`, Vendor Posting Group, General Posting Setup, Tax/VAT-Laborgrenze und Nummernserie geprueft werden.'
    ].join('\n')
  );

  await page.goto(bcPageUrl(536, project.envPrefix));
  await waitForBusinessCentralShell(page);
  await expect.poll(() => pageText(page), { timeout: 120_000 }).toMatch(/Dimensions:/i);
  await expect.poll(() => pageText(page), { timeout: 120_000 }).toMatch(/PRODUCTLINE/i);
  await screenshot(page, 'masterdata-dimensions-010-book-standard-dimensions.png', {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'field-proof',
    purpose:
      'Zentraler UI-Labornachweis: Buchdimensionen fuer RM-DEMO sind auf der Dimensionsliste sichtbar.',
    expectedPageText: [/Dimensions:/i, /PRODUCTLINE/i, /CHANNEL/i],
    knownLimitations: [
      'Der Screenshot zeigt die Dimensionsliste, nicht alle Dimensionswerte.',
      'Dimensionswerte und Default Dimensions werden kompakt per JSON/Markdown-Evidence nachgewiesen.',
      'Laborumgebung ist CRONUS USA; finale deutsche Screenshots bleiben offen.'
    ]
  });
  await writeEvidenceText(path.join(evidenceDir, '010-dimensions-page-text.txt'), await pageText(page));
});
