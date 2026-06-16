import fs from 'node:fs/promises';
import path from 'node:path';

export type EvidenceStatus =
  | 'draft'
  | 'read-only'
  | 'reproduced'
  | 'root-cause-confirmed'
  | 'workaround-documented'
  | 'regression-covered'
  | 'blocked';

export function evidencePath(caseId: string, fileName: string) {
  return path.resolve('debugging-book', 'evidence', caseId, fileName);
}

export async function writeJsonEvidence(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function writeTextEvidence(filePath: string, value: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/(?:\n[ \t]*)+$/g, '')
    .concat('\n');
  await fs.writeFile(filePath, normalized, 'utf8');
}

export async function readTextEvidence(filePath: string) {
  return fs.readFile(filePath, 'utf8');
}

export async function evidenceFileExists(filePath: string) {
  return fs
    .stat(filePath)
    .then((stat) => stat.isFile())
    .catch(() => false);
}
