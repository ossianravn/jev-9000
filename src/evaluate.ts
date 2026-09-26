import { randomUUID } from 'node:crypto';
import type { TypeSafeClient } from '@typesafe-ai/sdk';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { evaluationInput, validateResult } from './contract.ts';
import { describeFailure } from './failure.ts';
import type { Stage } from './failure.ts';
import type { RecordSink } from './recording.ts';

export async function evaluate(
  value: unknown,
  getClient: () => Pick<TypeSafeClient, 'systemOne'> & Partial<Pick<TypeSafeClient, 'defaultModel'>>,
  signal?: AbortSignal,
  record?: RecordSink,
): Promise<CallToolResult> {
  const callId = randomUUID();
  await record?.({ event: 'consultation.started', call_id: callId, input: value });
  const started = performance.now();
  let stage: Stage = 'input';
  let effectiveModel: string | null = null;
  const complete = (fields: Record<string, unknown>) => record?.({
    event: 'consultation.completed', call_id: callId,
    duration_ms: performance.now() - started, effective_model: effectiveModel, ...fields,
  });
  try {
    const input = evaluationInput.parse(value);
    effectiveModel = input.model ?? null;
    stage = 'setup';
    const client = getClient();
    effectiveModel = input.model ?? client.defaultModel ?? null;
    stage = 'provider';
    const response = await client.systemOne(input, { signal });
    stage = 'response';
    const result = validateResult(response, input.questions);
    await complete({ status: 'success', result });
    return {
      structuredContent: result,
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    const failure = describeFailure(error, stage);
    await complete({ status: 'failure', failure });
    return {
      isError: true,
      content: [{ type: 'text', text: `Jev evaluation failed: ${failure.message}` }],
    };
  }
}
