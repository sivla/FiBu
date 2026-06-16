import { expect, test } from '@playwright/test';
import {
  TelemetryScenario,
  buildTelemetryQuery,
  redactKqlValue
} from '../../../core/telemetry-query-builder';

const scenarios: TelemetryScenario[] = [
  'permission-error',
  'page-view-performance',
  'api-error',
  'job-queue-error',
  'extension-error',
  'session-timeline'
];

test('Jede Scenario Query wird erzeugt', () => {
  for (const scenario of scenarios) {
    const result = buildTelemetryQuery({ scenario });

    expect(result.query.trim().length, scenario).toBeGreaterThan(50);
    expect(result.requiredFields.length, scenario).toBeGreaterThan(0);
  }
});

test('Jede Query enthaelt eine Zeitbegrenzung', () => {
  for (const scenario of scenarios) {
    expect(buildTelemetryQuery({ scenario }).query).toMatch(/ago\(\d+h\)/);
  }
});

test('Query enthaelt keine unmaskierten Secrets', () => {
  const demoMail = `agent${'@'}example.invalid`;
  const bearerValue = `Bearer ${'abcdefgh'}123456`;
  const query = buildTelemetryQuery({
    scenario: 'api-error',
    userId: demoMail,
    correlationId: bearerValue
  }).query;

  expect(query).not.toContain(demoMail);
  expect(query).not.toContain(bearerValue);
  expect(query).toContain('***');
});

test('Permission Query erwaehnt Permission/Error-Kontext', () => {
  const result = buildTelemetryQuery({ scenario: 'permission-error' });

  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Permission/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Error|Fehler/i);
});

test('Page Performance Query erwaehnt Page/View/Duration-Kontext', () => {
  const result = buildTelemetryQuery({ scenario: 'page-view-performance' });

  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Page/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/View/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Duration|duration/i);
});

test('API Error Query erwaehnt Status/Error/API-Kontext', () => {
  const result = buildTelemetryQuery({ scenario: 'api-error' });

  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Status|status/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Error/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/API/i);
});

test('Job Queue Query erwaehnt Job/Queue/Error-Kontext', () => {
  const result = buildTelemetryQuery({ scenario: 'job-queue-error' });

  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Job/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Queue/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Error|Fehler/i);
});

test('Extension Query erwaehnt Extension/App-Kontext', () => {
  const result = buildTelemetryQuery({ scenario: 'extension-error' });

  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Extension/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/App|app/i);
});

test('Session Timeline Query erwaehnt Session/Operation-Kontext', () => {
  const result = buildTelemetryQuery({ scenario: 'session-timeline' });

  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Session/i);
  expect(`${result.query}\n${result.evidenceUse}`).toMatch(/Operation/i);
});

test('redactKqlValue maskiert Tokens, E-Mails und Secrets robust genug', () => {
  expect(redactKqlValue(`Bearer ${'abcdefgh'}123456`)).toBe('***');
  expect(redactKqlValue(`person${'@'}example.invalid`)).toBe('***');
  expect(redactKqlValue(`client_${'secret'}=abc`)).toBe('***');
  expect(redactKqlValue("O'Hara")).toBe("O''Hara");
});
