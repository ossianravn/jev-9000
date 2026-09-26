import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { loadEvidence } from './evidence.mjs';
import { command, digest, treeIdentity, writeJson } from './io.mjs';

const { values } = parseArgs({ options: { root: { type: 'string' } } });
if (!values.root) throw new Error('Provide --root EVIDENCE_DIRECTORY.');
const root = resolve(values.root), here = dirname(fileURLToPath(import.meta.url));
const source = await readFile(join(here, 'grade-artifact.mjs'));
const grader = join(root, `grader-${digest(source).slice(0, 12)}-${randomUUID()}.mjs`);
await writeFile(grader, source, { flag: 'wx' });
for (const trial of (await loadEvidence(root)).trials.filter(trial => trial.status === 'completed' &&
  trial.experiment.case.grader && trial.finish.final_artifacts)) {
  const result = await command(process.execPath, [grader, trial.experiment.case.grader,
    join(trial.directory, 'artifacts'), join(trial.directory, '../fixture')]);
  let grade;
  try { grade = JSON.parse(result.stdout); }
  catch { grade = { passed: null, error: result.stderr || result.stdout }; }
  await writeJson(join(trial.directory, `grade-artifact-${randomUUID()}.json`), {
    kind: 'artifact', trial_id: trial.start.id, created_at: new Date().toISOString(),
    grader_sha256: digest(source), artifacts_sha256: (await treeIdentity(join(trial.directory, 'artifacts'))).sha256,
    exit_code: result.code, result: grade, reason: 'Independent regrade of saved artifacts; no host or Jev calls.',
  });
  console.log(`${trial.start.id}: ${grade.passed}`);
}
