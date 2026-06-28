import { expect, test } from '@playwright/test';
import {
  createEmptyCustomerContext,
  findKnownIssueMatches,
  validateCustomerContext
} from '../../../core/customer-context';

test('Leerer Customer Context ist lokal nutzbar, aber erzeugt Warnungen', () => {
  const context = createEmptyCustomerContext('DEMO');
  const validation = validateCustomerContext(context);

  expect(validation.ok).toBe(true);
  expect(validation.warnings).toEqual(expect.arrayContaining([
    'Keine Kundenprozesse gepflegt. Triage nutzt nur allgemeines BC-Wissen.'
  ]));
});

test('Customer Context braucht anonymes Kundenkuerzel', () => {
  const context = createEmptyCustomerContext(' ');
  const validation = validateCustomerContext(context);

  expect(validation.ok).toBe(false);
  expect(validation.errors).toContain('Customer Context braucht ein anonymes Kundenkuerzel.');
});

test('Customer Context blockiert sensible Rohwerte', () => {
  const context = {
    ...createEmptyCustomerContext('DEMO'),
    integrations: [`Bearer ${'demo'}-token-value`]
  };
  const validation = validateCustomerContext(context);

  expect(validation.ok).toBe(false);
  expect(validation.errors.join('\n')).toMatch(/Secrets|Tokens|Auth-State/);
});

test('Known Issues werden anhand Signals gefunden', () => {
  const context = {
    ...createEmptyCustomerContext('DEMO'),
    knownIssues: [
      {
        id: 'KI-001',
        title: 'Location Code nicht sichtbar',
        signals: ['lagerortcode fehlt', 'location code fehlt'],
        classification: 'user-guidance' as const
      }
    ]
  };

  expect(findKnownIssueMatches(context, 'Der Lagerortcode fehlt auf der Verkaufszeile').map((issue) => issue.id)).toEqual([
    'KI-001'
  ]);
});
