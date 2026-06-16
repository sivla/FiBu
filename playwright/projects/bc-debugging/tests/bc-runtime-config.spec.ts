import { expect, test } from '@playwright/test';
import { loadBcRuntimeConfig, validateBcRuntimeConfig } from '../../../core/bc-runtime-config';

const managedKeys = [
  'BC_URL',
  'BC_ENVIRONMENT',
  'BC_COMPANY',
  'BC_USERNAME',
  'BC_AUTH_STATE_PATH',
  'BC_STORAGE_STATE',
  'BC_TENANT_ID',
  'BC_CLIENT_ID',
  'BC_CLIENT_SECRET',
  'BC_SCOPE',
  'BC_API_BASE_URL',
  'BC_ALLOW_WRITE',
  'BC_ALLOW_PRODUCTION_WRITE'
];

function withEnv(values: Record<string, string | undefined>, run: () => void) {
  const previous = new Map(managedKeys.map((key) => [key, process.env[key]]));
  for (const key of managedKeys) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const key of managedKeys) {
      const oldValue = previous.get(key);
      if (oldValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = oldValue;
      }
    }
  }
}

test('Leere Umgebung erzeugt keine harten Fehler und keine Runtime-Konfiguration', () => {
  withEnv({}, () => {
    const config = loadBcRuntimeConfig();
    const validation = validateBcRuntimeConfig(config);

    expect(config.hasUiConfig).toBe(false);
    expect(config.hasApiConfig).toBe(false);
    expect(validation.ok).toBe(true);
    expect(validation.warnings.length).toBeGreaterThan(0);
  });
});

test('BC_URL aktiviert UI-Konfiguration', () => {
  withEnv({ BC_URL: 'https://businesscentral.example.invalid' }, () => {
    expect(loadBcRuntimeConfig().hasUiConfig).toBe(true);
  });
});

test('BC_API_BASE_URL aktiviert API-Konfiguration', () => {
  withEnv({ BC_API_BASE_URL: 'https://api.businesscentral.example.invalid/v2.0' }, () => {
    expect(loadBcRuntimeConfig().hasApiConfig).toBe(true);
  });
});

test('BC_ALLOW_WRITE=true erzeugt Fehler', () => {
  withEnv({ BC_ALLOW_WRITE: 'true' }, () => {
    const validation = validateBcRuntimeConfig(loadBcRuntimeConfig());

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain('BC_ALLOW_WRITE darf fuer diesen Branch niemals true sein.');
  });
});

test('BC_ALLOW_PRODUCTION_WRITE=true erzeugt Fehler', () => {
  withEnv({ BC_ALLOW_PRODUCTION_WRITE: 'true' }, () => {
    const validation = validateBcRuntimeConfig(loadBcRuntimeConfig());

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain('BC_ALLOW_PRODUCTION_WRITE darf fuer diesen Branch niemals true sein.');
  });
});

test('Secrets werden in Warnungen und Fehlern nicht unmaskiert ausgegeben', () => {
  withEnv({
    BC_API_BASE_URL: 'https://api.businesscentral.example.invalid/v2.0',
    BC_CLIENT_SECRET: 'not-a-real-secret-value',
    BC_ALLOW_WRITE: 'true'
  }, () => {
    const validation = validateBcRuntimeConfig(loadBcRuntimeConfig());
    const joined = [...validation.warnings, ...validation.errors].join('\n');

    expect(joined).not.toContain('not-a-real-secret-value');
  });
});

test('Auth-State-Pfad wird erkannt, aber nicht geprueft oder geschrieben', () => {
  withEnv({ BC_AUTH_STATE_PATH: 'playwright/.auth/demo-user.json' }, () => {
    const config = loadBcRuntimeConfig();

    expect(config.authStatePath).toBe('playwright/.auth/demo-user.json');
  });
});

test('UI und API-Konfiguration werden gemeinsam erkannt', () => {
  withEnv(
    {
      BC_URL: 'https://businesscentral.example.invalid',
      BC_API_BASE_URL: 'https://api.businesscentral.example.invalid/v2.0'
    },
    () => {
      const config = loadBcRuntimeConfig();

      expect(config.hasUiConfig).toBe(true);
      expect(config.hasApiConfig).toBe(true);
    }
  );
});
