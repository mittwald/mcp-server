import { vi } from 'vitest';
import type { MittwaldTokenResponse } from '../../packages/oauth-bridge/src/state/state-store.js';

type FetchArgs = [RequestInfo | URL, RequestInit | undefined];

export interface TokenRequestLog {
  url: string;
  body: Record<string, string>;
  init?: RequestInit;
}

type QueueHandler = (request: TokenRequestLog) => Promise<Response>;

const DEFAULT_TOKEN_RESPONSE: MittwaldTokenResponse = {
  access_token: 'mittwald-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'mittwald-refresh-token',
  scope: 'openid offline_access'
};

export class MittwaldStub {
  private readonly tokenUrl: string;
  private readonly queue: QueueHandler[] = [];
  private readonly requests: TokenRequestLog[] = [];
  private fetchSpy: ReturnType<typeof vi.spyOn> | null = null;
  private readonly originalFetch = globalThis.fetch.bind(globalThis);

  constructor(options: { tokenUrl: string }) {
    this.tokenUrl = options.tokenUrl;
  }

  install() {
    if (this.fetchSpy) {
      return;
    }

    this.fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (...args: FetchArgs) => {
      const [input, init] = args;
      const url = this.resolveUrl(input);

      if (url !== this.tokenUrl) {
        return this.originalFetch(input as RequestInfo, init);
      }

      const request = this.recordRequest(url, init);
      const handler = this.queue.shift() ?? this.defaultSuccessHandler();
      return handler(request);
    });
  }

  restore() {
    if (this.fetchSpy) {
      this.fetchSpy.mockRestore();
      this.fetchSpy = null;
    }
    this.queue.length = 0;
    this.requests.length = 0;
  }

  reset() {
    this.queue.length = 0;
    this.requests.length = 0;
  }

  enqueueTokenSuccess(partial?: Partial<MittwaldTokenResponse>) {
    this.queue.push(async () => this.buildJsonResponse({ ...DEFAULT_TOKEN_RESPONSE, ...partial }, 200));
  }

  enqueueTokenError(status: number, body: Record<string, unknown>) {
    this.queue.push(async () => this.buildJsonResponse(body, status));
  }

  enqueueNetworkError(error?: Error) {
    const networkError = error ?? new Error('Mittwald token endpoint unreachable');
    this.queue.push(async () => Promise.reject(networkError));
  }

  getLastTokenRequest(): TokenRequestLog | undefined {
    return this.requests[this.requests.length - 1];
  }

  getAllTokenRequests(): TokenRequestLog[] {
    return [...this.requests];
  }

  private recordRequest(url: string, init?: RequestInit): TokenRequestLog {
    const body: Record<string, string> = {};
    const rawBody = init?.body;

    if (typeof rawBody === 'string') {
      for (const [key, value] of new URLSearchParams(rawBody)) {
        body[key] = value;
      }
    } else if (rawBody instanceof URLSearchParams) {
      for (const [key, value] of rawBody.entries()) {
        body[key] = value;
      }
    }

    const log: TokenRequestLog = { url, body, init };
    this.requests.push(log);
    return log;
  }

  private resolveUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') {
      return input;
    }
    if (input instanceof URL) {
      return input.toString();
    }
    const request = input as Request;
    return request.url;
  }

  private defaultSuccessHandler(): QueueHandler {
    return async () => this.buildJsonResponse(DEFAULT_TOKEN_RESPONSE, 200);
  }

  private buildJsonResponse(payload: unknown, status: number): Response {
    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        'content-type': 'application/json'
      }
    });
  }
}

export function createMittwaldStub(options: { tokenUrl: string }): MittwaldStub {
  const stub = new MittwaldStub(options);
  stub.install();
  return stub;
}
