import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { safeRecord } from '../src/recording.ts';
import { files, readJsonl, writeJson } from './io.mjs';

export async function captureContext(directory, host, sessionIds) {
  if (host !== 'codex') return { captured: false, reason: 'Claude exposes initialization metadata in the host stream; full injected context is not exposed.' };
  const sessions = join(directory, 'host-home/sessions');
  if (!existsSync(sessions)) return { captured: false, reason: 'Host did not retain a session context.' };
  const records = [], contexts = [], issues = [];
  for (const path of (await files(sessions)).filter(path => sessionIds.some(id => path.includes(id)))) {
    const parsed = await readJsonl(path);
    issues.push(...parsed.issues);
    for (const { value } of parsed.records) {
      if (value.type === 'session_meta' || value.type === 'turn_context' ||
          (value.type === 'response_item' && value.payload.type === 'message' &&
            ['system', 'developer', 'user'].includes(value.payload.role))) {
        const cleaned = safeRecord(value);
        records.push({ ...cleaned.value, payload_transformed: cleaned.transformed });
      }
      if (value.type === 'turn_context') contexts.push({
        model: value.payload.model, effort: value.payload.effort,
        sandbox_policy: value.payload.sandbox_policy, approval_policy: value.payload.approval_policy,
      });
    }
  }
  const file = join(directory, 'host-context.jsonl');
  await writeFile(file, records.map(record => JSON.stringify(record)).join('\n') + '\n', { flag: 'wx' });
  const skillListed = records.some(record => record.type === 'response_item' &&
    /jev-9000:jev-9000:/.test(JSON.stringify(record.payload)));
  const result = { captured: records.length > 0, contexts, jev_skill_listed: skillListed,
    note: 'Host-provided instructions and context only; skill listing differs from reading it.', evidence: file, issues };
  await writeJson(join(directory, 'context-evidence.json'), result);
  return result;
}
