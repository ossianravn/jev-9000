import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { createWriteStream } from 'node:fs';
import { scrub } from '../src/recording.ts';

export const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
export const digest = value => createHash('sha256').update(value).digest('hex');

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}

export async function files(root, excluded = []) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.name === '.git' || excluded.includes(entry.name)) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...await files(path, excluded));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}

export async function treeIdentity(root) {
  const entries = await Promise.all((await files(root)).map(async path =>
    [relative(root, path).replaceAll('\\', '/'), digest(await readFile(path))]));
  return { sha256: digest(JSON.stringify(entries)), files: Object.fromEntries(entries) };
}

export async function readJsonl(path) {
  const records = [], issues = [];
  const text = await readFile(path, 'utf8');
  const lines = text.split('\n');
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    try { records.push({ value: JSON.parse(line), evidence: `${path}#L${index + 1}` }); }
    catch { issues.push(`${path}#L${index + 1}: invalid/incomplete JSON`); }
  }
  return { records, issues };
}

// No shell interpolation: arguments and prompt input remain literal.
export async function command(executable, args, { cwd, env = process.env, input = '', save } = {}) {
  return new Promise((resolve, reject) => {
    const outputs = save ? [createWriteStream(`${save}.jsonl`, { flags: 'wx' }),
      createWriteStream(`${save}.stderr.txt`, { flags: 'wx' })] : [];
    for (const output of outputs) output.on('error', reject);
    const partial = ['', ''];
    const stream = (index, data) => {
      partial[index] += data;
      const end = partial[index].lastIndexOf('\n');
      if (end >= 0) {
        outputs[index]?.write(scrub(partial[index].slice(0, end + 1)));
        partial[index] = partial[index].slice(end + 1);
      }
    };
    const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', data => { stdout += data; stream(0, data); });
    child.stderr.on('data', data => { stderr += data; stream(1, data); });
    child.on('error', error => { for (const output of outputs) output.end(); reject(error); });
    child.stdin.on('error', error => { if (error.code !== 'EPIPE') reject(error); });
    child.on('close', async (code, signal) => {
      const result = { code, signal, stdout: scrub(stdout), stderr: scrub(stderr) };
      if (save) {
        try {
          await Promise.all(outputs.map((output, index) => new Promise((done, fail) => {
            output.once('error', fail);
            output.end(scrub(partial[index]), done);
          })));
        } catch (error) { reject(error); return; }
      }
      resolve(result);
    });
    child.stdin.end(input);
  });
}
