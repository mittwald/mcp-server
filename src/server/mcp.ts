/**
 * @file MCP protocol handler with session management
 * @module server/mcp
 *
 * @remarks
 * This implementation handles multiple concurrent sessions per MCP SDK design:
 * - One Server instance per session
 * - Each Server has its own StreamableHTTPServerTransport
 * - Session isolation and management
 */

import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CreateMessageRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { serverConfig, serverCapabilities } from "../constants/server/server-config.js";
import { sendSamplingRequest } from "../handlers/sampling.js";
import { handleListTools, handleToolCall } from "../handlers/tool-handlers.js";
import { handleListPrompts, handleGetPrompt } from "../handlers/prompt-handlers.js";
import { handleListResources, handleResourceCall } from "../handlers/resource-handlers.js";
import { logger } from "../utils/logger.js";
import { rateLimitMiddleware, validateProtocolVersion, requestSizeLimit } from "./middleware.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { AuthenticatedRequest } from "./auth-types.js";

// Per-session auth context storage
interface SessionAuth {
  /** Mittwald access token propagated via oauth-server */
  accessToken: string;
  refreshToken?: string;
  username: string;
  /** Original OAuth JWT issued by the proxy */
  oauthToken?: string;
  scope?: string;
}

interface SessionInfo {
  server: Server;
  transport: StreamableHTTPServerTransport;
  auth?: SessionAuth;
  createdAt: Date;
  lastAccessed: Date;
}

// Interface for MCP Handler
export interface IMCPHandler {
  setupRoutes(app: express.Application, authMiddleware: express.RequestHandler): Promise<void>;
  getServerForSession(sessionId: string): Server | undefined;
  getAllServers(): Server[];
  getServer(): Server;
  cleanupSession(sessionId: string): void;
  getActiveSessionCount(): number;
  shutdown(): void;
}

/**
 * MCP Handler with per-session server instances
 */
export class MCPHandler implements IMCPHandler {
  private sessions = new Map<string, SessionInfo>();

  // Session cleanup interval (clear sessions older than 1 hour)
  private cleanupInterval: NodeJS.Timeout;
  private readonly SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

