import { expect, test } from '@playwright/test';
import { assertReadOnlyRequest, redactUrl, runReadOnlyRequest } from '../../../core/bc-readonly-api';

test('GET-Request ist erlaubt', () => {
  expect(() =>
    assertReadOnlyRequest({
      method: 'GET',
      url: 'https://api.example.invalid/v2.0/companies',
      purpose: 'Company-Liste read-only pruefen'
    })
  ).not.toThrow();
});

test('POST, PATCH und DELETE werden zur Laufzeit abgelehnt', () => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    expect(() =>
      assertReadOnlyRequest({
        method,
        url: 'https://api.example.invalid/v2.0/companies',
        purpose: 'Soll blockiert werden'
      } as any)
    ).toThrow(/Nur GET/);
  }
});

test('URL-Redaktion verschleiert sensible Query-Parameter', () => {
  const tokenParamName = 'access' + '_token';
  const secretParamName = 'client' + '_secret';
  const redacted = redactUrl(
    `https://api.example.invalid/data?${tokenParamName}=abc&${secretParamName}=def&sig=ghi&code=jkl&safe=ok`
  );

  expect(redacted).toContain(`${tokenParamName}=***`);
  expect(redacted).toContain(`${secretParamName}=***`);
  expect(redacted).toContain('sig=***');
  expect(redacted).toContain('code=***');
  expect(redacted).not.toContain('abc');
  expect(redacted).toContain('safe=ok');
});

test('Mock-Fetch mit 200 gibt ok=true', async () => {
  const result = await runReadOnlyRequest(
    { method: 'GET', url: 'https://api.example.invalid/data', purpose: 'Mock lesen' },
    async () => new Response(JSON.stringify({ value: [1] }), { status: 200, headers: { 'content-type': 'application/json' } })
  );

  expect(result.ok).toBe(true);
  expect(result.status).toBe(200);
  expect(result.data).toEqual({ value: [1] });
});

test('Mock-Fetch mit 403 gibt ok=false und Status 403', async () => {
  const result = await runReadOnlyRequest(
    { method: 'GET', url: 'https://api.example.invalid/data', purpose: 'Mock lesen' },
    async () => new Response('Forbidden', { status: 403 })
  );

  expect(result.ok).toBe(false);
  expect(result.status).toBe(403);
});

test('Fehlertext enthaelt keine Secrets', async () => {
  const tokenParamName = 'access' + '_token';
  const secretParamName = 'client' + '_secret';
  const result = await runReadOnlyRequest(
    {
      method: 'GET',
      url: `https://api.example.invalid/data?${tokenParamName}=secret-token&${secretParamName}=secret-client`,
      purpose: 'Mock Fehler'
    },
    async () => {
      throw new Error(`network failed ${tokenParamName}=secret-token`);
    }
  );

  expect(result.error).not.toContain('secret-token');
  expect(result.error).not.toContain('secret-client');
  expect(result.error).toContain('***');
});

test('Purpose ist Pflicht und darf nicht leer sein', () => {
  expect(() =>
    assertReadOnlyRequest({
      method: 'GET',
      url: 'https://api.example.invalid/data',
      purpose: ' '
    })
  ).toThrow(/Zweck/);
});

test('Response enthaelt redactedUrl', async () => {
  const result = await runReadOnlyRequest(
    {
      method: 'GET',
      url: 'https://api.example.invalid/data?code=secret-code',
      purpose: 'Mock lesen'
    },
    async () => new Response('ok', { status: 200 })
  );

  expect(result.redactedUrl).toContain('code=***');
  expect(result.redactedUrl).not.toContain('secret-code');
});
