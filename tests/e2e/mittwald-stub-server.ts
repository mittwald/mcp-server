import http from 'node:http';
import { parse as parseUrl } from 'node:url';
import { AddressInfo } from 'node:net';
import { StringDecoder } from 'node:string_decoder';

export type StubMode = 'online' | 'offline' | 'error';

export interface MittwaldStubConfig {
  issuer?: string;
  defaultTokenResponse?: Record<string, unknown>;
}

export interface TokenRequestLog {
  path: string;
  method: string;
  body: Record<string, string>;
  headers: http.IncomingHttpHeaders;
}

export class MittwaldStubServer {
  private server: http.Server | null = null;
  private port: number | null = null;
  private readonly config: MittwaldStubConfig;
  private mode: StubMode = 'online';
  private lastTokenRequest: TokenRequestLog | null = null;

  constructor(config: MittwaldStubConfig = {}) {
    this.config = config;
  }

  async start(preferredPort?: number): Promise<number> {
    if (this.server) {
      return this.port!;
    }

    this.server = http.createServer(async (req, res) => {
      const parsed = parseUrl(req.url || '/', true);
      const path = parsed.pathname || '/';

      if (path === '/health') {
        this.handleHealth(req, res);
        return;
      }

      if (path === '/.well-known/oauth-authorization-server') {
        this.handleAuthorizationMetadata(req, res);
        return;
      }

      if (path === '/.well-known/oauth-protected-resource') {
        this.handleResourceMetadata(req, res);
        return;
      }

      if (path === '/oauth/token' && req.method === 'POST') {
        await this.handleTokenExchange(req, res, path);
        return;
      }

      if (path === '/oauth/authorize') {
        this.handleAuthorizePlaceholder(req, res);
        return;
      }

      res.statusCode = 404;
      res.end('Not Found');
    });

    await new Promise<void>((resolve) => {
      this.server!.listen(preferredPort ?? 0, '0.0.0.0', () => resolve());
    });

    const address = this.server.address() as AddressInfo;
    this.port = address.port;
    return this.port;
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    this.server = null;
    this.port = null;
    this.lastTokenRequest = null;
  }

  setMode(mode: StubMode) {
    this.mode = mode;
  }

  getPort(): number {
    if (this.port === null) {
      throw new Error('Mittwald stub server is not running');
    }
    return this.port;
  }

  getLastTokenRequest(): TokenRequestLog | null {
    return this.lastTokenRequest;
  }

  private handleHealth(_req: http.IncomingMessage, res: http.ServerResponse) {
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', mode: this.mode }));
  }

  private handleAuthorizationMetadata(req: http.IncomingMessage, res: http.ServerResponse) {
    const base = this.resolveBaseUrl(req);
    const body = {
      issuer: this.config.issuer ?? base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256']
    };
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  }

  private handleResourceMetadata(req: http.IncomingMessage, res: http.ServerResponse) {
    const base = this.resolveBaseUrl(req);
    const body = {
      resource: `${base}/api`,
      authorization_servers: [base]
    };
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  }

  private handleAuthorizePlaceholder(_req: http.IncomingMessage, res: http.ServerResponse) {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end('<html><body><h1>Mittwald Stub Authorization</h1><p>This endpoint is a stub.</p></body></html>');
  }

  private async handleTokenExchange(req: http.IncomingMessage, res: http.ServerResponse, path: string) {
    console.info(`🧪 mittwald-stub: ${req.method} ${path} mode=${this.mode}`);
    if (this.mode === 'offline') {
      res.statusCode = 503;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'temporarily_unavailable', error_description: 'Mittwald stub offline' }));
      return;
    }

    if (this.mode === 'error') {
      console.info('🧪 mittwald-stub: returning error response');
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'bad_gateway', error_description: 'Mittwald upstream error' }));
      return;
    }

    const body = await this.parseFormBody(req);
    this.lastTokenRequest = {
      path,
      method: req.method || 'POST',
      body,
      headers: req.headers
    };

    const payload = {
      access_token: 'mittwald-access-token',
      token_type: 'Bearer',
      expires_in: 1800,
      refresh_token: 'mittwald-refresh-token',
      scope: 'openid offline_access project:read',
      ...this.config.defaultTokenResponse
    };

    console.info('🧪 mittwald-stub: responding with token payload');

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(payload));
  }

  private async parseFormBody(req: http.IncomingMessage): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const decoder = new StringDecoder('utf-8');
      let buffer = '';

      req.on('data', (chunk) => {
        buffer += decoder.write(chunk);
      });

      req.on('end', () => {
        buffer += decoder.end();
        const entries = new URLSearchParams(buffer);
        const result: Record<string, string> = {};
        for (const [key, value] of entries.entries()) {
          result[key] = value;
        }
        resolve(result);
      });

      req.on('error', (error) => reject(error));
    });
  }

  private resolveBaseUrl(req: http.IncomingMessage): string {
    const hostHeader = req.headers['host'];
    if (!hostHeader) {
      return `http://localhost:${this.port ?? 0}`;
    }
    const protocol = this.isTls(req) ? 'https' : 'http';
    return `${protocol}://${hostHeader}`;
  }

  private isTls(req: http.IncomingMessage): boolean {
    return Boolean((req.socket as any).encrypted);
  }
}
