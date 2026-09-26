import { parseArgs } from 'node:util';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readJson, writeJson } from './io.mjs';

const { values } = parseArgs({ options: { trial: { type: 'string' }, file: { type: 'string' } } });
if (!values.trial || !values.file) throw new Error('Provide --trial DIRECTORY --file REVIEW.json.');
const trial = resolve(values.trial);
const start = await readJson(join(trial, 'trial.started.json'));
const review = await readJson(resolve(values.file));
if (!review.reviewer || !review.method || !review.verdict || !review.rationale || !review.evidence?.length) {
  throw new Error('Review needs reviewer, method, verdict, rationale, and evidence references.');
}
for (const reference of review.evidence) {
  const [path, fragment] = reference.split('#L');
  const text = await readFile(resolve(trial, path), 'utf8');
  if (fragment && (!/^\d+$/.test(fragment) || Number(fragment) < 1 || Number(fragment) > text.split('\n').length)) {
    throw new Error(`Evidence line unavailable: ${reference}`);
  }
}
const path = join(trial, `grade-behavior-${randomUUID()}.json`);
await writeJson(path, { ...review, kind: 'behavior', trial_id: start.id, created_at: new Date().toISOString() });
console.log(path);
