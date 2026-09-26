import { cp, link, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { command, files, readJson, writeJson } from './io.mjs';
import { inspectPlugin } from './inspect-plugin.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function executable(host) {
  if (process.platform !== 'win32') return { command: host, prefix: [] };
  if (host === 'codex') {
    const cli = join(process.env.APPDATA, 'npm/node_modules/@openai/codex/bin/codex.js');
    if (existsSync(cli)) return { command: process.execPath, prefix: [cli] };
  }
  for (const directory of (process.env.PATH ?? '').split(delimiter)) {
    const path = join(directory, `${host}.exe`);
    if (existsSync(path)) return { command: path, prefix: [] };
  }
  throw new Error(`Cannot locate ${host}; put its executable on PATH.`);
}

export async function invoke(host, args, options) {
  const tool = executable(host);
  return command(tool.command, [...tool.prefix, ...args], options);
}

async function packagePlugin(destination, trialId, logDirectory, host, envFile) {
  await mkdir(destination, { recursive: true });
  for (const item of ['plugin.json', '.codex-plugin', '.claude-plugin', 'skills', 'dist', 'mcp.json', '.mcp.json']) {
    await cp(join(project, item), join(destination, item), { recursive: true });
  }
  for (const name of ['mcp.json', '.mcp.json']) {
    const path = join(destination, name);
    const config = await readJson(path);
    config.mcpServers['jev-9000'].env = {
      JEV_9000_ENV_FILE: envFile,
      JEV_9000_LOG_DIR: logDirectory,
      JEV_9000_TRIAL_ID: trialId,
      JEV_9000_HOST: host,
    };
    await writeFile(path, JSON.stringify(config, null, 2));
  }
}

export async function prepareHost({ host, arm, directory, trialId, model, effort, envFile }) {
  const pluginRoot = join(directory, 'package');
  const logDirectory = join(directory, 'calls');
  await mkdir(logDirectory, { recursive: true });
  const version = await invoke(host, ['--version']);
  if (version.code !== 0) throw new Error(version.stderr || `${host} version failed`);
  const env = { ...process.env };
  // Fresh CLI sessions must not inherit the parent desktop thread's identity.
  for (const name of ['CODEX_THREAD_ID', 'CODEX_SESSION_ID', 'CODEX_APP_TOOLS_PIPE_PATH',
    'CODEX_INTERNAL_ORIGINATOR_OVERRIDE']) delete env[name];
  const config = { host, arm, model, effort, host_version: version.stdout.trim(), plugin_enabled: arm === 'treatment' };
  if (host === 'codex') {
    const hostHome = join(directory, 'host-home');
    await mkdir(hostHome, { recursive: true });
    const original = process.env.CODEX_HOME ?? join(homedir(), '.codex');
    // Reuse local authentication without reading it into evidence or prompts.
    if (existsSync(join(original, 'auth.json'))) await link(join(original, 'auth.json'), join(hostHome, 'auth.json'));
    env.CODEX_HOME = hostHome;
    env.USERPROFILE = join(directory, 'profile');
    env.HOME = env.USERPROFILE;
    await mkdir(env.USERPROFILE, { recursive: true });
    await writeFile(join(hostHome, 'config.toml'), [
      `model = ${JSON.stringify(model)}`, `model_reasoning_effort = ${JSON.stringify(effort)}`,
      'approval_policy = "never"', 'sandbox_mode = "danger-full-access"',
      '[features]', 'plugins = true', 'multi_agent = false',
    ].join('\n') + '\n');
    if (arm === 'treatment') {
      const marketplace = join(directory, 'marketplace');
      const packagePath = join(marketplace, 'plugins/jev-9000');
      await packagePlugin(packagePath, trialId, logDirectory, host, envFile);
      await writeJson(join(marketplace, '.agents/plugins/marketplace.json'), {
        name: 'jev-evals', interface: { displayName: 'JEV evaluation fixture' },
        plugins: [{ name: 'jev-9000', source: { source: 'local', path: './plugins/jev-9000' },
          policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }],
      });
      for (const args of [
        ['plugin', 'marketplace', 'add', marketplace, '--json'],
        ['plugin', 'add', 'jev-9000@jev-evals', '--json'],
      ]) {
        const result = await invoke(host, args, { env, cwd: directory });
        if (result.code !== 0) throw new Error(result.stderr || result.stdout);
      }
      config.installed_files = (await files(join(hostHome, 'plugins/cache')))
        .filter(path => /(?:server\.mjs|SKILL\.md|plugin\.json|mcp\.json)$/.test(path));
      const installed = config.installed_files.find(path => path.endsWith('dist\\server.mjs') || path.endsWith('dist/server.mjs'));
      if (!installed) throw new Error('Installed bundled runtime was not found.');
      config.discovery = await inspectPlugin(dirname(dirname(installed)), host);
      if (!config.discovery.tools.some(tool => tool.name === 'jev_evaluate')) throw new Error('Installed tool is unavailable.');
    } else config.installed_files = [];
    config.configuration = await readFile(join(hostHome, 'config.toml'), 'utf8');
    config.permissions = 'danger-full-access; matches this authorized local build environment';
    config.profile_override = env.USERPROFILE;
    config.context_note = 'Windows may still discover global skills; actual injected context is captured for comparison.';
    return { env, config, args: ['exec', '--json', '--color', 'never', '--skip-git-repo-check',
      '--sandbox', 'danger-full-access'] };
  }
  if (host !== 'claude') throw new Error(`Unsupported host: ${host}`);
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--model', model,
    '--effort', effort, '--permission-mode', 'acceptEdits', '--setting-sources', ''];
  // Strict MCP mode suppresses native plugin servers too (observed in Claude 2.1.226).
  // Keep native plugin loading; save the actual init inventory for configuration comparison.
  if (arm === 'treatment') {
    await packagePlugin(pluginRoot, trialId, logDirectory, host, envFile);
    args.push('--plugin-dir', pluginRoot);
    config.discovery = await inspectPlugin(pluginRoot, host);
  }
  const auth = await invoke(host, ['auth', 'status']);
  config.authentication = JSON.parse(auth.stdout);
  return { env, config, args };
}

export function taskArgs(host, prepared, { workspace, resume }) {
  if (host === 'codex') {
    return resume ? ['exec', '--json', '--color', 'never', '--skip-git-repo-check',
      '--sandbox', 'danger-full-access', 'resume', resume, '-'] : [...prepared.args, '-'];
  }
  return [...prepared.args, ...(resume ? ['--resume', resume] : [])];
}
