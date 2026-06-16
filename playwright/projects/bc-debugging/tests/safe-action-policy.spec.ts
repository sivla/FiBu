import { expect, test } from '@playwright/test';
import { ApprovalEvidence, decideSafeAction } from '../../../core/safe-actions';

const completeApproval: ApprovalEvidence = {
  environment: 'sandbox',
  company: 'CRONUS',
  action: 'Testbuchung in isolierter Sandbox',
  purpose: 'Reproduktion eines gemeldeten Posting-Fehlers',
  risk: 'posting',
  evidencePlan: 'Screenshots, Logauszug und anonymisierte Testdaten sichern',
  rollbackPlan: 'Testbeleg loeschen oder Sandbox zuruecksetzen'
};

test('Production erlaubt read-only Diagnose', () => {
  const decision = decideSafeAction({ environment: 'production', risk: 'read-only', hasExplicitApproval: false });

  expect(decision.allowed).toBe(true);
  expect(decision.mustStop).toBe(false);
});

test('Production erlaubt Page Inspection', () => {
  const decision = decideSafeAction({ environment: 'production', risk: 'page-inspection', hasExplicitApproval: false });

  expect(decision.allowed).toBe(true);
});

test('Production blockiert Posting', () => {
  const decision = decideSafeAction({ environment: 'production', risk: 'posting', hasExplicitApproval: true });

  expect(decision.allowed).toBe(false);
  expect(decision.mustStop).toBe(true);
});

test('Unbekanntes Environment blockiert mit Stop', () => {
  const decision = decideSafeAction({ environment: 'unknown', risk: 'read-only', hasExplicitApproval: false });

  expect(decision.allowed).toBe(false);
  expect(decision.mustStop).toBe(true);
});

test('Sandbox blockiert Posting ohne Freigabe', () => {
  const decision = decideSafeAction({ environment: 'sandbox', risk: 'posting', hasExplicitApproval: false });

  expect(decision.allowed).toBe(false);
  expect(decision.requiresExplicitApproval).toBe(true);
});

test('Sandbox blockiert Posting mit unvollstaendiger Freigabe und nennt fehlende Felder', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'posting',
    hasExplicitApproval: true,
    approvalEvidence: { environment: 'sandbox', company: 'CRONUS', action: 'Post test order' }
  });

  expect(decision.allowed).toBe(false);
  expect(decision.missingApprovalFields).toEqual(
    expect.arrayContaining(['purpose', 'risk', 'evidencePlan', 'rollbackPlan'])
  );
});

test('Sandbox erlaubt Posting mit vollstaendiger ausdruecklicher Freigabe', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'posting',
    hasExplicitApproval: true,
    approvalEvidence: completeApproval
  });

  expect(decision.allowed).toBe(true);
});

test('Sensibler Datenexport ohne Freigabe wird blockiert', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'data-export',
    hasExplicitApproval: false,
    containsSensitiveData: true
  });

  expect(decision.allowed).toBe(false);
  expect(decision.reason).toMatch(/Anonymisierungsplan/);
});

test('Kritischer Button Post blockiert oder fordert Freigabe', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'ui-navigation',
    hasExplicitApproval: false,
    actionLabel: 'Post'
  });

  expect(decision.allowed).toBe(false);
  expect(decision.requiresExplicitApproval).toBe(true);
});

test('Kritischer Button OK in riskanter Aktion blockiert oder fordert Freigabe', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'setup-change',
    hasExplicitApproval: false,
    actionLabel: 'OK'
  });

  expect(decision.allowed).toBe(false);
  expect(decision.mustStop).toBe(true);
});

test('Production erlaubt structured-data-read ohne sensible Daten', () => {
  const decision = decideSafeAction({
    environment: 'production',
    risk: 'structured-data-read',
    hasExplicitApproval: false,
    containsSensitiveData: false
  });

  expect(decision.allowed).toBe(true);
});

test('Permission-Change ohne Freigabe wird blockiert', () => {
  const decision = decideSafeAction({
    environment: 'sandbox',
    risk: 'permission-change',
    hasExplicitApproval: false
  });

  expect(decision.allowed).toBe(false);
  expect(decision.reason).toMatch(/Freigabe/);
});
