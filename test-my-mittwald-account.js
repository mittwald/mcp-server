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

async function showMyMittwaldAccount() {
  const client = new MCPStreamingClient('http://localhost:3000/mcp');

  try {
    console.log('🏢 Your Mittwald Account Overview\n');
    console.log('=====================================\n');

    // Initialize connection
    const initResponse = await client.makeRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: "account-viewer",
        version: "1.0.0"
      }
    });

    if (initResponse.error) {
      throw new Error(`Initialize failed: ${initResponse.error.message}`);
    }

    // Send initialized notification
    await client.makeRequest('notifications/initialized', {}, true);

    // Get servers
    console.log('📡 SERVERS\n');
    try {
      const serversResult = await client.callTool('mittwald_server_list', {
        output: 'json'
      });
      
      if (serversResult.content && serversResult.content[0]) {
        const content = serversResult.content[0].text;
        try {
          const data = JSON.parse(content);
          if (data.data && Array.isArray(data.data)) {
            const servers = data.data;
            if (servers.length === 0) {
              console.log('   No servers found in your account.\n');
            } else {
              servers.forEach((server, index) => {
                console.log(`   Server ${index + 1}:`);
                console.log(`   ├─ ID: ${server.id}`);
                console.log(`   ├─ Description: ${server.description || 'No description'}`);
                console.log(`   ├─ Created: ${new Date(server.createdAt).toLocaleDateString()}`);
                console.log(`   └─ Ready: ${server.isReady ? 'Yes' : 'No'}\n`);
              });
            }
          } else if (data.message) {
            // Parse the text format
            const lines = data.message.split('\n');
            console.log(lines.slice(2).join('\n'));
          }
        } catch (e) {
          console.log(content);
        }
      }
    } catch (error) {
      console.log(`   Error fetching servers: ${error.message}\n`);
    }

    // Get projects with extended info
    console.log('\n📁 PROJECTS\n');
    let projectIds = [];
    try {
      const projectsResult = await client.callTool('mittwald_project_list', {
        output: 'json'
      });
      
      if (projectsResult.content && projectsResult.content[0]) {
        const content = projectsResult.content[0].text;
        try {
          const data = JSON.parse(content);
          let projects = [];
          
          // Handle different response formats
          if (data.data && Array.isArray(data.data)) {
            projects = data.data;
          } else if (Array.isArray(data)) {
            projects = data;
          } else if (data.data && typeof data.data === 'string') {
            // Parse TSV format
            const lines = data.data.split('\n');
            const headers = lines[0].split('\t');
            projects = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split('\t');
              const proj = {};
              headers.forEach((header, index) => {
                proj[header.toLowerCase().replace(/\s+/g, '')] = values[index];
              });
              return proj;
            });
          }
          
          if (projects.length === 0) {
            console.log('   No projects found in your account.\n');
          } else {
            projects.forEach((project, index) => {
              const projectId = project.id || project.ID;
              const shortId = project.shortId || project['ShortID'] || project.shortid;
              const description = project.description || project.Description;
              const serverId = project.serverId || project['ServerID'] || project.serverid;
              const ready = project.readiness || project.Readiness || 'unknown';
              
              if (projectId) projectIds.push(projectId);
              
              console.log(`   Project ${index + 1}:`);
              console.log(`   ├─ ID: ${projectId}`);
              console.log(`   ├─ Short ID: ${shortId || 'N/A'}`);
              console.log(`   ├─ Description: ${description || 'No description'}`);
              console.log(`   ├─ Server: ${serverId || 'N/A'}`);
              console.log(`   └─ Status: ${ready}\n`);
            });
          }
        } catch (e) {
          console.log(`   Error parsing projects: ${e.message}`);
          console.log(content);
        }
      }
    } catch (error) {
      console.log(`   Error fetching projects: ${error.message}\n`);
    }
    
    // Get apps for each project
    if (projectIds.length > 0) {
      console.log('\n📱 APPLICATIONS\n');
      
      for (const projectId of projectIds) {
        try {
          const appsResult = await client.callTool('mittwald_app_list', {
            projectId: projectId,
            output: 'json'
          });
          
          if (appsResult.content && appsResult.content[0]) {
            const content = appsResult.content[0].text;
            try {
              const data = JSON.parse(content);
              let apps = [];
              
              if (data.data && Array.isArray(data.data)) {
                apps = data.data;
              } else if (Array.isArray(data)) {
                apps = data;
              }
              
              if (apps.length > 0) {
                console.log(`   In project ${projectId}:`);
                apps.forEach((app, appIndex) => {
                  const appName = app.appVersion?.current || app.systemSoftware || app.name || 'Unknown';
                  const appId = app.id || app.ID;
                  const version = app.version || app.appVersion?.desired || 'N/A';
                  
                  console.log(`   ├─ App ${appIndex + 1}: ${appName}`);
                  console.log(`   │  ├─ ID: ${appId}`);
                  console.log(`   │  └─ Version: ${version}`);
                });
                console.log();
              } else {
                console.log(`   Project ${projectId}: No applications installed\n`);
              }
            } catch (e) {
              console.log(`   Project ${projectId}: Error parsing apps - ${e.message}\n`);
            }
          }
        } catch (error) {
          console.log(`   Project ${projectId}: Error fetching apps - ${error.message}\n`);
        }
      }
    }

    // Skip organizations for now as the tool isn't available

    console.log('\n=====================================');
    console.log('✅ Account overview complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

showMyMittwaldAccount();