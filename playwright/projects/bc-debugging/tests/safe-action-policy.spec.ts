import { expect, test } from '@playwright/test';
import { decideSafeAction } from '../../../core/safe-actions';

test('Production blockiert schreibende Aktionen auch bei allgemeiner Versuchung', () => {
  const decision = decideSafeAction({
    environment: 'production',
    risk: 'posting',
    hasExplicitApproval: false
  });

  expect(decision.allowed).toBe(false);
  expect(decision.requiresExplicitApproval).toBe(true);
});

test('Sandbox erlaubt read-only Diagnose ohne Freigabe', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'read-only',
    hasExplicitApproval: false
  });

  expect(decision.allowed).toBe(true);
});

test('Sandbox blockiert Zahlung ohne ausdrueckliche Freigabe', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'payment',
    hasExplicitApproval: false
  });

  expect(decision.allowed).toBe(false);
  expect(decision.reason).toMatch(/Freigabe/);
});
