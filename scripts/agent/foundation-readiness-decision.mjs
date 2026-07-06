import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const defaultResultPath =
  'playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json';
const defaultDecisionPath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md';
const templatePath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.template.md';
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const write = args.has('--write');
const check = args.has('--check') || !write;

function valueArg(name, fallback) {
  const prefix = `${name}=`;
  const match = rawArgs.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const resultPath = valueArg('--input', defaultResultPath);
const decisionPath = valueArg('--output', defaultDecisionPath);

function resolve(relativePath) {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.resolve(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(resolve(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(resolve(relativePath), 'utf8'));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function bullet(values, fallback = '- Keine Angabe.') {
  const list = asArray(values).filter(Boolean);
  return list.length ? list.map((value) => `- ${String(value)}`).join('\n') : fallback;
}

function validateTarget075(result) {
  const errors = [];
  const warnings = [];

  if (result.caseId !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push('TARGET-075-result.json has an unexpected caseId.');
  }
  if (result.instance !== 'playthru') errors.push('TARGET-075 result must use instance playthru.');
  if (result.company !== 'UNIVERSAARL-DE') errors.push('TARGET-075 result must use company UNIVERSAARL-DE.');
  if (result.nextCase !== 'FOUNDATION-READINESS-DECISION') {
    errors.push('TARGET-075 result must hand off to FOUNDATION-READINESS-DECISION.');
  }
  if (result.source !== 'playwright-readonly-foundation-consistency-pilot') {
    errors.push('TARGET-075 result must use source playwright-readonly-foundation-consistency-pilot.');
  }
  if (!result.page) errors.push('TARGET-075 result must include page.');
  if (!result.url) errors.push('TARGET-075 result must include url.');
  if (result.liveActionsExecuted !== true) {
    errors.push('TARGET-075 result must confirm liveActionsExecuted=true for the read-first Business Central pilot.');
  }
  if (result.businessCentralOpened !== true) {
    errors.push('TARGET-075 result must confirm businessCentralOpened=true.');
  }
  if (result.playwrightLiveRunExecuted !== true) {
    errors.push('TARGET-075 result must confirm playwrightLiveRunExecuted=true.');
  }

  const falseFlags = [
    'setupChanged',
    'setupChangeAttempted',
    'masterDataChanged',
    'draftCreated',
    'previewPosting',
    'posted',
    'payment',
    'apiShortcut'
  ];
  for (const flag of falseFlags) {
    if (result[flag] !== false) errors.push(`TARGET-075 read-first result must keep ${flag}=false.`);
  }
  if (!Array.isArray(result.actionsTaken) || result.actionsTaken.length === 0) {
    errors.push('TARGET-075 result must include actionsTaken.');
  }
  if (!Array.isArray(result.actionsNotTaken) || result.actionsNotTaken.length === 0) {
    errors.push('TARGET-075 result must include actionsNotTaken.');
  }
  const flags = result.flags ?? {};
  for (const flag of [
    'noWrite',
    'noPost',
    'noPreview',
    'noDraft',
    'noSetupChange',
    'noMasterDataChange',
    'noCompanySwitch',
    'noApiShortcut'
  ]) {
    if (flags[flag] !== true) errors.push(`TARGET-075 flags.${flag} must be true.`);
  }

  if (!Array.isArray(result.screenshots) || result.screenshots.length === 0) {
    errors.push('TARGET-075 result must include screenshot evidence.');
  }
  if (!Array.isArray(result.pages) || result.pages.length === 0) {
    errors.push('TARGET-075 result must include page-level evidence entries.');
  } else {
    for (const pageEntry of result.pages) {
      if (!pageEntry.id) errors.push('TARGET-075 page evidence entry is missing id.');
      if (!pageEntry.status) errors.push(`TARGET-075 page evidence ${pageEntry.id ?? 'unknown'} is missing status.`);
      if (!pageEntry.screenshot) errors.push(`TARGET-075 page evidence ${pageEntry.id ?? 'unknown'} is missing screenshot.`);
      if (!pageEntry.screenshotMetadata) {
        errors.push(`TARGET-075 page evidence ${pageEntry.id ?? 'unknown'} is missing screenshotMetadata.`);
      }
    }
  }
  if (result.resultStatus === 'observed' && (!Array.isArray(result.screenshots) || result.screenshots.length < 5)) {
    errors.push('TARGET-075 observed result must include screenshots for all five Foundation probes.');
  }
  const evidenceRefs = asArray(result.evidenceRefs);
  const changedFiles = asArray(result.changedFiles);
  if (!evidenceRefs.length) errors.push('TARGET-075 result must include evidenceRefs.');
  if (!changedFiles.length) errors.push('TARGET-075 result must include changedFiles.');
  for (const evidenceFile of evidenceRefs) {
    if (!changedFiles.includes(evidenceFile)) {
      errors.push(`TARGET-075 changedFiles is missing evidence file ${evidenceFile}.`);
    }
  }
  for (const pageEntry of asArray(result.pages)) {
    for (const evidenceFile of [pageEntry.textFile, pageEntry.screenshot, pageEntry.screenshotMetadata].filter(Boolean)) {
      if (!evidenceRefs.includes(evidenceFile)) errors.push(`TARGET-075 evidenceRefs is missing page evidence ${evidenceFile}.`);
      if (!changedFiles.includes(evidenceFile)) errors.push(`TARGET-075 changedFiles is missing page evidence ${evidenceFile}.`);
    }
  }

  if (!result.authGate) {
    errors.push('TARGET-075 result is missing authGate.');
  } else {
    if (result.authGate.checkedByGuard !== true) errors.push('authGate.checkedByGuard must be true.');
    if (result.authGate.secretsPrinted !== false) errors.push('authGate.secretsPrinted must be false.');
    if (result.authGate.targetUrlPassedToSpec !== true) errors.push('authGate.targetUrlPassedToSpec must be true.');
    if (result.authGate.targetUrlPrinted !== false) errors.push('authGate.targetUrlPrinted must be false.');
    if (!('doctorDecision' in result.authGate)) errors.push('authGate.doctorDecision is required.');
    if (!('doctorLiveGate' in result.authGate)) errors.push('authGate.doctorLiveGate is required.');
    const authTarget = result.authGate.authTarget;
    if (!authTarget || typeof authTarget !== 'object') {
      errors.push('authGate.authTarget is required.');
    } else {
      if (authTarget.targetEnvironment !== 'playthru') errors.push('authGate.authTarget.targetEnvironment must be playthru.');
      if (authTarget.targetCompany !== 'UNIVERSAARL-DE') errors.push('authGate.authTarget.targetCompany must be UNIVERSAARL-DE.');
      if (authTarget.targetMatchesState !== true) errors.push('authGate.authTarget.targetMatchesState must be true.');
      if (authTarget.sourceDiffersFromTarget === true && authTarget.targetBuiltFromCurrentState !== true) {
        errors.push('authGate.authTarget must prove targetBuiltFromCurrentState=true when sourceDiffersFromTarget=true.');
      }
    }
  }

  if (!result.executionGate) {
    errors.push('TARGET-075 result is missing executionGate.');
  } else {
    if (result.executionGate.runnerGuardChecked !== true) errors.push('executionGate.runnerGuardChecked must be true.');
    if (result.executionGate.liveApproved !== true) errors.push('executionGate.liveApproved must be true.');
    if (typeof result.executionGate.freezeActiveAtRunner !== 'boolean') {
      errors.push('executionGate.freezeActiveAtRunner must be boolean.');
    }
    if (typeof result.executionGate.freezeOverrideUsed !== 'boolean') {
      errors.push('executionGate.freezeOverrideUsed must be boolean.');
    }
  }

  const input = result.foundationReadinessInput;
  if (!input) {
    errors.push('TARGET-075 result is missing foundationReadinessInput.');
  } else {
    if (!input.decisionStatus) errors.push('foundationReadinessInput.decisionStatus is required.');
    if (!input.chartOfAccounts) errors.push('foundationReadinessInput.chartOfAccounts is required.');
    if (!input.setupContext) errors.push('foundationReadinessInput.setupContext is required.');
    if (!Array.isArray(input.nextProjectOutputs) || input.nextProjectOutputs.length === 0) {
      errors.push('foundationReadinessInput.nextProjectOutputs must be a non-empty array.');
    }
    if (!Array.isArray(input.uatTrainingImpact) || input.uatTrainingImpact.length === 0) {
      errors.push('foundationReadinessInput.uatTrainingImpact must be a non-empty array.');
    }
    const handoff = asArray(input.masterDataReadFirstHandoff);
    if (!handoff.length) {
      errors.push('foundationReadinessInput.masterDataReadFirstHandoff must be a non-empty array.');
    } else {
      const candidates = new Set(handoff.map((entry) => entry?.candidate));
      for (const candidate of ['PWS-MD-001', 'PWS-MD-002', 'PWS-MD-003']) {
        if (!candidates.has(candidate)) {
          errors.push(`foundationReadinessInput.masterDataReadFirstHandoff must include ${candidate}.`);
        }
      }
      for (const entry of handoff) {
        const candidate = entry?.candidate ?? 'unknown';
        if (!entry?.candidate) errors.push('foundationReadinessInput.masterDataReadFirstHandoff entry is missing candidate.');
        if (!entry?.decision) {
          errors.push(`foundationReadinessInput.masterDataReadFirstHandoff ${candidate} is missing decision.`);
        }
        if (!entry?.minimumBasis) {
          errors.push(`foundationReadinessInput.masterDataReadFirstHandoff ${candidate} is missing minimumBasis.`);
        }
        if (!Array.isArray(entry?.remainsForbidden) || entry.remainsForbidden.length === 0) {
          errors.push(`foundationReadinessInput.masterDataReadFirstHandoff ${candidate} must list remainsForbidden.`);
        }
        if (!Array.isArray(entry?.allowedClassifications) || entry.allowedClassifications.length === 0) {
          errors.push(`foundationReadinessInput.masterDataReadFirstHandoff ${candidate} must list allowedClassifications.`);
        }
      }
    }
    const foundationHandoff = asArray(input.foundationReadFirstHandoff);
    if (!foundationHandoff.length) {
      errors.push('foundationReadinessInput.foundationReadFirstHandoff must be a non-empty array.');
    } else {
      const candidates = new Set(foundationHandoff.map((entry) => entry?.candidate));
      for (const candidate of ['PWS-FF-001', 'PWS-FF-002', 'PWS-FF-003', 'PWS-FF-004', 'PWS-FF-005']) {
        if (!candidates.has(candidate)) {
          errors.push(`foundationReadinessInput.foundationReadFirstHandoff must include ${candidate}.`);
        }
      }
      for (const entry of foundationHandoff) {
        const candidate = entry?.candidate ?? 'unknown';
        if (!entry?.candidate) errors.push('foundationReadinessInput.foundationReadFirstHandoff entry is missing candidate.');
        if (!entry?.decision) errors.push(`foundationReadinessInput.foundationReadFirstHandoff ${candidate} is missing decision.`);
        if (!entry?.useWhen) errors.push(`foundationReadinessInput.foundationReadFirstHandoff ${candidate} is missing useWhen.`);
        if (!Array.isArray(entry?.remainsForbidden) || entry.remainsForbidden.length === 0) {
          errors.push(`foundationReadinessInput.foundationReadFirstHandoff ${candidate} must list remainsForbidden.`);
        }
      }
    }
  }

  return { errors, warnings };
}

function statusLine(value) {
  if (value === true) return 'ja';
  if (value === false) return 'nein';
  return String(value ?? 'unbekannt');
}

function tableCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '/')
    .trim();
}

function renderMasterDataHandoff(handoff, readyForMasterData) {
  const entries = asArray(handoff);
  if (!entries.length) {
    const decision = readyForMasterData ? 'ready-for-read-first-review' : 'blocked-or-needs-foundation-follow-up';
    return [
      '| Kandidat | Entscheidung | Mindestgrundlage | Bleibt verboten |',
      '| --- | --- | --- | --- |',
      `| \`PWS-MD-001\` Debitoren (Customers) | ${decision} | Company, Kontenplan, Debitoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind sichtbar oder als Luecke benannt. | Debitor speichern, Vorlage aendern, Verkaufsbeleg anlegen. |`,
      `| \`PWS-MD-002\` Kreditoren (Vendors) | ${decision} | Company, Kontenplan, Kreditoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind sichtbar oder als Luecke benannt; Bankdaten bleiben ausserhalb. | Kreditor speichern, Bankdaten erfassen, Einkaufsbeleg oder Zahlung anlegen. |`,
      `| \`PWS-MD-003\` Artikel/Services/Nichtlagerartikel | ${decision} | Company, Kontenplan, Produktbuchungsgruppen, USt-Produktkontext, Basiseinheiten und Inventory-/Costing-Grenzen sind sichtbar oder als Luecke benannt. | Artikel speichern, Basiseinheit anlegen, Lager-/Bewertungs-/Buchungssetup aendern, Lagerwert oder Wertposten behaupten. |`
    ].join('\n');
  }

  return [
    '| Kandidat | Entscheidung | Mindestgrundlage | Bleibt verboten |',
    '| --- | --- | --- | --- |',
    ...entries.map((entry) => {
      const decision = readyForMasterData ? entry.decision : 'blocked-or-needs-foundation-follow-up';
      const forbidden = asArray(entry.remainsForbidden).join(', ');
      return `| \`${tableCell(entry.candidate)}\` ${tableCell(entry.area)} | ${tableCell(decision)} | ${tableCell(
        entry.minimumBasis
      )} | ${tableCell(forbidden)} |`;
    })
  ].join('\n');
}

function renderFoundationFollowupHandoff(handoff, readyForMasterData) {
  const entries = asArray(handoff);
  const fallbackDecision = readyForMasterData ? 'optional-no-current-gap' : 'run-if-target075-gap-matches';
  const rows = entries.length
    ? entries
    : [
        {
          candidate: 'PWS-FF-002',
          area: 'Buchungsgruppen (Posting Groups)',
          decision: fallbackDecision,
          useWhen: 'TARGET-075 zeigt fehlende oder unklare Buchungsgruppen- oder Buchungsmatrix-Sichtbarkeit.',
          remainsForbidden: ['Buchungsgruppen speichern', 'Buchungsmatrix-Zeilen aendern', 'Preview Posting', 'Posting']
        },
        {
          candidate: 'PWS-FF-004',
          area: 'USt/MwSt.-Einrichtung (VAT setup boundary)',
          decision: fallbackDecision,
          useWhen: 'TARGET-075 zeigt USt-/VAT-Luecken, unklare Setup-Zeilen oder zu schwache Screenshot-QA.',
          remainsForbidden: ['USt-Gruppen speichern', 'VAT Posting Setup schreiben', 'Steuerfinalitaet behaupten', 'Preview Posting', 'Posting']
        },
        {
          candidate: 'PWS-FF-005',
          area: 'Dimensionen und Dimensionswerte',
          decision: fallbackDecision,
          useWhen: 'TARGET-075 zeigt unklare Dimensionen, Dimensionswerte, globale Dimensionen oder Reporting-Grenzen.',
          remainsForbidden: ['Dimension speichern', 'Dimensionswert speichern', 'Standarddimension aendern', 'Reporting- oder Postenclaim behaupten']
        },
        {
          candidate: 'PWS-FF-003',
          area: 'Zahlungsbedingungen (Payment Terms)',
          decision: fallbackDecision,
          useWhen: 'TARGET-075 oder Master-Data-Handoff zeigt unklare Zahlungsbedingungen fuer Debitoren/Kreditoren.',
          remainsForbidden: ['Zahlungsbedingung speichern', 'Zahlungsart/Bankdaten erfassen', 'Zahlung vorbereiten']
        },
        {
          candidate: 'PWS-FF-001',
          area: 'Nummernserien (Number Series)',
          decision: fallbackDecision,
          useWhen: 'TARGET-075 oder Master-Data-Handoff zeigt unklare Nummernlogik fuer Debitoren, Kreditoren oder Artikel.',
          remainsForbidden: ['Nummernserie speichern', 'Setup zuweisen', 'Stammdatensatz anlegen']
        }
      ];

  return [
    '| Kandidat | Entscheidung | Nutzen nach TARGET-075 | Bleibt verboten |',
    '| --- | --- | --- | --- |',
    ...rows.map((entry) => {
      const forbidden = asArray(entry.remainsForbidden).join(', ');
      return `| \`${tableCell(entry.candidate)}\` ${tableCell(entry.area)} | ${tableCell(entry.decision)} | ${tableCell(
        entry.useWhen
      )} | ${tableCell(forbidden)} |`;
    })
  ].join('\n');
}

function renderNextProjectOutputs(input, readyForMasterData) {
  const sourceOutputs = asArray(input.nextProjectOutputs).filter(
    (output) => !/^Update or create FOUNDATION-READINESS-DECISION\.md/i.test(String(output))
  );
  const decisionOutputs = readyForMasterData
    ? ['Einen engen Master-Data-Read-first-Pilot waehlen; Datensaetze erst mit spaeterem Smart Decision Gate schreiben.']
    : [
        'Den abgelehnten Nachweis zur Buchungsmatrix Einrichtung vor Master Data klaeren oder bewusst als Grenze akzeptieren.',
        'Starterkonten erneut sichtbar pruefen, wenn der Kontenplan Setup- oder Buchaussagen tragen soll.',
        'Master Data, USt-Schreiblaeufe, Buchungsgruppen-Schreiblaeufe, Buchungsvorschau und Buchung bleiben geparkt, bis die Foundation-Grenzen geklaert sind.'
      ];
  return bullet([...decisionOutputs, ...sourceOutputs]);
}

function renderDecision(result) {
  const input = result.foundationReadinessInput ?? {};
  const chart = input.chartOfAccounts ?? {};
  const setup = input.setupContext ?? {};
  const blockedBy = unique(asArray(result.blockedBy));
  const warnings = unique(asArray(result.warnings));
  const proven = unique(asArray(result.proved));
  const notProved = unique(asArray(result.notProved));
  const starterVisible = asArray(chart.starterAccountsVisible);
  const starterMissing = asArray(chart.starterAccountsMissingOrUnclear);
  const screenshots = asArray(result.screenshots);
  const pages = asArray(result.pages);
  const authTarget = result.authGate?.authTarget ?? {};
  const authGate = result.authGate ?? {};
  const foundationPageEvidenceObserved = pages.length >= 5 && pages.every((pageEntry) => pageEntry.status === 'observed');
  const foundationSetupPagesObserved = [
    setup.generalBusinessPostingGroups,
    setup.generalProductPostingGroups,
    setup.generalPostingSetup,
    setup.vatPostingSetup
  ].every((status) => status === 'observed');

  const readyForMasterData =
    result.resultStatus === 'observed' &&
    blockedBy.length === 0 &&
    starterMissing.length === 0 &&
    foundationSetupPagesObserved &&
    screenshots.length >= 5 &&
    foundationPageEvidenceObserved;

  const decision = readyForMasterData
    ? 'Master Data kann als naechster Block vorbereitet werden, aber nur mit eigenem Smart Decision Gate.'
    : 'Master Data bleibt geparkt, bis die offenen Foundation-Grenzen geprueft oder bewusst akzeptiert sind.';

  return [
    '# FOUNDATION-READINESS-DECISION',
    '',
    '> Automatisch aus TARGET-075 Evidence erzeugt. Diese Datei ist eine Projektentscheidung, kein Buchkapitel.',
    '',
    '## Kontext',
    '',
    `- Quelle: ${resultPath}`,
    `- Instanz: ${result.instance}`,
    `- Company: ${result.company}`,
    `- Result-Status: ${result.resultStatus}`,
    `- Erzeugt am: ${new Date().toISOString()}`,
    `- Auth-Ziel: ${authTarget.targetEnvironment ?? 'unbekannt'} / ${authTarget.targetCompany ?? 'unbekannt'}`,
    `- Auth-Ziel aus aktuellem State aufgebaut: ${statusLine(authTarget.targetBuiltFromCurrentState)}`,
    `- Auth-Ziel passt zum State: ${statusLine(authTarget.targetMatchesState)}`,
    `- Guard-Ziel-URL an TARGET-075 uebergeben: ${statusLine(authGate.targetUrlPassedToSpec)}`,
    `- Guard-Ziel-URL im Result ausgegeben: ${statusLine(authGate.targetUrlPrinted)}`,
    '',
    '## Entscheidung',
    '',
    decision,
    '',
    '## No-Write-Grenze aus TARGET-075',
    '',
    `- Setup geaendert: ${statusLine(result.setupChanged)}`,
    `- Stammdaten geaendert: ${statusLine(result.masterDataChanged)}`,
    `- Beleg/Draft erzeugt: ${statusLine(result.draftCreated)}`,
    `- Buchungsvorschau: ${statusLine(result.previewPosting)}`,
    `- Buchung: ${statusLine(result.posted)}`,
    `- Zahlung: ${statusLine(result.payment)}`,
    `- API Shortcut: ${statusLine(result.apiShortcut)}`,
    '',
    '## Bewiesen',
    '',
    bullet(proven),
    '',
    '## Nicht bewiesen',
    '',
    bullet(notProved),
    '',
    '## Kontenplan',
    '',
    `- Status: ${chart.status ?? 'unbekannt'}`,
    `- Sichtbare Starterkonten: ${starterVisible.length ? starterVisible.join(', ') : 'keine'}`,
    `- Fehlend oder unklar: ${starterMissing.length ? starterMissing.join(', ') : 'keine'}`,
    `- Buchgrenze: ${chart.bookBoundary ?? 'Keine Buchgrenze im Result angegeben.'}`,
    '',
    '## Setup-Kontext',
    '',
    `- Geschaeftsbuchungsgruppen: ${setup.generalBusinessPostingGroups ?? 'unbekannt'}`,
    `- Produktbuchungsgruppen: ${setup.generalProductPostingGroups ?? 'unbekannt'}`,
    `- Buchungsmatrix Einrichtung: ${setup.generalPostingSetup ?? 'unbekannt'}`,
    `- USt-Buchungsmatrix Einrichtung: ${setup.vatPostingSetup ?? 'unbekannt'}`,
    `- Grenze: ${setup.bookBoundary ?? 'Read-first Sichtbarkeit ersetzt keine Setup-Korrektheitspruefung.'}`,
    '',
    '## Foundation-Read-first-Folgeprobes',
    '',
    'Diese Tabelle verhindert den Sprung in Stammdaten, wenn TARGET-075 zuerst eine engere Foundation-Luecke zeigt. Sie gibt keine Schreibfreigabe.',
    '',
    renderFoundationFollowupHandoff(input.foundationReadFirstHandoff, readyForMasterData),
    '',
    '## Blocker und Warnungen',
    '',
    blockedBy.length || warnings.length
      ? [...blockedBy.map((item) => `- Blocker: ${item}`), ...warnings.map((item) => `- Warnung: ${item}`)].join('\n')
      : '- Keine Blocker oder Warnungen im TARGET-075 Result.',
    '',
    '## UAT und Training',
    '',
    bullet(input.uatTrainingImpact),
    '',
    '## Master-Data-Read-first-Handoff',
    '',
    'Diese Entscheidung gibt keine Schreibfreigabe. Sie waehlt hoechstens den naechsten lesenden Master-Data-Probe.',
    '',
    renderMasterDataHandoff(input.masterDataReadFirstHandoff, readyForMasterData),
    '',
    'Erlaubte Anschlussklassifikationen:',
    '',
    '- Debitoren: `ready-for-customer-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `blocked`.',
    '- Kreditoren: `ready-for-vendor-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `needs-payment-boundary-decision`, `blocked`.',
    '- Artikel/Services: `ready-for-item-write-gate`, `needs-uom-follow-up`, `needs-product-posting-follow-up`, `needs-inventory-setup-follow-up`, `needs-service-route-decision`, `blocked`.',
    '',
    '`ready-for-*-write-gate` bedeutet nur, dass ein spaeterer Smart-Decision-Case vorbereitet werden darf. Es erlaubt kein direktes Schreiben, Importieren, Buchen oder Posten.',
    '',
    '## Naechste Projektoutputs',
    '',
    renderNextProjectOutputs(input, readyForMasterData),
    '',
    '## Evidence',
    '',
    bullet(screenshots.map((screenshot) => `Screenshot: ${screenshot}`)),
    '',
    '## Naechster Case',
    '',
    readyForMasterData
      ? '- Einen engen Master-Data-Read-first-Pilot waehlen und vor jedem Write ein Smart Decision Gate dokumentieren.'
      : '- Foundation-Grenzen zuerst klaeren; keine Master-Data-, VAT-, Posting- oder Prozess-Writes starten.',
    ''
  ].join('\n');
}

if (!exists(resultPath)) {
  const output = {
    schemaVersion: 1,
    purpose: 'foundation-readiness-decision',
    mode: check ? 'check' : 'write',
    canWrite: false,
    resultMissing: true,
    liveActionsExecuted: false,
    businessCentralOpened: false,
    playwrightLiveRunExecuted: false,
    resultPath,
    decisionPath,
    templatePath,
    errors: write ? [`Missing required TARGET-075 result: ${resultPath}`] : [],
    warnings: [`${decisionPath} must not be created before TARGET-075 evidence exists.`],
    nextStep: 'Run TARGET-075 read-first after freeze/live-gate lift, then run this script with --write.'
  };
  console.log(JSON.stringify(output, null, 2));
  if (write) process.exitCode = 1;
  process.exit();
}

const result = readJson(resultPath);
const validation = validateTarget075(result);
const canWrite = validation.errors.length === 0;

if (write && canWrite) {
  fs.mkdirSync(path.dirname(resolve(decisionPath)), { recursive: true });
  fs.writeFileSync(resolve(decisionPath), renderDecision(result), 'utf8');
}

const output = {
  schemaVersion: 1,
  purpose: 'foundation-readiness-decision',
  mode: write ? 'write' : 'check',
  canWrite,
  wroteFile: write && canWrite,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  resultPath,
  decisionPath,
  templatePath,
  resultStatus: result.resultStatus,
  instance: result.instance,
  company: result.company,
  nextCase: result.nextCase,
  errors: validation.errors,
  warnings: validation.warnings,
  nextStep: canWrite
    ? write
      ? `${decisionPath} was updated from TARGET-075 evidence.`
      : `TARGET-075 evidence is valid for ${decisionPath}; run with --write after review.`
    : 'Fix TARGET-075 result shape before writing the Foundation Readiness Decision.'
};

console.log(JSON.stringify(output, null, 2));
if (validation.errors.length) process.exitCode = 1;
