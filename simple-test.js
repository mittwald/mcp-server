#!/usr/bin/env node

import http from 'http';

// Simple MCP client for testing
class SimpleMCPClient {
  constructor(url) {
    this.url = url;
    this.sessionId = null;
    this.cookies = [];
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

    // Add cookies if we have them
    if (this.cookies.length > 0) {
      options.headers['Cookie'] = this.cookies.join('; ');
    }

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let responseData = '';
        
        // Store cookies from response
        if (res.headers['set-cookie']) {
          this.cookies = res.headers['set-cookie'].map(cookie => cookie.split(';')[0]);
        }
        
        res.on('data', chunk => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            // For notifications, we don't expect a response
            if (isNotification) {
              resolve({ success: true });
              return;
            }
            
            // Handle Server-Sent Events format
            if (responseData.startsWith('event: message\ndata: ')) {
              const jsonData = responseData.split('data: ')[1];
              const response = JSON.parse(jsonData);
              resolve(response);
            } else if (responseData.trim() === '') {
              // Empty response for notifications
              resolve({ success: true });
            } else {
              const response = JSON.parse(responseData);
              resolve(response);
            }
          } catch (err) {
            console.log('Raw response:', responseData);
            reject(new Error(`Failed to parse JSON: ${err.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

async function testMittwaldMCP() {
  console.log('🧪 Testing Mittwald MCP Server at http://localhost:3000/mcp\n');

  const client = new SimpleMCPClient('http://localhost:3000/mcp');

  try {
    // Step 1: Initialize connection
    console.log('🔌 Initializing MCP connection...');
    const initResponse = await client.makeRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "mittwald-test-client",
        version: "1.0.0"
      }
    });

    if (initResponse.error) {
      throw new Error(`Initialize failed: ${initResponse.error.message}`);
    }

    console.log('✅ Connected to:', initResponse.result.serverInfo.name);
    console.log('📋 Server capabilities:', Object.keys(initResponse.result.capabilities));

    // Send initialized notification (required by some MCP servers)
    console.log('📡 Sending initialized notification...');
    const notifyResponse = await client.makeRequest('notifications/initialized', {}, true);
    console.log('📡 Notification response:', notifyResponse);

    // Step 2: Try calling tools directly since we know they exist from logs
    console.log('\n🖥️ Testing server list directly...');
    const serverResponse = await client.makeRequest('tools/call', {
      name: 'mittwald_server_list',
      arguments: { output: 'json' }
    });

    if (serverResponse.error) {
      console.log(`❌ Server list failed: ${serverResponse.error.message}`);
    } else {
      console.log('✅ Server list succeeded');
      console.log('📋 Response content:', JSON.stringify(serverResponse.result.content, null, 2));
    }

    // Step 3: Test project list directly 
    console.log('\n📁 Testing project list directly...');
    const projectResponse = await client.makeRequest('tools/call', {
      name: 'mittwald_project_list',
      arguments: { output: 'json' }
    });

    if (projectResponse.error) {
      console.log(`❌ Project list failed: ${projectResponse.error.message}`);
    } else {
      console.log('✅ Project list succeeded');
      console.log('📋 Response content:', JSON.stringify(projectResponse.result.content, null, 2));
    }

    // Step 4: Test user info directly
    console.log('\n👤 Testing user info directly...');
    const userResponse = await client.makeRequest('tools/call', {
      name: 'mittwald_user_get',
      arguments: { output: 'json' }
    });

    if (userResponse.error) {
      console.log(`❌ User info failed: ${userResponse.error.message}`);
    } else {
      console.log('✅ User info succeeded');
      console.log('📋 Response content:', JSON.stringify(userResponse.result.content, null, 2));
    }

    console.log('\n🎉 Testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMittwaldMCP();