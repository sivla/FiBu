export type EnvironmentType = 'production' | 'sandbox' | 'test' | 'unknown';

export type ActionRisk =
  | 'read-only'
  | 'ui-navigation'
  | 'data-export'
  | 'setup-change'
  | 'posting'
  | 'payment'
  | 'email'
  | 'job-queue'
  | 'integration'
  | 'company-change';

export type SafeActionDecision = {
  allowed: boolean;
  requiresExplicitApproval: boolean;
  reason: string;
};

const dangerousRisks = new Set<ActionRisk>([
  'setup-change',
  'posting',
  'payment',
  'email',
  'job-queue',
  'integration',
  'company-change'
]);

export function decideSafeAction(input: {
  environment: EnvironmentType;
  risk: ActionRisk;
  hasExplicitApproval: boolean;
  containsSensitiveData?: boolean;
}): SafeActionDecision {
  if (input.environment === 'production' && input.risk !== 'read-only' && input.risk !== 'ui-navigation') {
    return {
      allowed: false,
      requiresExplicitApproval: true,
      reason: 'Production bleibt fuer schreibende oder ausloesende Aktionen gesperrt.'
    };
  }

  if (dangerousRisks.has(input.risk) && !input.hasExplicitApproval) {
    return {
      allowed: false,
      requiresExplicitApproval: true,
      reason: `Aktion ${input.risk} braucht ausdrueckliche Freigabe und Evidence-Plan.`
    };
  }

  if (input.containsSensitiveData && input.risk === 'data-export') {
    return {
      allowed: false,
      requiresExplicitApproval: true,
      reason: 'Datenexport mit sensiblen Daten braucht Anonymisierung oder Freigabe.'
    };
  }

  return {
    allowed: true,
    requiresExplicitApproval: false,
    reason: 'Aktion ist innerhalb der Safe-Action-Policy erlaubt.'
  };
}
