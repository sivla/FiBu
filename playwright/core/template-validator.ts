import fs from 'node:fs';

export type MarkdownSectionValidationResult = {
  ok: boolean;
  missingSections: string[];
};

function normalizeSection(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-DE')
    .replace(/ae/g, 'a')
    .replace(/oe/g, 'o')
    .replace(/ue/g, 'u')
    .replace(/ss/g, 's')
    .replace(/^[#\s\d.:-]+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getMarkdownSections(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, '').trim())
    .filter(Boolean);
}

export function validateMarkdownSections(
  filePath: string,
  requiredSections: string[]
): MarkdownSectionValidationResult {
  const markdown = fs.readFileSync(filePath, 'utf8');
  const normalizedHeadings = getMarkdownSections(markdown).map(normalizeSection);
  const missingSections = requiredSections.filter((section) => {
    const required = normalizeSection(section);
    return !normalizedHeadings.some((heading) => heading.includes(required) || required.includes(heading));
  });

  return {
    ok: missingSections.length === 0,
    missingSections
  };
}
