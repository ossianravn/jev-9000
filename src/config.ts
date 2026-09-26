import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { TypeSafeClient } from '@typesafe-ai/sdk';

export function loadEnvironment(): void {
  const explicit = process.env.JEV_9000_ENV_FILE;
  const path = explicit ?? fileURLToPath(new URL('../.env', import.meta.url));
  try {
    loadEnvFile(path);
  } catch (error) {
    if (!explicit && error instanceof Error && 'code' in error && error.code === 'ENOENT') return;
    throw new Error('Cannot read the JEV 9000 .env file. Check JEV_9000_ENV_FILE and file access.', {
      cause: error,
    });
  }
}

export function createClient(): TypeSafeClient {
  loadEnvironment();
  if (!process.env.TYPESAFE_API_KEY?.trim()) {
    throw new Error(
      'Set TYPESAFE_API_KEY in the MCP process environment or set JEV_9000_ENV_FILE ' +
      'to your absolute .env path, then restart the host.',
    );
  }
  return new TypeSafeClient({
    defaultModel: process.env.TYPESAFE_DEFAULT_MODEL?.trim() || process.env.TYPESAFE_MODEL?.trim(),
    // SDK info/debug output must never enter the stdio protocol stream.
    logger: {
      debug: (...args) => console.error(...args),
      info: (...args) => console.error(...args),
      warn: (...args) => console.error(...args),
      error: (...args) => console.error(...args),
    },
  });
}
