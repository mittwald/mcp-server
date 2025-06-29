#!/usr/bin/env node

import http from 'http';

/**
 * Simple MCP client that properly handles Streaming HTTP transport with sessions
 */
class MCPStreamingClient {
  constructor(url) {
    this.url = url;
    this.sessionId = null;
  }

  async makeRequest(method, params = {}, isNotification = false) {
    const payload = {
      jsonrpc: "2.0",
      method,
      params
    };
    
    // Notifications don't have an ID
    if (!isNotification) {
      payload.id = Math.floor(Math.random() * 1000000);
    }

    const data = JSON.stringify(payload);
    const urlObj = new URL(this.url);

    const options = {
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

    // Add session ID if we have one
    if (this.sessionId) {
      options.headers['mcp-session-id'] = this.sessionId;
      options.headers['x-session-id'] = this.sessionId;
    }

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let responseData = '';
        
        // Capture session ID from response headers
        if (res.headers['mcp-session-id']) {
          this.sessionId = res.headers['mcp-session-id'];
        } else if (res.headers['x-session-id']) {
          this.sessionId = res.headers['x-session-id'];
        }
        
        res.on('data', chunk => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            // For notifications, we don't expect a response
            if (isNotification && responseData.trim() === '') {
              resolve({ success: true });
              return;
            }
            
            // Handle Server-Sent Events format (Streaming HTTP)
            if (res.headers['content-type']?.includes('text/event-stream')) {
              // Parse SSE format
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
                resolve({ success: true });
              }
            } else {
              // Regular JSON response
              const response = JSON.parse(responseData);
              resolve(response);
            }
          } catch (err) {
            console.log('Raw response:', responseData);
            console.log('Response headers:', res.headers);
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

async function testMCPConnection() {
  const client = new MCPStreamingClient('http://localhost:3000/mcp');

  try {
    console.log('🔌 Testing MCP Streaming HTTP connection...\n');

    // Step 1: Initialize connection
    console.log('1️⃣ Initializing connection...');
    const initResponse = await client.makeRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: "mcp-test-client",
        version: "1.0.0"
      }
    });

    if (initResponse.error) {
      throw new Error(`Initialize failed: ${initResponse.error.message}`);
    }

    console.log('✅ Initialized successfully');
    console.log(`   Session ID: ${client.sessionId}`);
    console.log(`   Server: ${initResponse.result.serverInfo.name} v${initResponse.result.serverInfo.version}`);
    console.log(`   Protocol: ${initResponse.result.protocolVersion}\n`);

    // Send initialized notification
    console.log('2️⃣ Sending initialized notification...');
    await client.makeRequest('notifications/initialized', {}, true);
    console.log('✅ Notification sent\n');

    // Step 2: List tools
    console.log('3️⃣ Listing available tools...');
    const toolsResponse = await client.makeRequest('tools/list', {});

    if (toolsResponse.error) {
      throw new Error(`Tools list failed: ${toolsResponse.error.message}`);
    }

    const tools = toolsResponse.result.tools;
    console.log(`✅ Found ${tools.length} tools\n`);
    
    // Display first 10 Mittwald tools
    const mittwaldTools = tools.filter(t => t.name.startsWith('mittwald_'));
    console.log(`📋 Mittwald tools (showing first 10):`);
    mittwaldTools.slice(0, 10).forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    
    if (mittwaldTools.length > 10) {
      console.log(`   ... and ${mittwaldTools.length - 10} more`);
    }

    console.log('\n✅ MCP connection test successful!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMCPConnection();