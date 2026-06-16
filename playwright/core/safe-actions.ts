export type EnvironmentType = 'production' | 'sandbox' | 'test' | 'training' | 'local' | 'mock' | 'unknown';

export type ActionRisk =
  | 'read-only'
  | 'ui-navigation'
  | 'page-inspection'
  | 'structured-data-read'
  | 'personalization'
  | 'data-export'
  | 'master-data-change'
  | 'setup-change'
  | 'document-create'
  | 'posting'
  | 'payment'
  | 'email'
  | 'job-queue'
  | 'integration'
  | 'company-change'
  | 'permission-change'
  | 'unknown';

export type ApprovalEvidence = {
  environment?: EnvironmentType;
  company?: string;
  action?: string;
  purpose?: string;
  risk?: ActionRisk;
  evidencePlan?: string;
  rollbackPlan?: string;
};

export type SafeActionDecision = {
  allowed: boolean;
  requiresExplicitApproval: boolean;
  mustStop: boolean;
  reason: string;
  missingApprovalFields?: Array<keyof ApprovalEvidence>;
  requiredEvidence?: string[];
};

const dangerousRisks = new Set<ActionRisk>([
  'master-data-change',
  'setup-change',
  'document-create',
  'posting',
  'payment',
  'email',
  'job-queue',
  'integration',
  'company-change',
  'permission-change'
]);

const productionAllowedRisks = new Set<ActionRisk>([
  'read-only',
  'ui-navigation',
  'page-inspection',
  'structured-data-read'
]);

const criticalActionWords = [
  'post',
  'buchen',
  'receive',
  'invoice',
  'send',
  'start',
  'process',
  'apply',
  'release',
  'ok',
  'delete',
  'storno',
  'zahlung',
  'payment',
  'export'
];

const approvalFields: Array<keyof ApprovalEvidence> = [
  'environment',
  'company',
  'action',
  'purpose',
  'risk',
  'evidencePlan',
  'rollbackPlan'
];

function getMissingApprovalFields(approvalEvidence?: ApprovalEvidence): Array<keyof ApprovalEvidence> {
  return approvalFields.filter((field) => {
    const value = approvalEvidence?.[field];
    return typeof value === 'string' ? value.trim().length === 0 : value === undefined;
  });
}

function hasAnonymizationPlan(approvalEvidence?: ApprovalEvidence): boolean {
  return /anonym|maskier|pseudonym/i.test(approvalEvidence?.evidencePlan ?? '');
}

function hasCriticalActionLabel(actionLabel?: string): boolean {
  const normalized = actionLabel?.toLocaleLowerCase('de-DE') ?? '';
  return criticalActionWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(normalized));
}

export function decideSafeAction(input: {
  environment: EnvironmentType;
  risk: ActionRisk;
  hasExplicitApproval: boolean;
  approvalEvidence?: ApprovalEvidence;
  containsSensitiveData?: boolean;
  actionLabel?: string;
}): SafeActionDecision {
  const requiredEvidence = [
    'Environment und Company belegen',
    'Aktion und Zweck dokumentieren',
    'Evidence-Plan und Rollback-Plan ablegen'
  ];

  if (input.environment === 'unknown' || input.risk === 'unknown') {
    return {
      allowed: false,
      requiresExplicitApproval: true,
      mustStop: true,
      reason: 'Environment oder Risiko ist unbekannt. Der Agent muss stoppen, bis der Kontext eindeutig ist.',
      requiredEvidence
    };
  }

  if (input.environment === 'production') {
    if (!productionAllowedRisks.has(input.risk) || (input.risk === 'data-export' && input.containsSensitiveData)) {
      return {
        allowed: false,
        requiresExplicitApproval: true,
        mustStop: true,
        reason: 'Production bleibt fuer schreibende, ausloesende oder sensible Export-Aktionen gesperrt.',
        requiredEvidence
      };
    }
  }

  const criticalAction = hasCriticalActionLabel(input.actionLabel);
  const needsApproval = dangerousRisks.has(input.risk) || criticalAction;
  if (needsApproval) {
    const missingApprovalFields = getMissingApprovalFields(input.approvalEvidence);
    if (!input.hasExplicitApproval || missingApprovalFields.length > 0) {
      return {
        allowed: false,
        requiresExplicitApproval: true,
        mustStop: true,
        reason: criticalAction
          ? `Kritische Aktion "${input.actionLabel}" braucht ausdrueckliche Freigabe mit vollstaendigem Evidence- und Rollback-Plan.`
          : `Aktion ${input.risk} braucht ausdrueckliche Freigabe mit vollstaendigem Evidence- und Rollback-Plan.`,
        missingApprovalFields,
        requiredEvidence
      };
    }
  }

  if (input.containsSensitiveData && input.risk === 'data-export') {
    const missingApprovalFields = getMissingApprovalFields(input.approvalEvidence);
    if (!input.hasExplicitApproval || missingApprovalFields.length > 0 || !hasAnonymizationPlan(input.approvalEvidence)) {
      return {
        allowed: false,
        requiresExplicitApproval: true,
        mustStop: true,
        reason: 'Datenexport mit sensiblen Daten braucht Freigabe und einen Anonymisierungsplan im Evidence-Plan.',
        missingApprovalFields,
        requiredEvidence: [...requiredEvidence, 'Anonymisierung oder Maskierung der exportierten Daten beschreiben']
      };
    }
  }

  if (input.risk === 'data-export' && criticalAction && !input.hasExplicitApproval) {
    return {
      allowed: false,
      requiresExplicitApproval: true,
      mustStop: true,
      reason: `Kritische Aktion "${input.actionLabel}" braucht ausdrueckliche Freigabe.`,
      requiredEvidence
    };
  }

  return {
    allowed: true,
    requiresExplicitApproval: false,
    mustStop: false,
    reason: 'Aktion ist innerhalb der Safe-Action-Policy erlaubt.'
  };
}
