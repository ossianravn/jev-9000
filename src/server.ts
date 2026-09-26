import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient, loadEnvironment } from './config.ts';
import { toolInput } from './tool-schema.ts';
import { evaluate } from './evaluate.ts';
import { createRecorder, runtimeIdentity } from './recording.ts';

// Configuration errors remain tool errors; discovery must stay available.
try { loadEnvironment(); }
catch (error) { console.error(error instanceof Error ? error.message : 'Environment setup failed.'); }
const identity = await runtimeIdentity();
const record = createRecorder({ runtime: identity });
const server = new McpServer({ name: 'jev-9000', version: identity.plugin_version ?? 'unknown' });
let client: ReturnType<typeof createClient> | undefined;

server.registerTool('jev_evaluate', {
  title: 'Consult JEV 9000',
  description: 'Ask TypeSafe Jev to check propositions (Noul), compare alternatives (Choice), ' +
    'or assess ordered rubrics (Score). Supply the actual relevant context. Questions in a ' +
    'batch are independent. Returns native judgments, model, and usage; no prose rationale. ' +
    'Uses the configured TypeSafe API credential and sends state/questions to TypeSafe.',
  inputSchema: toolInput,
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
}, (input, extra) => evaluate(input, () => client ??= createClient(), extra.signal, record));

server.server.onerror = error => console.error('JEV 9000 MCP error:', error.message);
await server.connect(new StdioServerTransport());
