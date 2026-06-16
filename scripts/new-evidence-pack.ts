import { createEvidencePack } from '../playwright/core/evidence-scaffold';

const [id, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ');

if (!id || !title) {
  console.error('Nutzung: npm run new:evidence -- SAMPLE-002 "Permission error on posting preview"');
  process.exit(1);
}

try {
  const result = createEvidencePack({ id, title });
  console.log(`Evidence Pack erstellt: ${result.packDir}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Evidence Pack konnte nicht erstellt werden.');
  process.exit(1);
}
