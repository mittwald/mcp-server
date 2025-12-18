import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  sessionId?: string;
  abortSignal?: AbortSignal;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function runWithSessionContext<T>(
  sessionId: string | undefined,
  fn: () => T,
  abortSignal?: AbortSignal
): T {
  return requestContext.run({ sessionId, abortSignal }, fn);
}

export function getCurrentSessionId(): string | undefined {
  return requestContext.getStore()?.sessionId;
}

export function getCurrentAbortSignal(): AbortSignal | undefined {
  return requestContext.getStore()?.abortSignal;
}
