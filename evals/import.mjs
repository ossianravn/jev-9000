import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { digest, treeIdentity, writeJson } from './io.mjs';
import { readTrace } from './trace.mjs';
import { loadEnvironment } from '../src/config.ts';
import { safeRecord, scrub } from '../src/recording.ts';

const { values } = parseArgs({ options: { file: { type: 'string' }, out: { type: 'string' } } });
loadEnvironment();
if (!values.file || !values.out) throw new Error('Provide --file IMPORT.json --out NEW_EVIDENCE_DIRECTORY.');
const manifestPath = resolve(values.file), manifestText = await readFile(manifestPath, 'utf8');
const manifest = JSON.parse(manifestText), sourceRoot = dirname(manifestPath);
if (!['codex', 'claude'].includes(manifest.host) || !manifest.prompt || !manifest.traces?.length) {
  throw new Error('Import needs host, complete prompt/instructions, and a traces array.');
}
const directory = resolve(values.out), id = `import-${randomUUID()}`, trial = join(directory, id);
await mkdir(trial, { recursive: true });
await writeJson(join(directory, 'import-manifest.json'), safeRecord(manifest));
await writeJson(join(directory, 'experiment.json'), {
  schema_version: 1, id, host: manifest.host, case_hash: digest(manifestText),
  case: { id: manifest.case_id ?? id, kind: 'usage', origin: 'user-selected import' },
  source: manifest.source ?? 'unknown', model: manifest.model ?? null,
});
await writeJson(join(trial, 'trial.started.json'), {
  schema_version: 1, id, host: manifest.host, arm: 'imported', pair_id: null,
  prompt: scrub(manifest.prompt), followups: (manifest.followups ?? []).map(scrub),
  expected_use: manifest.expected_use ?? 'unknown', experiment: '../experiment.json',
  starting_fixture: manifest.starting_fixture ?? null,
  provenance: { manifest: manifestPath, sha256: digest(manifestText) },
});
const turns = [];
for (const [index, source] of manifest.traces.entries()) {
  const path = join(trial, `turn-${index + 1}.jsonl`);
  const original = await readFile(resolve(sourceRoot, source), 'utf8');
  let transformed = false;
  const cleaned = original.split('\n').map(line => {
    if (!line.trim()) return line;
    try {
      const clean = safeRecord(JSON.parse(line));
      transformed ||= clean.transformed;
      return JSON.stringify(clean.value);
    } catch {
      const clean = scrub(line);
      transformed ||= clean !== line;
      return clean;
    }
  }).join('\n');
  await writeFile(path, cleaned, { flag: 'wx' });
  const trace = await readTrace(path, manifest.host);
  turns.push({ index: index + 1, trace, exit_code: null, imported_from: resolve(sourceRoot, source),
    original_sha256: digest(original), payload_transformed: transformed,
    serialization: 'JSON lines normalized; malformed lines retained for evidence diagnostics' });
}
let artifacts = null;
if (manifest.artifacts) {
  await cp(resolve(sourceRoot, manifest.artifacts), join(trial, 'artifacts'), { recursive: true });
  artifacts = await treeIdentity(join(trial, 'artifacts'));
}
if (manifest.configuration) {
  await writeJson(join(trial, 'host-config.json'), { ...safeRecord(manifest.configuration).value,
    provenance: 'user-supplied; not independently verified' });
}
if (manifest.calls) await cp(resolve(sourceRoot, manifest.calls), join(trial, 'calls'), { recursive: true });
await writeJson(join(trial, 'trial.completed.json'), {
  id, status: turns.every(turn => turn.trace.complete) ? 'completed' : 'incomplete', turns,
  final_artifacts: artifacts, duration_ms: manifest.duration_ms ?? null,
  gaps: ['Imported configuration is declared evidence; unprovided instructions/artifacts remain unavailable.',
    'Calls preserve their original identities. Unmatched trial IDs remain unjoined.'],
});
console.log(trial);
