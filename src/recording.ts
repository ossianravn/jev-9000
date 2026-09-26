import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type RecordSink = (event: Record<string, unknown>) => Promise<void>;

export function scrub(text: string): string {
  const key = process.env.TYPESAFE_API_KEY?.trim();
  return (key ? text.replaceAll(key, '[redacted]') : text)
    .replace(/Bearer\s+[^\s"',;\\]+/gi, 'Bearer [redacted]');
}

export function safeRecord(value: unknown): { value: unknown; transformed: boolean } {
  let transformed = false;
  const json = JSON.stringify(value, (key, item: unknown) => {
    if (/^(authorization|proxy-authorization|(?:[a-z]+[_-])?api[_-]?key|access[_-]?token|refresh[_-]?token)$/i.test(key)) {
      transformed = true;
      return '[redacted]';
    }
    if (typeof item !== 'string') return item;
    const clean = scrub(item);
    if (clean !== item) transformed = true;
    return clean;
  });
  return { value: json === undefined ? null : JSON.parse(json), transformed };
}

export async function runtimeIdentity(entry = import.meta.url) {
  const path = fileURLToPath(entry);
  const root = dirname(dirname(path));
  const hash = async (file: string) => {
    try { return createHash('sha256').update(await readFile(file)).digest('hex'); }
    catch (error) {
      console.error('JEV 9000 identity unavailable:', scrub(String(error)));
      return null;
    }
  };
  let version: string | null = null;
  try { version = JSON.parse(await readFile(join(root, 'plugin.json'), 'utf8')).version; }
  catch (error) { console.error('JEV 9000 version unavailable:', scrub(String(error))); }
  return {
    plugin_version: version,
    build_id: await hash(path),
    skill_hash: await hash(join(root, 'skills/jev-9000/SKILL.md')),
    runtime_path: path,
    node_version: process.version,
  };
}

export function createRecorder(options: {
  directory?: string;
  source?: 'live' | 'simulated' | 'replay';
  trialId?: string;
  host?: string;
  runtime?: Awaited<ReturnType<typeof runtimeIdentity>>;
  diagnose?: (message: string) => void;
} = {}): RecordSink {
  if (process.env.JEV_9000_LOGGING?.trim().toLowerCase() === 'false') {
    return () => Promise.resolve();
  }
  const processId = randomUUID();
  const directory = options.directory ?? process.env.JEV_9000_LOG_DIR ?? join(homedir(), '.jev-9000/logs');
  const file = join(directory, `${new Date().toISOString().replaceAll(':', '-')}-${processId}.jsonl`);
  const diagnose = options.diagnose ?? console.error;
  // Serialize writes within this process; separate files avoid inter-process contention.
  let pending = Promise.resolve();
  return event => {
    pending = pending.then(async () => {
      try {
        const cleaned = safeRecord(event);
        const record = {
          schema_version: 1,
          timestamp: new Date().toISOString(),
          process_instance_id: processId,
          source: options.source ?? 'live',
          trial_id: options.trialId ?? process.env.JEV_9000_TRIAL_ID ?? null,
          host: options.host ?? process.env.JEV_9000_HOST ?? null,
          runtime: options.runtime ?? null,
          ...cleaned.value as Record<string, unknown>,
          payload_transformed: cleaned.transformed,
        };
        await mkdir(directory, { recursive: true });
        await appendFile(file, JSON.stringify(record) + '\n', { encoding: 'utf8', mode: 0o600 });
      } catch (error) {
        diagnose(`JEV_9000_RECORDING_ERROR: ${scrub(String(error))}`);
      }
    });
    return pending;
  };
}
