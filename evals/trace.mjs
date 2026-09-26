import { readJsonl } from './io.mjs';

export async function readTrace(path, host) {
  const { records, issues } = await readJsonl(path);
  const calls = [], messages = [], skillReads = [], usage = [];
  const pendingCalls = new Map();
  let sessionId = null, completed = false, failed = false, availableTools = null, initialization = null;
  for (const { value: event, evidence } of records) {
    sessionId ??= event.thread_id ?? event.session_id ?? null;
    if (host === 'codex') {
      if (event.type === 'turn.completed') { completed = true; usage.push(event.usage); }
      if (event.type === 'turn.failed' || event.type === 'error') failed = true;
      const toolItem = event.item;
      if (['item.started', 'item.completed'].includes(event.type) &&
          toolItem?.type === 'mcp_tool_call' && toolItem.tool?.includes('jev_evaluate')) {
        pendingCalls.set(toolItem.id, { id: toolItem.id, arguments: toolItem.arguments,
          result: toolItem.result, error: toolItem.error, evidence,
          completed: event.type === 'item.completed' });
      }
      if (event.type !== 'item.completed') continue;
      const item = event.item;
      if (item?.type === 'agent_message') messages.push({ text: item.text, evidence });
      if (item?.type === 'command_execution' && item.exit_code === 0 &&
          /jev-9000[\\/]SKILL\.md/.test(item.command ?? '')) skillReads.push(evidence);
    } else {
      if (event.type === 'system' && event.subtype === 'init') {
        availableTools = event.tools ?? null;
        initialization = { tools: availableTools, mcp_servers: event.mcp_servers,
          skills: event.skills, plugins: event.plugins, model: event.model, permission_mode: event.permissionMode };
      }
      if (event.type === 'result') {
        completed = event.is_error !== true && event.subtype === 'success';
        failed = !completed;
        usage.push({ ...event.usage, total_cost_usd: event.total_cost_usd, model_usage: event.modelUsage });
        if (event.result) messages.push({ text: event.result, evidence });
      }
      for (const block of event.message?.content ?? []) {
        if (block.type === 'tool_use' && block.name?.includes('jev_evaluate')) {
          calls.push({ id: block.id, arguments: block.input, evidence });
        }
        if (block.type === 'tool_use' && block.name === 'Read' &&
            /jev-9000[\\/]SKILL\.md/.test(block.input?.file_path ?? '')) skillReads.push(evidence);
      }
    }
  }
  calls.push(...pendingCalls.values());
  return {
    session_id: sessionId, complete: completed && !failed && issues.length === 0 &&
      !calls.some(call => call.completed === false),
    failed, issues, calls, messages, skill_reads: skillReads, available_tools: availableTools, initialization,
    usage, usage_semantics: host === 'codex' ? 'per-turn' : 'session-cumulative; use last result per session',
  };
}
