import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readJson, treeIdentity } from './io.mjs';

export async function inspectPlugin(root, host) {
  const descriptor = await readJson(resolve(root, host === 'codex' ? 'mcp.json' : '.mcp.json'));
  const config = descriptor.mcpServers['jev-9000'];
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args.map(arg => arg.replaceAll('${PLUGIN_ROOT}', root).replaceAll('${CLAUDE_PLUGIN_ROOT}', root)),
    env: { ...process.env, ...config.env }, stderr: 'pipe',
  });
  let diagnostics = '';
  transport.stderr?.on('data', chunk => { diagnostics += chunk.toString(); });
  const client = new Client({ name: 'jev-evals-discovery', version: '1.0.0' });
  try {
    await client.connect(transport);
    const result = await client.listTools();
    return { method: 'installed descriptor MCP discovery; no evaluation',
      tools: result.tools, identity: await treeIdentity(root), diagnostics };
  } finally { await client.close(); }
}
