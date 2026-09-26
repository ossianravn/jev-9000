import {
  APIConnectionError, APIError, APITimeoutError, APIUserAbortError,
} from '@typesafe-ai/sdk';
import type { TypeSafeClient } from '@typesafe-ai/sdk';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { evaluationInput, validateResult } from './contract.ts';

function errorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : 'Unexpected evaluation failure.';
  if (error instanceof ZodError) {
    message = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  } else if (error instanceof APIError) {
    if (error.requestId) message += ` (request ${error.requestId})`;
    if (error.status === 401 || error.status === 403) {
      message += ' Check TYPESAFE_API_KEY and its access in the MCP process configuration.';
    } else if (error.status === 400 || error.status === 422) {
      message += ' Correct the indicated request field and try again.';
    } else if (error.status === 404) {
      message += ' Check the configured model and TypeSafe endpoint.';
    } else if (error.status === 429 || error.status >= 500) {
      message += ' TypeSafe could not complete this evaluation; try again when available.';
    }
  } else if (error instanceof APIUserAbortError) {
    message = 'The host cancelled the TypeSafe evaluation.';
  } else if (error instanceof APITimeoutError || error instanceof APIConnectionError) {
    message += ' Check network access to TypeSafe and try again.';
  }
  const key = process.env.TYPESAFE_API_KEY?.trim();
  if (key) message = message.replaceAll(key, '[redacted]');
  return message.replace(/Bearer\s+[^\s"',;]+/gi, 'Bearer [redacted]');
}

export async function evaluate(
  value: unknown,
  getClient: () => Pick<TypeSafeClient, 'systemOne'>,
  signal?: AbortSignal,
): Promise<CallToolResult> {
  try {
    const input = evaluationInput.parse(value);
    const response = await getClient().systemOne(input, { signal });
    const result = validateResult(response, input.questions);
    return {
      structuredContent: result,
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Jev evaluation failed: ${errorMessage(error)}` }],
    };
  }
}
