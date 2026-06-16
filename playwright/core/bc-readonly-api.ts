export type BcReadOnlyRequest = {
  method: 'GET';
  url: string;
  purpose: string;
  expectedDataClass?: 'metadata' | 'business-record' | 'ledger-entry' | 'telemetry-reference';
};

export type BcReadOnlyResponse = {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
  redactedUrl: string;
};

const sensitiveQueryKeys = new Set(['access_token', 'client_secret', 'sig', 'code', 'token', 'refresh_token']);

export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (sensitiveQueryKeys.has(key.toLocaleLowerCase('de-DE'))) {
        parsed.searchParams.set(key, '***');
      }
    }
    return parsed.toString();
  } catch {
    return url.replace(/(access_token|client_secret|sig|code|token|refresh_token)=([^&\s]+)/gi, '$1=***');
  }
}

export function assertReadOnlyRequest(request: BcReadOnlyRequest): void {
  if ((request as { method?: string }).method !== 'GET') {
    throw new Error('Nur GET-Requests sind im read-only BC-Client erlaubt.');
  }

  if (!request.url?.trim()) {
    throw new Error('Read-only Request braucht eine URL.');
  }

  if (!request.purpose?.trim()) {
    throw new Error('Read-only Request braucht einen Zweck fuer Evidence und Review.');
  }
}

export async function runReadOnlyRequest(
  request: BcReadOnlyRequest,
  fetchImpl: typeof fetch = fetch
): Promise<BcReadOnlyResponse> {
  assertReadOnlyRequest(request);
  const redactedUrl = redactUrl(request.url);

  try {
    const response = await fetchImpl(request.url, { method: 'GET' });
    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : `Read-only GET fehlgeschlagen mit Status ${response.status} fuer ${redactedUrl}.`,
      redactedUrl
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: `Read-only GET fehlgeschlagen fuer ${redactedUrl}: ${
        error instanceof Error ? redactUrl(error.message) : 'unbekannter Fehler'
      }`,
      redactedUrl
    };
  }
}
