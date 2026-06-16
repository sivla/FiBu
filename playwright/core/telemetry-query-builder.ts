export type TelemetryScenario =
  | 'permission-error'
  | 'page-view-performance'
  | 'api-error'
  | 'job-queue-error'
  | 'extension-error'
  | 'session-timeline';

export type TelemetryQueryInput = {
  scenario: TelemetryScenario;
  environment?: string;
  company?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  objectId?: string;
  objectType?: string;
  extensionName?: string;
  timeRangeHours?: number;
};

export type TelemetryQuery = {
  scenario: TelemetryScenario;
  query: string;
  requiredFields: string[];
  evidenceUse: string;
  limitations: string[];
};

const secretLikePattern = /(bearer\s+[a-z0-9._~+/=-]+|client[_-]?secret|access[_-]?token|refresh[_-]?token|sig=|code=|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;

export function redactKqlValue(value: string): string {
  const escaped = value.replace(/'/g, "''").trim();
  if (secretLikePattern.test(escaped)) {
    return '***';
  }

  if (escaped.length > 80) {
    return `${escaped.slice(0, 32)}...`;
  }

  return escaped;
}

function whereEquals(field: string, value?: string): string[] {
  if (!value?.trim()) {
    return [];
  }

  return [`| where ${field} == '${redactKqlValue(value)}'`];
}

function baseQuery(input: TelemetryQueryInput, signal: string): string[] {
  const hours = Math.max(1, Math.min(input.timeRangeHours ?? 24, 168));
  return [
    'traces',
    `| where timestamp > ago(${hours}h)`,
    `| where message has '${signal}' or customDimensions has '${signal}'`,
    ...whereEquals('customDimensions.environmentName', input.environment),
    ...whereEquals('customDimensions.companyName', input.company),
    ...whereEquals('customDimensions.user_Id', input.userId),
    ...whereEquals('customDimensions.session_Id', input.sessionId),
    ...whereEquals('operation_Id', input.correlationId),
    ...whereEquals('customDimensions.alObjectId', input.objectId),
    ...whereEquals('customDimensions.alObjectType', input.objectType),
    ...whereEquals('customDimensions.extensionName', input.extensionName)
  ];
}

const scenarioMeta: Record<
  TelemetryScenario,
  { signal: string; project: string; requiredFields: string[]; evidenceUse: string; limitations: string[] }
> = {
  'permission-error': {
    signal: 'Permission',
    project:
      '| project timestamp, operation_Id, message, severityLevel, user=tostring(customDimensions.user_Id), company=tostring(customDimensions.companyName), objectType=tostring(customDimensions.alObjectType), objectId=tostring(customDimensions.alObjectId)',
    requiredFields: ['timestamp', 'operation_Id', 'message', 'user', 'company', 'objectType', 'objectId'],
    evidenceUse: 'Belegt technischen Permission/Error-Kontext, Objektbezug, User/Company und Correlation ID.',
    limitations: ['Belegt nicht, welches Permission Set fachlich korrekt waere.', 'Ersetzt keine read-only Pruefung der Effective Permissions.']
  },
  'page-view-performance': {
    signal: 'Page',
    project:
      '| project timestamp, operation_Id, message, duration=customDimensions.duration, page=customDimensions.pageName, session=tostring(customDimensions.session_Id)',
    requiredFields: ['timestamp', 'operation_Id', 'page', 'duration', 'session'],
    evidenceUse: 'Belegt Page/View/Duration-Kontext fuer Performance-Hypothesen.',
    limitations: ['Belegt nicht automatisch die fachliche Ursache fuer Langsamkeit.', 'Browser- und Netzwerkfaktoren muessen separat bewertet werden.']
  },
  'api-error': {
    signal: 'API',
    project:
      '| project timestamp, operation_Id, message, status=customDimensions.httpStatusCode, operation=customDimensions.operationName, endpoint=customDimensions.endpoint',
    requiredFields: ['timestamp', 'operation_Id', 'status', 'operation', 'endpoint', 'message'],
    evidenceUse: 'Belegt Status/Error/API-Kontext und betroffene Operation.',
    limitations: ['Belegt nicht automatisch, ob der Request fachlich richtig war.', 'Payloads duerfen nicht als Rohdump committed werden.']
  },
  'job-queue-error': {
    signal: 'Job Queue',
    project:
      '| project timestamp, operation_Id, message, job=customDimensions.jobQueueEntryId, company=tostring(customDimensions.companyName), exception=customDimensions.exceptionMessage',
    requiredFields: ['timestamp', 'operation_Id', 'job', 'company', 'exception'],
    evidenceUse: 'Belegt Job/Queue/Error-Kontext und Zeitpunkt eines Hintergrundfehlers.',
    limitations: ['Belegt nicht, ob externe Systeme korrekt verarbeitet haben.', 'Job darf nicht aus dem Agenten gestartet werden.']
  },
  'extension-error': {
    signal: 'Extension',
    project:
      '| project timestamp, operation_Id, message, extension=customDimensions.extensionName, app=customDimensions.appName, objectType=customDimensions.alObjectType, objectId=customDimensions.alObjectId',
    requiredFields: ['timestamp', 'operation_Id', 'extension', 'app', 'objectType', 'objectId', 'message'],
    evidenceUse: 'Belegt Extension/App-Kontext, Objektbezug und Exception-Hinweise.',
    limitations: ['Belegt nicht automatisch, ob Standard-BC oder PTE fachlich verantwortlich ist.', 'Codeanalyse bleibt separat.']
  },
  'session-timeline': {
    signal: 'Session',
    project:
      '| project timestamp, operation_Id, message, session=tostring(customDimensions.session_Id), operation=customDimensions.operationName, page=customDimensions.pageName',
    requiredFields: ['timestamp', 'operation_Id', 'session', 'operation', 'page', 'message'],
    evidenceUse: 'Belegt Session/Operation-Reihenfolge fuer eine Timeline.',
    limitations: ['Belegt nicht, was der User subjektiv gesehen hat.', 'UI Evidence bleibt erforderlich.']
  }
};

export function buildTelemetryQuery(input: TelemetryQueryInput): TelemetryQuery {
  const meta = scenarioMeta[input.scenario];
  const lines = [
    ...baseQuery(input, meta.signal),
    meta.project,
    '| order by timestamp desc',
    '| take 100'
  ];

  return {
    scenario: input.scenario,
    query: lines.join('\n'),
    requiredFields: meta.requiredFields,
    evidenceUse: meta.evidenceUse,
    limitations: meta.limitations
  };
}
