import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'plugins', 'jev-9000');
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const { version } = await readJson('package.json');
const manifests = ['plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json'];
for (const path of manifests) {
  assert.equal((await readJson(path)).version, version, `Update ${path} to ${version}`);
}

// Only these public assets enter the generated distribution; never copy the checkout.
const files = [...manifests, 'mcp.json', '.mcp.json', '.env.example', 'README.md', 'assets/icon.svg', 'dist/server.mjs'];
for (const entry of await readdir(join(root, 'skills'), { recursive: true, withFileTypes: true })) {
  if (entry.isFile()) files.push(join(entry.parentPath, entry.name).slice(root.length + 1));
}
// Read everything before replacing the generated package, so missing build output is actionable.
const contents = await Promise.all(files.map(async path => [path,
  (await readFile(join(root, path), 'utf8')).replaceAll('\r\n', '\n')]));
assert.equal(dirname(destination), resolve(root, 'plugins'));
await rm(destination, { recursive: true, force: true });
for (const [path, content] of contents) {
  const output = join(destination, path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, content);
}
console.log(`Packaged JEV 9000 ${version}: ${files.length} files in ${destination}`);
