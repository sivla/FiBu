import { expect, test } from '@playwright/test';
import {
  BcMcpToolName,
  assertBcMcpToolAllowed,
  bcMcpToolRegistry,
  getBcMcpToolSpec
} from '../../../core/bc-mcp-tools';

const specTools: BcMcpToolName[] = [
  'bc_get_environment_context',
  'bc_get_page_context',
  'bc_lookup_record',
  'bc_trace_document_entries',
  'bc_check_posting_setup',
  'bc_check_dimensions',
  'bc_read_job_queue_status',
  'bc_read_permission_context',
  'bc_build_telemetry_query',
  'bc_write_local_evidence',
  'bc_redact_result'
];

test('Alle Tools aus der Tool-Spec existieren im Registry', () => {
  expect(bcMcpToolRegistry.map((tool) => tool.name).sort()).toEqual([...specTools].sort());
});

test('Read-only Tools sind als read-only markiert', () => {
  const readOnlyTools = bcMcpToolRegistry.filter((tool) => tool.name !== 'bc_write_local_evidence');

  expect(readOnlyTools.every((tool) => tool.risk === 'read-only')).toBe(true);
});

test('bc_write_local_evidence ist local-write, aber kein BC-Write', () => {
  const spec = getBcMcpToolSpec('bc_write_local_evidence');

  expect(spec.risk).toBe('local-write');
  expect(spec.description).toMatch(/lokale Evidence/i);
  expect(spec.description).not.toMatch(/Business Central schreiben/i);
});

test('Unknown Environment blockiert', () => {
  expect(() =>
    assertBcMcpToolAllowed({
      name: 'bc_lookup_record',
      environment: 'unknown',
      hasExplicitApproval: false
    })
  ).toThrow(/Environment ist unbekannt/);
});

test('Production erlaubt read-only Tools', () => {
  expect(() =>
    assertBcMcpToolAllowed({
      name: 'bc_lookup_record',
      environment: 'production',
      hasExplicitApproval: false
    })
  ).not.toThrow();
});

test('Production blockiert local-write ohne lokale Evidence-Freigabe', () => {
  expect(() =>
    assertBcMcpToolAllowed({
      name: 'bc_write_local_evidence',
      environment: 'production',
      hasExplicitApproval: false
    })
  ).toThrow(/Production blockiert/);
});

test('Nicht existierendes Tool wirft verstaendlichen Fehler', () => {
  expect(() => getBcMcpToolSpec('bc_fake_tool' as BcMcpToolName)).toThrow(/Unbekanntes BC-MCP-Tool/);
});

test('Registry enthaelt keine riskanten Toolnamen', () => {
  const riskyActionSegments = ['post', 'invoice', 'send', 'payment', 'delete', 'modify', 'patch', 'put', 'job_start'];
  const toolSegments = bcMcpToolRegistry.flatMap((tool) => tool.name.split('_'));

  for (const riskySegment of riskyActionSegments) {
    expect(toolSegments).not.toContain(riskySegment);
  }
});

test('Toolbeschreibungen sind nicht leer', () => {
  expect(bcMcpToolRegistry.every((tool) => tool.description.trim().length > 20)).toBe(true);
});
