import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  sessionId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function runWithSessionContext<T>(sessionId: string | undefined, fn: () => T): T {
  return requestContext.run({ sessionId }, fn);
}

export function getCurrentSessionId(): string | undefined {
  return requestContext.getStore()?.sessionId;
}

