/**
 * @file Response size logging middleware for MCP server
 * @module server/response-logger
 * 
 * @remarks
 * This module provides middleware to log response sizes to help diagnose
 * issues where large responses might be causing client crashes.
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Middleware to log response sizes for MCP endpoints
 * 
 * @remarks
 * This middleware intercepts responses to:
 * - Log the response size in bytes
 * - Log the response size in human-readable format
 * - Track response times
 * - Identify potentially problematic large responses
 */
export function responseLoggerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    const originalWrite = res.write;
    const originalEnd = res.end;

    let responseSize = 0;
    let chunks: Buffer[] = [];

    // Helper to format bytes to human-readable
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper to log response info
    const logResponse = (size: number, data?: any) => {
      const duration = Date.now() - startTime;
      const sessionId = req.headers['mcp-session-id'] || req.headers['x-session-id'] || 'unknown';
      
      // Try to extract the JSON-RPC method from the request or response
      let method = 'unknown';
      if (req.path.includes('/mcp')) {
        if (req.body?.method) {
          method = req.body.method;
        } else if (data && typeof data === 'object') {
          // For tool lists
          if (data.tools && Array.isArray(data.tools)) {
            method = 'tools/list';
          }
          // For tool results
          else if (data.content && Array.isArray(data.content)) {
            method = 'tools/call';
          }
          // For errors
          else if (data.error) {
            method = 'error';
          }
        }
      } else {
        method = req.path;
      }

      const logData = {
        method,
        sessionId: req.path.includes('/mcp') ? sessionId : 'n/a',
        size,
        sizeFormatted: formatBytes(size),
        duration: `${duration}ms`,
        path: req.path,
        statusCode: res.statusCode,
      };

      // Log with appropriate level based on size
      if (size > 500 * 1024) { // > 500KB
        console.error('[WARN] ⚠️  Large response detected', JSON.stringify(logData));
      } else if (size > 100 * 1024) { // > 100KB
        console.error('[INFO] 📊 Response size', JSON.stringify(logData));
      } else if (req.path.includes('/mcp') || size > 10 * 1024) { // Always log MCP or > 10KB
        console.error('[INFO] 📊 Response size', JSON.stringify(logData));
      } else {
        console.error('[DEBUG] 📊 Response size', JSON.stringify(logData));
      }

      // Special logging for tool lists
      if (method === 'tools/list' && data?.tools) {
        console.error(`[INFO] 🔧 Tool list response: ${data.tools.length} tools, ${formatBytes(size)}`);
      }
    };

    // Override write to capture streaming responses
    res.write = function(chunk: any, ...args: any[]): boolean {
      if (chunk) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(buffer);
        responseSize += buffer.length;
      }
      return originalWrite.apply(res, [chunk, ...args] as any);
    };

    // Override end to log final size
    res.end = function(chunk?: any, ...args: any[]): Response {
      if (chunk) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(buffer);
        responseSize += buffer.length;
      }

      // Try to parse the response data if it's JSON
      let responseData;
      try {
        const fullResponse = Buffer.concat(chunks).toString('utf8');
        if (fullResponse && fullResponse.trim().startsWith('{')) {
          responseData = JSON.parse(fullResponse);
        }
      } catch (e) {
        // Not JSON or parsing failed
      }

      logResponse(responseSize, responseData);
      return originalEnd.apply(res, [chunk, ...args] as any);
    };

    // Override send for non-streaming responses
    res.send = function(data: any): Response {
      if (data) {
        const size = Buffer.byteLength(
          typeof data === 'string' ? data : JSON.stringify(data)
        );
        responseSize = size;
        logResponse(size, typeof data === 'object' ? data : undefined);
      }
      return originalSend.apply(res, [data] as any);
    };

    // Override json for JSON responses
    res.json = function(data: any): Response {
      if (data) {
        const jsonStr = JSON.stringify(data);
        responseSize = Buffer.byteLength(jsonStr);
        logResponse(responseSize, data);
      }
      return originalJson.apply(res, [data] as any);
    };

    // Debug log to verify middleware is running
    console.log(`[Response Logger] Middleware attached for ${req.method} ${req.path}`);
    
    next();
  };
}