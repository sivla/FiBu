import { EnvironmentType, decideSafeAction } from './safe-actions';

export type BcMcpToolName =
  | 'bc_get_environment_context'
  | 'bc_get_page_context'
  | 'bc_lookup_record'
  | 'bc_trace_document_entries'
  | 'bc_check_posting_setup'
  | 'bc_check_dimensions'
  | 'bc_read_job_queue_status'
  | 'bc_read_permission_context'
  | 'bc_build_telemetry_query'
  | 'bc_write_local_evidence'
  | 'bc_redact_result';

export type BcMcpToolRisk = 'read-only' | 'local-write' | 'blocked';

export type BcMcpToolSpec = {
  name: BcMcpToolName;
  risk: BcMcpToolRisk;
  description: string;
  allowedInProduction: boolean;
  requiresApproval: boolean;
};

export const bcMcpToolRegistry: BcMcpToolSpec[] = [
  {
    name: 'bc_get_environment_context',
    risk: 'read-only',
    description: 'Environment, Company und URL-Kontext read-only zusammenfassen.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_get_page_context',
    risk: 'read-only',
    description: 'Page Caption, Page ID, Source Table, Filter und Extensions read-only dokumentieren.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_lookup_record',
    risk: 'read-only',
    description: 'Einzelne Datensaetze mit begrenzten Feldern read-only suchen.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_trace_document_entries',
    risk: 'read-only',
    description: 'Beleg- und Postenspuren read-only ueber Ledger Entries verfolgen.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_check_posting_setup',
    risk: 'read-only',
    description: 'Posting-Setup-Kombinationen read-only pruefen.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_check_dimensions',
    risk: 'read-only',
    description: 'Dimension Set ID, Default Dimensions und Kombinationen read-only pruefen.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_read_job_queue_status',
    risk: 'read-only',
    description: 'Job Queue Entries und Log Entries read-only lesen, ohne Jobs zu starten.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_read_permission_context',
    risk: 'read-only',
    description: 'Permission Sets, Effective Permissions und Security Filter read-only dokumentieren.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_build_telemetry_query',
    risk: 'read-only',
    description: 'Sichere KQL-Query-Templates bauen, ohne sie live auszufuehren.',
    allowedInProduction: true,
    requiresApproval: false
  },
  {
    name: 'bc_write_local_evidence',
    risk: 'local-write',
    description: 'Nur lokale Evidence-Dateien schreiben; kein Schreibzugriff auf Business Central.',
    allowedInProduction: false,
    requiresApproval: true
  },
  {
    name: 'bc_redact_result',
    risk: 'read-only',
    description: 'Ergebnisse vor Evidence-Commit anonymisieren oder maskieren.',
    allowedInProduction: true,
    requiresApproval: false
  }
];

export function getBcMcpToolSpec(name: BcMcpToolName): BcMcpToolSpec {
  const spec = bcMcpToolRegistry.find((tool) => tool.name === name);
  if (!spec) {
    throw new Error(`Unbekanntes BC-MCP-Tool: ${name}. Das Tool ist nicht im read-only Registry freigegeben.`);
  }

  return spec;
}

export function assertBcMcpToolAllowed(input: {
  name: BcMcpToolName;
  environment: EnvironmentType;
  hasExplicitApproval: boolean;
}): void {
  const spec = getBcMcpToolSpec(input.name);

  if (input.environment === 'unknown') {
    throw new Error('BC-MCP-Tool blockiert: Environment ist unbekannt.');
  }

  if (spec.risk === 'blocked') {
    throw new Error(`BC-MCP-Tool ${input.name} ist bewusst blockiert.`);
  }

  if (spec.risk === 'local-write') {
    if (input.environment === 'production' || !input.hasExplicitApproval) {
      throw new Error(
        `BC-MCP-Tool ${input.name} schreibt nur lokale Evidence, braucht aber klare Freigabe und ist in Production blockiert.`
      );
    }
    return;
  }

  const decision = decideSafeAction({
    environment: input.environment,
    risk: 'structured-data-read',
    hasExplicitApproval: input.hasExplicitApproval,
    actionLabel: input.name
  });

  if (!decision.allowed || (input.environment === 'production' && !spec.allowedInProduction)) {
    throw new Error(`BC-MCP-Tool ${input.name} blockiert: ${decision.reason}`);
  }
}
