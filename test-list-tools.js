#!/usr/bin/env node

import http from 'http';

/**
 * MCP client for Streaming HTTP transport
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

    if (this.sessionId) {
      options.headers['mcp-session-id'] = this.sessionId;
      options.headers['x-session-id'] = this.sessionId;
    }

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let responseData = '';
        
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
            if (isNotification && responseData.trim() === '') {
              resolve({ success: true });
              return;
            }
            
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
                resolve({ success: true });
              }
            } else {
              const response = JSON.parse(responseData);
              resolve(response);
            }
          } catch (err) {
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

async function listAllTools() {
  const client = new MCPStreamingClient('http://localhost:3000/mcp');

  try {
    console.log('📋 Mittwald MCP Server - Tool Listing\n');
    console.log('========================================\n');

    // Initialize connection
    const initResponse = await client.makeRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: "tool-lister",
        version: "1.0.0"
      }
    });

    if (initResponse.error) {
      throw new Error(`Initialize failed: ${initResponse.error.message}`);
    }

    // Send initialized notification
    await client.makeRequest('notifications/initialized', {}, true);

    // List tools
    const toolsResponse = await client.makeRequest('tools/list', {});

    if (toolsResponse.error) {
      throw new Error(`Tools list failed: ${toolsResponse.error.message}`);
    }

    const tools = toolsResponse.result.tools;
    console.log(`Total tools available: ${tools.length}\n`);
    
    // Group tools by category
    const categories = {};
    
    tools.forEach(tool => {
      const parts = tool.name.split('_');
      if (parts.length >= 2 && parts[0] === 'mittwald') {
        const category = parts[1];
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(tool);
      }
    });
    
    // Display tools by category
    const sortedCategories = Object.keys(categories).sort();
    
    sortedCategories.forEach(category => {
      console.log(`\n📁 ${category.toUpperCase()} (${categories[category].length} tools)`);
      console.log('─'.repeat(50));
      
      const sortedTools = categories[category].sort((a, b) => a.name.localeCompare(b.name));
      
      sortedTools.forEach(tool => {
        const shortName = tool.name.replace('mittwald_', '');
        console.log(`  • ${shortName}`);
        if (tool.description) {
          console.log(`    ${tool.description.substring(0, 80)}${tool.description.length > 80 ? '...' : ''}`);
        }
      });
    });
    
    // Summary
    console.log('\n\n📊 Summary');
    console.log('─'.repeat(50));
    sortedCategories.forEach(category => {
      console.log(`  ${category}: ${categories[category].length} tools`);
    });
    
    console.log('\n✅ Tool listing complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllTools();