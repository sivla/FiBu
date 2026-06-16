import fs from 'node:fs';
import path from 'node:path';
import { validateEvidencePack } from '../playwright/core/evidence-validator';
import { scanMarkdownForPrivacyIssues } from '../playwright/core/privacy-scanner';
import { validateMarkdownSections } from '../playwright/core/template-validator';

const root = process.cwd();

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
};

const expectedScripts = [
  'check:debugging-book',
  'check:evidence',
  'check:safe-policy',
  'check:templates',
  'check:privacy',
  'bc:sample'
];

const ticketTemplateSections = [
  'Kurzfazit',
  'Was aus dem Ticket sicher erkennbar ist',
  'Screenshot-/Textanalyse',
  'Betroffener BC-Bereich',
  'Wahrscheinliche Fehlerklasse',
  'Hypothesenmatrix',
  'Sicherer Repro-Plan',
  'Welche Daten ich pruefen wuerde',
  'Welche Screenshots/Evidence ich erzeugen wuerde',
  'Welche Telemetry/MCP/API-Abfragen sinnvoll waeren',
  'Moegliche Ursache',
  'Sofort-Workaround',
  'Dauerhafte Loesung',
  'Regressionstest',
  'Buchwissen'
];

const evidenceTemplateSections = [
  'Pflichtstruktur',
  '00-ticket-summary.md',
  '02-hypotheses.md',
  '04-page-inspection.md',
  '06-telemetry.md',
  '08-root-cause.md'
];

function checkEvidencePacks(): { ok: boolean; messages: string[] } {
  const evidenceRoot = path.join(root, 'debugging-book', 'evidence');
  const messages: string[] = [];
  const packDirs = fs
    .readdirSync(evidenceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(evidenceRoot, entry.name));

  let ok = true;
  for (const packDir of packDirs) {
    const result = validateEvidencePack(packDir);
    if (!result.ok) {
      ok = false;
      messages.push(`${path.basename(packDir)}: Dateien ${result.missingFiles.join(', ') || '-'}; Abschnitte ${JSON.stringify(result.missingSections)}`);
    }
  }

  return { ok, messages };
}

function checkTemplates(): { ok: boolean; messages: string[] } {
  const templateChecks = [
    {
      file: path.join(root, 'debugging-book', 'TICKETANALYSE_TEMPLATE.md'),
      sections: ticketTemplateSections
    },
    {
      file: path.join(root, 'debugging-book', 'EVIDENCE_PACK_TEMPLATE.md'),
      sections: evidenceTemplateSections
    }
  ];

  const messages: string[] = [];
  for (const check of templateChecks) {
    const result = validateMarkdownSections(check.file, check.sections);
    if (!result.ok) {
      messages.push(`${path.basename(check.file)}: ${result.missingSections.join(', ')}`);
    }
  }

  return { ok: messages.length === 0, messages };
}

function checkPrivacy(): { ok: boolean; messages: string[] } {
  const scanRoots = [
    path.join(root, 'debugging-book'),
    path.join(root, 'playwright', 'core'),
    path.join(root, 'playwright', 'projects', 'bc-debugging', 'tests')
  ];
  const messages: string[] = [];
  let ok = true;

  for (const scanRoot of scanRoots) {
    const result = scanMarkdownForPrivacyIssues(scanRoot);
    const blockingFindings = result.findings.filter((finding) => finding.type !== 'warning');
    if (blockingFindings.length > 0) {
      ok = false;
      messages.push(`${path.relative(root, scanRoot)}: ${blockingFindings.length} Finding(s)`);
    }
  }

  return { ok, messages };
}

const evidence = checkEvidencePacks();
const templates = checkTemplates();
const privacy = checkPrivacy();
const missingScripts = expectedScripts.filter((script) => !packageJson.scripts?.[script]);

console.log('BC Debugging Book Check');
console.log(`- Evidence packs: ${evidence.ok ? 'OK' : 'Fehler'}`);
console.log(`- Templates: ${templates.ok ? 'OK' : 'Fehler'}`);
console.log(`- Privacy scan: ${privacy.ok ? 'OK' : 'Findings'}`);
console.log('- Safe policy: run npm run check:safe-policy');
console.log(`- Scripts: ${missingScripts.length === 0 ? 'OK' : `Fehlen ${missingScripts.join(', ')}`}`);

for (const message of [...evidence.messages, ...templates.messages, ...privacy.messages]) {
  console.error(message);
}

if (!evidence.ok || !templates.ok || !privacy.ok || missingScripts.length > 0) {
  process.exit(1);
}
