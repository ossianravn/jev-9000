import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const { values } = parseArgs({ options: {
  root: { type: 'string', default: '.' },
  host: { type: 'string', default: 'codex' },
  env: { type: 'string' },
  mode: { type: 'string', default: 'choice' },
} });
const root = resolve(values.root);
const configFile = values.host === 'claude' ? '.mcp.json' : 'mcp.json';
const config = JSON.parse(await readFile(resolve(root, configFile), 'utf8'));
const server = config.mcpServers['jev-9000'];
const env = {
  ...Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined)),
  ...server.env,
};
if (values.env) env.JEV_9000_ENV_FILE = resolve(values.env);
const transport = new StdioClientTransport({
  command: server.command,
  args: server.args.map(arg => arg.replaceAll('${PLUGIN_ROOT}', root).replaceAll('${CLAUDE_PLUGIN_ROOT}', root)),
  cwd: tmpdir(),
  env,
  stderr: 'inherit',
});
const client = new Client({ name: 'jev-9000-live-smoke', version: '0.1.0' });
try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.ok(tools.some(tool => tool.name === 'jev_evaluate'));
  const questions = {
    approach: {
      type: 'choice',
      instructions: { task: 'Choose the approach best satisfying `goal` and `priority`.' },
      criteria: {
        existing: { approach: 'Use the existing persistent job runner.' },
        browser: { approach: 'Run in the browser until the tab closes.' },
        new: { approach: 'Deploy a second persistent job service.' },
      },
    },
  };
  if (values.mode === 'mixed') {
    questions.continues = {
      type: 'noul', instructions: 'Can the existing persistent job runner continue after the tab closes?',
    };
    questions.burden = {
      type: 'score', instructions: 'Assess added operations work from deploying a second job service.',
      criteria: [{ burden: 'None' }, { burden: 'Configuration in existing service' }, { burden: 'Another deployment and monitoring responsibility' }],
    };
  }
  const args = values.mode === 'compat' ? {
    state: null, questions: { check: { type: 'noul', instructions: null, criteria: null } },
  } : {
    state: {
      goal: 'Imports continue after the browser closes.',
      existing: 'A persistent server-side job runner is already deployed.',
      priority: 'Reuse infrastructure that meets the goal.',
    },
    questions,
  };
  const result = await client.callTool({ name: 'jev_evaluate', arguments: args });
  console.log(JSON.stringify({ hostManifest: values.host, mode: values.mode, result }, null, 2));
  assert.notEqual(result.isError, true, 'Live evaluation failed');
  assert.ok(result.structuredContent);
} finally {
  await client.close();
}
