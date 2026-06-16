export type BcRuntimeConfig = {
  hasUiConfig: boolean;
  hasApiConfig: boolean;
  url?: string;
  environment?: string;
  company?: string;
  username?: string;
  authStatePath?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  apiBaseUrl?: string;
  allowWrite: false;
  allowProductionWrite: false;
};

type RuntimeEnv = Record<string, string | undefined>;

function value(env: RuntimeEnv, key: string): string | undefined {
  const raw = env[key]?.trim();
  return raw ? raw : undefined;
}

function isTrueLike(raw?: string): boolean {
  return /^(1|true|yes|ja)$/i.test(raw?.trim() ?? '');
}

export function maskSensitiveValue(valueToMask?: string): string {
  if (!valueToMask) {
    return '';
  }

  if (valueToMask.length <= 8) {
    return '***';
  }

  return `${valueToMask.slice(0, 3)}***${valueToMask.slice(-3)}`;
}

export function loadBcRuntimeConfig(env: RuntimeEnv = process.env): BcRuntimeConfig {
  const url = value(env, 'BC_URL');
  const apiBaseUrl = value(env, 'BC_API_BASE_URL');

  return {
    hasUiConfig: Boolean(url),
    hasApiConfig: Boolean(apiBaseUrl),
    url,
    environment: value(env, 'BC_ENVIRONMENT'),
    company: value(env, 'BC_COMPANY'),
    username: value(env, 'BC_USERNAME'),
    authStatePath: value(env, 'BC_AUTH_STATE_PATH') ?? value(env, 'BC_STORAGE_STATE'),
    tenantId: value(env, 'BC_TENANT_ID'),
    clientId: value(env, 'BC_CLIENT_ID'),
    clientSecret: value(env, 'BC_CLIENT_SECRET'),
    scope: value(env, 'BC_SCOPE'),
    apiBaseUrl,
    allowWrite: false,
    allowProductionWrite: false
  };
}

export function validateBcRuntimeConfig(
  config: BcRuntimeConfig,
  env: RuntimeEnv = process.env
): { ok: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (isTrueLike(env.BC_ALLOW_WRITE)) {
    errors.push('BC_ALLOW_WRITE darf fuer diesen Branch niemals true sein.');
  }

  if (isTrueLike(env.BC_ALLOW_PRODUCTION_WRITE)) {
    errors.push('BC_ALLOW_PRODUCTION_WRITE darf fuer diesen Branch niemals true sein.');
  }

  if (!config.hasUiConfig) {
    warnings.push('Keine BC_URL gesetzt: UI-Smoke wird uebersprungen.');
  } else {
    if (!config.environment) warnings.push('BC_ENVIRONMENT fehlt: Environment im Evidence Pack manuell belegen.');
    if (!config.company) warnings.push('BC_COMPANY fehlt: Company im Evidence Pack manuell belegen.');
    if (!config.username) warnings.push('BC_USERNAME fehlt: User/Rolle im Evidence Pack manuell belegen.');
    if (!config.authStatePath) warnings.push('BC_AUTH_STATE_PATH fehlt: Browser-Login/Auth-State muss separat bereitstehen.');
  }

  if (!config.hasApiConfig) {
    warnings.push('Keine BC_API_BASE_URL gesetzt: API/OData-Checks bleiben lokal oder mock-basiert.');
  } else {
    if (!config.tenantId) warnings.push('BC_TENANT_ID fehlt: API-Auth ist nicht konfiguriert.');
    if (!config.clientId) warnings.push('BC_CLIENT_ID fehlt: API-Auth ist nicht konfiguriert.');
    if (!config.clientSecret) warnings.push(`BC_CLIENT_SECRET fehlt oder ist nicht nutzbar: ${maskSensitiveValue(config.clientSecret)}`);
    if (!config.scope) warnings.push('BC_SCOPE fehlt: API-Auth ist nicht vollstaendig.');
  }

  return {
    ok: errors.length === 0,
    warnings,
    errors
  };
}
