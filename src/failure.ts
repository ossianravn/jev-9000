import { APIConnectionError, APIError, APITimeoutError, APIUserAbortError } from '@typesafe-ai/sdk';
import { ZodError } from 'zod';
import { scrub } from './recording.ts';

export type Stage = 'input' | 'setup' | 'provider' | 'response';

export function describeFailure(error: unknown, stage: Stage) {
  let message = error instanceof Error ? error.message : 'Unexpected evaluation failure.';
  let category: string = stage;
  if (error instanceof ZodError) {
    message = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  } else if (error instanceof APIError) {
    category = 'http';
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
    category = 'cancelled';
    message = 'The host cancelled the TypeSafe evaluation.';
  } else if (error instanceof APITimeoutError || error instanceof APIConnectionError) {
    category = error instanceof APITimeoutError ? 'timeout' : 'connection';
    message += ' Check network access to TypeSafe and try again.';
  }
  return {
    stage, category, message: scrub(message),
    http_status: error instanceof APIError ? error.status : null,
    request_id: error instanceof APIError ? error.requestId ?? null : null,
  };
}