  constructor() {
    logger.info('🎯 MCP Handler initializing with session management');
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldSessions();
      },
      5 * 60 * 1000,
    );
    logger.debug('⏰ Session cleanup interval set to 5 minutes');
  }

  /**
   * Creates a new server instance with handlers
   */
  private createServer(sessionId: string, sessionAuth?: SessionAuth): Server {
    // Create new server instance for this session
    const server = new Server(serverConfig, serverCapabilities);

    // Tools
    server.setRequestHandler(ListToolsRequestSchema, (request) => {
      logger.debug(`📋 [${sessionId}] Listing tools`);
      return handleListTools(request);
    });

    server.setRequestHandler(CallToolRequestSchema, (request) => {
      logger.debug(`🔧 [${sessionId}] Calling tool: ${request.params.name}`);

      if (!sessionAuth) {
        throw new Error("Authentication required for tool calls");
      }

      const authInfo: AuthInfo = {
        token: sessionAuth.accessToken,
        clientId: "mcp-client",
        scopes: ["read"],
        extra: {
          userId: sessionAuth.username,
        },
      };

      return handleToolCall(request, { sessionId, authInfo });
    });

    // Prompts
    server.setRequestHandler(ListPromptsRequestSchema, () => {
      logger.debug(`📋 [${sessionId}] Listing prompts`);
      return handleListPrompts();
    });

    server.setRequestHandler(GetPromptRequestSchema, (request) => {
      logger.debug(`📝 [${sessionId}] Getting prompt: ${request.params.name}`);
      return handleGetPrompt(request);
    });

    // Resources
    server.setRequestHandler(ListResourcesRequestSchema, () => {
      logger.debug(`📋 [${sessionId}] Listing resources`);
      return handleListResources();
    });

    server.setRequestHandler(ReadResourceRequestSchema, (request) => {
      logger.debug(`📖 [${sessionId}] Reading resource: ${request.params.uri}`);

      const authInfo = sessionAuth
        ? {
            token: sessionAuth.accessToken,
            clientId: "mcp-client",
            scopes: ["read"],
            extra: {
              userId: sessionAuth.username,
              redditAccessToken: sessionAuth.accessToken,
              redditRefreshToken: sessionAuth.refreshToken,
            },
          }
        : undefined;

      return handleResourceCall(request, authInfo ? { authInfo } : undefined);
    });

    // Sampling
    server.setRequestHandler(CreateMessageRequestSchema, (request) => {
      return sendSamplingRequest(request, { sessionId });
    });

    return server;
  }

  /**
   * Sets up routes for the Express app
   */
  async setupRoutes(
    app: express.Application,
    authMiddleware: express.RequestHandler,
  ): Promise<void> {
    // Apply middleware stack
    const mcpMiddleware = [
      authMiddleware,
      rateLimitMiddleware(60000, 100), // 100 requests per minute
      validateProtocolVersion,
      requestSizeLimit(10 * 1024 * 1024), // 10MB max
    ];

    // Main MCP endpoint
    app.all("/mcp", ...mcpMiddleware, (req, res) =>
      this.handleRequest(req as AuthenticatedRequest, res),
    );
  }

  /**
   * Handles incoming MCP requests with proper session management
   */
  private async handleRequest(req: AuthenticatedRequest, res: express.Response): Promise<void> {
    const startTime = Date.now();
    const clientAddr = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Enhanced request logging
    logger.info(`💬 [${clientAddr}] MCP request: ${req.method} ${req.path}`, {
      userAgent,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      headers: {
        'mcp-session-id': req.headers['mcp-session-id'],
        'x-session-id': req.headers['x-session-id'],
        'authorization': req.headers.authorization ? '[PRESENT]' : '[MISSING]'
      }
    });

    let sessionId: string | undefined;
    try {
      res.header("Access-Control-Expose-Headers", "mcp-session-id, x-session-id");
      sessionId =
        (req.headers["mcp-session-id"] as string) || (req.headers["x-session-id"] as string);
      const isInitRequest = !sessionId;
      let sessionInfo: SessionInfo | undefined;
      if (isInitRequest) {
        // Create new session for initialization
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        logger.info(`🆕 [${clientAddr}] Creating new session: ${sessionId}`);

        // Extract auth info if available
        const mittwaldAccessToken = typeof req.auth?.extra?.mittwaldAccessToken === 'string'
          ? req.auth.extra.mittwaldAccessToken
          : undefined;
        const mittwaldRefreshToken = typeof req.auth?.extra?.mittwaldRefreshToken === 'string'
          ? req.auth.extra.mittwaldRefreshToken
          : undefined;
        const mittwaldScope = typeof req.auth?.extra?.mittwaldScope === 'string'
          ? req.auth.extra.mittwaldScope
          : undefined;

        const sessionAuth = mittwaldAccessToken
          ? {
              accessToken: mittwaldAccessToken,
              refreshToken: mittwaldRefreshToken,
              username: String(req.auth?.extra?.userId || req.auth?.clientId || "unknown"),
              oauthToken: req.auth?.token,
              scope: mittwaldScope,
            }
          : undefined;

        if (sessionAuth) {
          logger.info(`🔐 [${sessionId}] Session authenticated as: ${sessionAuth.username}`, {
            hasMittwaldToken: true,
            hasMittwaldRefresh: !!sessionAuth.refreshToken,
            scope: sessionAuth.scope,
          });
        } else {
          logger.warn(`🔓 [${sessionId}] Mittwald access token missing in JWT claims; session will be unauthenticated`, {
            clientId: req.auth?.clientId,
          });
          logger.info(`🔓 [${sessionId}] Session created without authentication`);
        }

        const server = this.createServer(sessionId, sessionAuth);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId!,
          onsessioninitialized: (sid) => {
            logger.info(`🔗 [${clientAddr}] Session initialized: ${sid}`);
          },
        });
        
        try {
          await server.connect(transport);
          logger.debug(`✅ [${sessionId}] Server connected to transport`);
        } catch (error) {
          logger.error(`❌ [${sessionId}] Failed to connect server to transport:`, error);
          throw error;
        }
        
        sessionInfo = {
          server,
          transport,
          auth: sessionAuth,
          createdAt: new Date(),
          lastAccessed: new Date(),
        };
        this.sessions.set(sessionId, sessionInfo);
        logger.info(`📝 [${clientAddr}] Session ${sessionId} created successfully (Total: ${this.sessions.size})`);
        
        await transport.handleRequest(req, res);
      } else {
        // Find existing session
        if (!sessionId) {
          logger.warn(`⚠️ [${clientAddr}] Request missing session ID`);
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Invalid Request: Missing session ID",
            },
            id: null,
          });
          return;
        }

        sessionInfo = this.sessions.get(sessionId);
        if (!sessionInfo) {
          logger.warn(`❌ [${clientAddr}] Session not found: ${sessionId} (Available: ${Array.from(this.sessions.keys()).join(', ')})`);
          res.status(404).json({
            jsonrpc: "2.0",
            error: {
              code: -32001,
              message: "Session not found",
            },
            id: null,
          });
          return;
        }

        logger.debug(`🔄 [${clientAddr}] Using existing session: ${sessionId}`);
        sessionInfo.lastAccessed = new Date();

        // Update auth if provided
        if (req.auth && req.auth.token && !sessionInfo.auth) {
          const mittwaldAccessToken = typeof req.auth.extra?.mittwaldAccessToken === 'string'
            ? req.auth.extra.mittwaldAccessToken
            : undefined;
          const mittwaldRefreshToken = typeof req.auth.extra?.mittwaldRefreshToken === 'string'
            ? req.auth.extra.mittwaldRefreshToken
            : undefined;
          const mittwaldScope = typeof req.auth.extra?.mittwaldScope === 'string'
            ? req.auth.extra.mittwaldScope
            : undefined;

          if (mittwaldAccessToken) {
            logger.info(`🔐 [${sessionId}] Adding authentication to existing session`);
            sessionInfo.auth = {
              accessToken: mittwaldAccessToken,
              refreshToken: mittwaldRefreshToken,
              username: String(req.auth.extra?.userId || req.auth.clientId || "unknown"),
              oauthToken: req.auth.token,
              scope: mittwaldScope,
            };

          // Recreate server with auth
            logger.debug(`🔄 [${sessionId}] Recreating server with authentication`);
            const newServer = this.createServer(sessionId, sessionInfo.auth);
            await newServer.connect(sessionInfo.transport);
            sessionInfo.server = newServer;
            logger.debug(`✅ [${sessionId}] Server recreated with auth successfully`);
          } else {
            logger.warn(`⚠️ [${sessionId}] Received JWT without Mittwald access token; keeping session unauthenticated`);
          }
        }

        // Let the session's transport handle the request
        await sessionInfo.transport.handleRequest(req, res);
      }

      const duration = Date.now() - startTime;
      logger.info(`✅ [${clientAddr}] MCP request completed in ${duration}ms for session ${sessionId}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorSessionId = sessionId || 'unknown';
      logger.error(`❌ [${clientAddr}] MCP request failed after ${duration}ms`, {
        sessionId: errorSessionId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userAgent,
      });

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal error",
          },
          id: null,
        });
      }
    }
  }

  /**
   * Clean up old sessions
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    let cleaned = 0;
    const sessionSummary: string[] = [];

    for (const [sessionId, sessionInfo] of this.sessions.entries()) {
      const age = now - sessionInfo.lastAccessed.getTime();
      const ageMinutes = Math.floor(age / (60 * 1000));
      
      if (age > this.SESSION_TIMEOUT_MS) {
        // Close server and transport
        try {
          sessionInfo.server.close();
          sessionInfo.transport.close();
          this.sessions.delete(sessionId);
          cleaned++;
          logger.debug(`🧹 Cleaned up expired session: ${sessionId} (age: ${ageMinutes}min)`);
        } catch (error) {
          logger.error(`❌ Failed to cleanup session ${sessionId}:`, error);
        }
      } else {
        sessionSummary.push(`${sessionId}:${ageMinutes}min`);
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Cleaned up ${cleaned} old sessions. Active: ${this.sessions.size} (${sessionSummary.join(', ')})`);
    }
  }

  /**
   * Get the server instance for a specific session
   */
  getServerForSession(sessionId: string): Server | undefined {
    const sessionInfo = this.sessions.get(sessionId);
    return sessionInfo?.server;
  }

  /**
   * Get all active servers
   */
  getAllServers(): Server[] {
    return Array.from(this.sessions.values()).map((info) => info.server);
  }

  /**
   * Get any server instance (for compatibility)
   */
  getServer(): Server {
    const firstSession = this.sessions.values().next().value;
    if (firstSession) {
      return firstSession.server;
    }
    // Create a temporary server if none exist
    return new Server(serverConfig, serverCapabilities);
  }

  /**
   * Clean up session
   */
  cleanupSession(sessionId: string): void {
    const sessionInfo = this.sessions.get(sessionId);
    if (sessionInfo) {
      sessionInfo.server.close();
      sessionInfo.transport.close();
      this.sessions.delete(sessionId);
      logger.debug(`🧹 Cleaned up session: ${sessionId}`);
    }
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Shutdown handler
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all sessions
    for (const sessionInfo of this.sessions.values()) {
      sessionInfo.server.close();
      sessionInfo.transport.close();
    }
    this.sessions.clear();

    logger.info(`🛑 MCP Handler shut down - closed ${this.sessions.size} sessions`);
  }
}

// Global instance for notifications
let mcpHandlerInstance: MCPHandler | null = null;

export function setMCPHandlerInstance(handler: MCPHandler): void {
  mcpHandlerInstance = handler;
}

export function getMCPHandlerInstance(): MCPHandler | null {
  return mcpHandlerInstance;
}
