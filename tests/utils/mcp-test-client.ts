import http from 'http';
import { IncomingMessage } from 'http';

export interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id?: number;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | null;
}

/**
 * MCP Test Client for Streaming HTTP transport
 * Based on the existing test scripts but made reusable for Vitest
 */
export class MCPTestClient {
  private url: string;
  private sessionId: string | null = null;

  constructor(url: string = 'http://localhost:3000/mcp') {
    this.url = url;
  }

  async makeRequest(method: string, params: any = {}, isNotification = false): Promise<MCPResponse> {
    const payload: MCPRequest = {
      jsonrpc: "2.0",
      method,
      params
    };
    
    if (!isNotification) {
      payload.id = Math.floor(Math.random() * 1000000);
    }

    const data = JSON.stringify(payload);
    const urlObj = new URL(this.url);

    const options: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Accept': 'application/json, text/event-stream'
      }
    };

    if (this.sessionId) {
      options.headers!['mcp-session-id'] = this.sessionId;
      options.headers!['x-session-id'] = this.sessionId;
    }

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res: IncomingMessage) => {
        let responseData = '';
        
        // Update session ID from response headers
        const sessionHeader = res.headers['mcp-session-id'] || res.headers['x-session-id'];
        if (sessionHeader && typeof sessionHeader === 'string') {
          this.sessionId = sessionHeader;
        }
        
        res.on('data', chunk => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            if (isNotification && responseData.trim() === '') {
              resolve({ jsonrpc: "2.0", result: { success: true }, id: null });
              return;
            }
            
            // Handle Server-Sent Events format
            if (res.headers['content-type']?.includes('text/event-stream')) {
              const lines = responseData.trim().split('\n');
              let jsonData = '';
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  jsonData += line.substring(6);
                }
              }
              
              if (jsonData) {
                const response = JSON.parse(jsonData);
                resolve(response);
              } else {
                resolve({ jsonrpc: "2.0", result: { success: true }, id: null });
              }
            } else {
              const response = JSON.parse(responseData);
              resolve(response);
            }
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Initialize MCP session
   */
  async initialize(clientInfo = { name: 'test-client', version: '1.0.0' }) {
    return this.makeRequest('initialize', {
      protocolVersion: '0.1.0',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        sampling: {}
      },
      clientInfo
    });
  }

  /**
   * List available tools
   */
  async listTools() {
    return this.makeRequest('tools/list');
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: any = {}) {
    return this.makeRequest('tools/call', {
      name,
      arguments: args
    });
  }

  /**
   * List resources
   */
  async listResources() {
    return this.makeRequest('resources/list');
  }

  /**
   * Read a resource
   */
  async readResource(uri: string) {
    return this.makeRequest('resources/read', { uri });
  }

  /**
   * Close the session (for cleanup)
   */
  async close() {
    if (this.sessionId) {
      await this.makeRequest('notifications/cancelled', {}, true);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}