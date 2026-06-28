export type CustomerContext = {
  customerKey: string;
  industry?: string;
  bcVersion?: string;
  standardProximity?: 'standard' | 'light-customization' | 'heavy-customization' | 'unknown';
  processes: string[];
  extensions: string[];
  integrations: string[];
  knownIssues: Array<{
    id: string;
    title: string;
    signals: string[];
    classification: CustomerIssueClassification;
  }>;
  permissionHints: string[];
  riskAreas: string[];
};

export type CustomerIssueClassification =
  | 'user-guidance'
  | 'setup-configuration'
  | 'permission'
  | 'standard-limitation'
  | 'bug'
  | 'data-problem'
  | 'integration'
  | 'performance'
  | 'unknown';

export type CustomerContextValidationResult = {
  ok: boolean;
  warnings: string[];
  errors: string[];
};

const sensitivePatterns = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/,
  /client[_-]?secret|access[_-]?token|refresh[_-]?token|Bearer\s+/i,
  /\.auth|storageState|cookie/i
];

function hasSensitiveValue(value: string): boolean {
  return sensitivePatterns.some((pattern) => pattern.test(value));
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }

  return [];
}

export function createEmptyCustomerContext(customerKey: string): CustomerContext {
  return {
    customerKey: customerKey.trim(),
    standardProximity: 'unknown',
    processes: [],
    extensions: [],
    integrations: [],
    knownIssues: [],
    permissionHints: [],
    riskAreas: []
  };
}

export function validateCustomerContext(context: CustomerContext): CustomerContextValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!context.customerKey.trim()) {
    errors.push('Customer Context braucht ein anonymes Kundenkuerzel.');
  }

  if (context.processes.length === 0) {
    warnings.push('Keine Kundenprozesse gepflegt. Triage nutzt nur allgemeines BC-Wissen.');
  }

  if (context.extensions.length === 0) {
    warnings.push('Keine Extensions gepflegt. Extension-Hypothesen bleiben generisch.');
  }

  if (context.knownIssues.length === 0) {
    warnings.push('Keine Known Issues gepflegt. Wiederholungsfaelle werden nicht automatisch erkannt.');
  }

  const sensitiveValues = collectStrings(context).filter(hasSensitiveValue);
  if (sensitiveValues.length > 0) {
    errors.push('Customer Context enthaelt moegliche Secrets, Tokens, Auth-State oder personenbezogene Rohdaten.');
  }

  return {
    ok: errors.length === 0,
    warnings,
    errors
  };
}

export function findKnownIssueMatches(context: CustomerContext, ticketText: string) {
  const normalizedTicket = ticketText.toLocaleLowerCase('de-DE');
  return context.knownIssues.filter((issue) =>
    issue.signals.some((signal) => normalizedTicket.includes(signal.toLocaleLowerCase('de-DE')))
  );
}
