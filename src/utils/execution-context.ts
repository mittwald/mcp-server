import { AsyncLocalStorage } from 'node:async_hooks';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { RequestId } from '@modelcontextprotocol/sdk/types.js';

export interface RequestContextStore {
  sessionId?: string;
  abortSignal?: AbortSignal;
  /** Server of the session, for server-to-client requests such as elicitation */
  server?: Server;
  /** ID of the client request being handled; server-to-client requests must reference it */
  requestId?: RequestId;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function runWithSessionContext<T>(context: RequestContextStore, fn: () => T): T {
  return requestContext.run(context, fn);
}

export function getCurrentSessionId(): string | undefined {
  return requestContext.getStore()?.sessionId;
}

export function getCurrentAbortSignal(): AbortSignal | undefined {
  return requestContext.getStore()?.abortSignal;
}

export function getCurrentServer(): Server | undefined {
  return requestContext.getStore()?.server;
}

export function getCurrentRequestId(): RequestId | undefined {
  return requestContext.getStore()?.requestId;
}
