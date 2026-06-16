import { expect, test } from '@playwright/test';
import path from 'node:path';
import { validateMarkdownSections } from '../../../core/template-validator';

test('TICKETANALYSE_TEMPLATE enthaelt alle Governance-Abschnitte', () => {
  const result = validateMarkdownSections(path.resolve('debugging-book', 'TICKETANALYSE_TEMPLATE.md'), [
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
  ]);

  expect(result.ok, result.missingSections.join(', ')).toBe(true);
});

test('EVIDENCE_PACK_TEMPLATE enthaelt Pflichtstruktur und Kern-Evidence-Dateien', () => {
  const result = validateMarkdownSections(path.resolve('debugging-book', 'EVIDENCE_PACK_TEMPLATE.md'), [
    'Pflichtstruktur',
    '00-ticket-summary.md',
    '02-hypotheses.md',
    '04-page-inspection.md',
    '06-telemetry.md',
    '08-root-cause.md'
  ]);

  expect(result.ok, result.missingSections.join(', ')).toBe(true);
});
