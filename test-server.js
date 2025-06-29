#!/usr/bin/env node

const http = require('http');

class MCPTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.sessionId = null;
  }

  async request(method, params = {}, id = null) {
    const payload = {
      jsonrpc: "2.0",
      method,
      params,
      id: id || Math.floor(Math.random() * 1000000)
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(this.baseUrl, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            // Handle SSE format
            if (data.startsWith('event: message\ndata: ')) {
              const jsonData = data.split('data: ')[1];
              resolve(JSON.parse(jsonData));
            } else {
              resolve(JSON.parse(data));
            }
          } catch (err) {
            console.log('Raw response:', data);
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  async initialize() {
    console.log('🔌 Initializing MCP connection...');
    const response = await this.request('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "mittwald-test-client",
        version: "1.0.0"
      }
    });

    if (response.error) {
      throw new Error(`Initialize failed: ${response.error.message}`);
    }

    console.log('✅ Connected to:', response.result.serverInfo.name);
    console.log('📋 Server capabilities:', Object.keys(response.result.capabilities));
    return response.result;
  }

  async listTools() {
    console.log('\n🛠️ Listing available tools...');
    const response = await this.request('tools/list');
    
    if (response.error) {
      throw new Error(`List tools failed: ${response.error.message}`);
    }

    const tools = response.result.tools;
    console.log(`📊 Found ${tools.length} tools`);
    
    // Show tool categories
    const categories = {};
    tools.forEach(tool => {
      const category = tool.name.split('_')[1] || 'other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(tool.name);
    });

    console.log('\n📂 Tool categories:');
    Object.entries(categories).forEach(([cat, toolList]) => {
      console.log(`  ${cat}: ${toolList.length} tools`);
    });

    return tools;
  }

  async callTool(toolName, args = {}) {
    console.log(`\n🔧 Testing tool: ${toolName}`);
    console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));
    
    const response = await this.request('tools/call', {
      name: toolName,
      arguments: args
    });

    if (response.error) {
      console.log(`❌ Tool failed: ${response.error.message}`);
      return response;
    }

    console.log(`✅ Tool succeeded`);
    console.log(`📄 Response:`, JSON.stringify(response.result, null, 2));
    return response;
  }
}

async function runTests() {
  try {
    const tester = new MCPTester('http://localhost:3000/mcp');
    
    // Initialize connection
    await tester.initialize();
    
    // List tools
    const tools = await tester.listTools();
    
    // Test basic Mittwald tools
    const testTools = [
      { name: 'mittwald_server_list', args: { output: 'json' } },
      { name: 'mittwald_project_list', args: { output: 'json' } },
      { name: 'mittwald_user_get', args: { output: 'json' } }
    ];

    for (const test of testTools) {
      const tool = tools.find(t => t.name === test.name);
      if (tool) {
        await tester.callTool(test.name, test.args);
      } else {
        console.log(`⚠️ Tool not found: ${test.name}`);
      }
    }

    console.log('\n🎉 Testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();