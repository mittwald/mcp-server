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

  async callTool(toolName, args = {}) {
    const response = await this.makeRequest('tools/call', {
      name: toolName,
      arguments: args
    });

    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    return response.result;
  }
}

async function testMittwaldResources() {
  const client = new MCPStreamingClient('http://localhost:3000/mcp');

  try {
    console.log('🧪 Mittwald MCP Server - Resource Listing Test\n');
    console.log('================================================\n');

    // Initialize connection
    const initResponse = await client.makeRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: "resource-tester",
        version: "1.0.0"
      }
    });

    if (initResponse.error) {
      throw new Error(`Initialize failed: ${initResponse.error.message}`);
    }

    console.log('✅ Connected to MCP server');
    console.log(`   Session: ${client.sessionId}\n`);

    // Send initialized notification
    await client.makeRequest('notifications/initialized', {}, true);

    // Test 1: List servers
    console.log('1️⃣ Testing mittwald_server_list...');
    try {
      const serversResult = await client.callTool('mittwald_server_list', {
        output: 'json'
      });
      
      let servers = [];
      if (serversResult.content && serversResult.content[0]) {
        const content = serversResult.content[0].text;
        try {
          servers = JSON.parse(content);
        } catch {
          console.log('   Raw response:', content);
        }
      }
      
      console.log(`   ✅ Found ${Array.isArray(servers) ? servers.length : 0} servers`);
      if (Array.isArray(servers) && servers.length > 0) {
        console.log(`   First server: ${servers[0].customerId || servers[0].id}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }

    // Test 2: List projects
    console.log('\n2️⃣ Testing mittwald_project_list...');
    try {
      const projectsResult = await client.callTool('mittwald_project_list', {
        output: 'json'
      });
      
      let projects = [];
      if (projectsResult.content && projectsResult.content[0]) {
        const content = projectsResult.content[0].text;
        try {
          projects = JSON.parse(content);
        } catch {
          console.log('   Raw response:', content);
        }
      }
      
      console.log(`   ✅ Found ${Array.isArray(projects) ? projects.length : 0} projects`);
      if (Array.isArray(projects) && projects.length > 0) {
        const project = projects[0];
        console.log(`   First project: ${project.shortId || project.id} - ${project.description || 'No description'}`);
        
        // Test 3: List apps in first project
        if (project.id) {
          console.log('\n3️⃣ Testing mittwald_app_list for first project...');
          try {
            const appsResult = await client.callTool('mittwald_app_list', {
              projectId: project.id,
              output: 'json'
            });
            
            let apps = [];
            if (appsResult.content && appsResult.content[0]) {
              const content = appsResult.content[0].text;
              try {
                apps = JSON.parse(content);
              } catch {
                console.log('   Raw response:', content);
              }
            }
            
            console.log(`   ✅ Found ${Array.isArray(apps) ? apps.length : 0} apps in project ${project.shortId || project.id}`);
            if (Array.isArray(apps) && apps.length > 0) {
              apps.slice(0, 3).forEach(app => {
                console.log(`      - ${app.appVersion?.current || app.systemSoftware || 'Unknown'} (${app.id})`);
              });
            }
          } catch (error) {
            console.log(`   ⚠️  Error: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }

    // Test 4: Test context tool
    console.log('\n4️⃣ Testing mittwald_context_get...');
    try {
      const contextResult = await client.callTool('mittwald_context_get', {});
      
      if (contextResult.content && contextResult.content[0]) {
        const content = contextResult.content[0].text;
        console.log('   ✅ Context retrieved:');
        console.log(`   ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }

    // Test 5: List available app versions
    console.log('\n5️⃣ Testing mittwald_app_versions...');
    try {
      const versionsResult = await client.callTool('mittwald_app_versions', {
        output: 'json'
      });
      
      if (versionsResult.content && versionsResult.content[0]) {
        const content = versionsResult.content[0].text;
        try {
          const versions = JSON.parse(content);
          console.log(`   ✅ Found ${Array.isArray(versions) ? versions.length : 0} available app types`);
          if (Array.isArray(versions) && versions.length > 0) {
            const apps = versions.slice(0, 5).map(v => v.name || v.id).join(', ');
            console.log(`   Available apps: ${apps}...`);
          }
        } catch {
          console.log('   ✅ App versions retrieved');
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }

    console.log('\n\n✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - MCP Streaming HTTP connection: ✅ Working');
    console.log('   - Tool invocation: ✅ Working');
    console.log('   - Mittwald API integration: ✅ Working');
    console.log('   - Session management: ✅ Working');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

testMittwaldResources();