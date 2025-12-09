#!/usr/bin/env node
/**
 * Generate backup status report using MCP tools
 */

const MCP_URL = 'https://mittwald-mcp-fly2.fly.dev/mcp';
const TOKEN = '699b1b90-5476-44b8-a504-f491ea771814:0VtMXEbKm-Ub7pLWGc-VCbDJrkzC41SNMSo1AWJsDMI:mittwald_a';

let sessionId = null;

/**
 * Parse SSE stream or JSON response
 */
async function parseResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const messages = [];
  let currentEvent = null;
  let currentData = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
  }

  // Check if it's plain JSON (error response or non-SSE)
  if (buffer.trim().startsWith('{')) {
    try {
      return [JSON.parse(buffer)];
    } catch (e) {
      console.error('Failed to parse JSON response:', buffer.substring(0, 200));
      return [];
    }
  }

  // Parse as SSE
  const lines = buffer.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('event: ')) {
      currentEvent = line.substring(7).trim();
    } else if (line.startsWith('data: ')) {
      currentData = line.substring(6);
    } else if (line === '' || line === '\r') {
      // Empty line indicates end of message
      if (currentData) {
        try {
          const parsed = JSON.parse(currentData);

          if (currentEvent === 'endpoint') {
            sessionId = parsed.sessionId || parsed.url?.split('/').pop();
            console.log('Session endpoint:', parsed);
          } else if (currentEvent === 'message') {
            messages.push(parsed);
          } else {
            // Default case - assume it's a message
            messages.push(parsed);
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', currentData.substring(0, 100));
        }
        currentData = '';
        currentEvent = null;
      }
    }
  }

  return messages;
}

/**
 * Call an MCP tool
 */
async function callMcpTool(toolName, args = {}) {
  const url = sessionId ? `${MCP_URL}/${sessionId}` : MCP_URL;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  const messages = await parseResponse(response);

  // Find the result message
  for (const msg of messages) {
    if (msg.error) {
      throw new Error(`MCP Error: ${msg.error.message || JSON.stringify(msg.error)}`);
    }
    if (msg.result) {
      return msg.result;
    }
  }

  throw new Error('No result found in MCP response');
}

/**
 * Initialize MCP session
 */
async function initializeMCP() {
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'init-1',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: 'backup-report-cli',
          version: '1.0.0'
        }
      },
    }),
  });

  const messages = await parseResponse(response);

  console.log('Init messages:', JSON.stringify(messages, null, 2));

  for (const msg of messages) {
    if (msg.error) {
      throw new Error(`MCP Init Error: ${msg.error.message || JSON.stringify(msg.error)}`);
    }
  }

  console.log('Session ID after init:', sessionId);

  return true;
}

/**
 * Main execution
 */
async function main() {
  console.log('Mittwald Backup Status Report');
  console.log('='.repeat(60));
  console.log();

  try {
    // Initialize MCP
    console.log('Initializing MCP server...');
    await initializeMCP();
    console.log('Server initialized successfully');
    if (sessionId) {
      console.log(`Session ID: ${sessionId}`);
    }
    console.log();

    // Step 1: List all projects
    console.log('Fetching projects...');
    const projectsResult = await callMcpTool('mittwald_project_list_projects', { limit: 100 });

    if (projectsResult.content && projectsResult.content[0]) {
      const content = projectsResult.content[0];
      if (content.type === 'text') {
        console.log(content.text);
        console.log();
      }
    }

    // Step 2: List all databases
    console.log('Fetching all databases...');
    const databasesResult = await callMcpTool('mittwald_database_list_mysql_databases', { limit: 100 });

    if (databasesResult.content && databasesResult.content[0]) {
      const content = databasesResult.content[0];
      if (content.type === 'text') {
        console.log(content.text);
        console.log();
      }
    }

    console.log('='.repeat(60));
    console.log('Report generation complete.');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

main().catch(console.error);
