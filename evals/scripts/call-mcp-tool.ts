#!/usr/bin/env npx tsx

/**
 * Call MCP Tool via HTTP
 *
 * Helper script to call MCP tools on the deployed Fly.io server
 *
 * Usage:
 *   npx tsx call-mcp-tool.ts <tool-name> <params-json>
 */

const MCP_SERVER_URL = 'https://mittwald-mcp-fly2.fly.dev/mcp';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

async function callMCPTool(toolName: string, params: Record<string, any> = {}): Promise<any> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: params,
    },
  };

  console.error(`Calling tool: ${toolName}`);
  console.error(`Parameters:`, JSON.stringify(params, null, 2));

  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const data: MCPResponse = await response.json();

  if (data.error) {
    throw new Error(`MCP error: ${data.error.message}`);
  }

  return data.result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: call-mcp-tool.ts <tool-name> [params-json]');
    process.exit(1);
  }

  const toolName = args[0];
  const params = args[1] ? JSON.parse(args[1]) : {};

  try {
    const result = await callMCPTool(toolName, params);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
