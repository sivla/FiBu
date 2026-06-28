import { expect, test } from '@playwright/test';
import { createEmptyCustomerContext } from '../../../core/customer-context';
import { triageTicket } from '../../../core/ticket-triage';

test('Permission-Ticket empfiehlt Permission-, Data- und Telemetry-Evidence', () => {
  const result = triageTicket({
    ticketText: 'User bekommt eine Berechtigungsfehlermeldung auf TableData beim Ausfuehren der Buchungsvorschau.',
    environment: 'sandbox'
  });

  expect(result.problemClass).toBe('permission');
  expect(result.recommendedChannels).toEqual(expect.arrayContaining(['ui', 'data', 'telemetry']));
  expect(result.nextActions.join('\n')).toMatch(/Effective Permissions/);
});

test('Fehlende Spalte wird als Bedienhilfe oder UI-Kontext triagiert', () => {
  const result = triageTicket({
    ticketText: 'Der Kunde findet die Spalte Lagerortcode nicht, sie ist auf der Page nicht sichtbar.',
    environment: 'production'
  });

  expect(result.problemClass).toBe('user-guidance');
  expect(result.recommendedChannels).toEqual(expect.arrayContaining(['ui']));
  expect(result.safetyNotes).toContain('Nur read-only Diagnose geplant.');
});

test('Posting-Setup-Ticket empfiehlt Setup- und Data-Evidence', () => {
  const result = triageTicket({
    ticketText: 'Beim Preview Posting kommt ein Fehler wegen Inventory Posting Setup und fehlender Buchungsgruppe.',
    environment: 'sandbox'
  });

  expect(result.problemClass).toBe('setup-configuration');
  expect(result.recommendedChannels).toEqual(expect.arrayContaining(['data']));
});

test('Integration-Ticket loest keine Integration aus', () => {
  const result = triageTicket({
    ticketText: 'Die externe API Integration liefert einen OData Fehler, der Status bleibt offen.',
    environment: 'sandbox'
  });

  expect(result.problemClass).toBe('integration');
  expect(result.nextActions.join('\n')).toMatch(/keine Integration ausloesen/);
});

test('Known Issue aus Kundenkontext kann Klassifikation uebersteuern', () => {
  const context = {
    ...createEmptyCustomerContext('DEMO'),
    knownIssues: [
      {
        id: 'KI-777',
        title: 'Standard kann automatische Sammelbuchung nicht',
        signals: ['automatische sammelbuchung'],
        classification: 'standard-limitation' as const
      }
    ]
  };

  const result = triageTicket({
    ticketText: 'Kunde fragt nach automatische Sammelbuchung im Standard.',
    customerContext: context,
    environment: 'sandbox'
  });

  expect(result.problemClass).toBe('standard-limitation');
  expect(result.knownIssueMatches).toEqual(['KI-777']);
});

test('Unklares Ticket erzeugt Rueckfragen und blockiert wegen unbekannter Umgebung', () => {
  const result = triageTicket({
    ticketText: 'Es geht nicht. Bitte anschauen.'
  });

  expect(result.problemClass).toBe('unknown');
  expect(result.questions.length).toBeGreaterThan(0);
  expect(result.safetyNotes.join('\n')).toMatch(/unbekannt/);
});

test('Leerer Tickettext wird abgelehnt', () => {
  expect(() => triageTicket({ ticketText: ' ' })).toThrow(/Tickettext fehlt/);
});
