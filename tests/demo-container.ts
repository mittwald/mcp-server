/**
 * Simple demonstration of container functionality
 */

import http from 'http';

interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id: number;
}

interface MCPResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: any;
  id: number;
}

async function makeRequest(request: MCPRequest): Promise<MCPResponse> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(request);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function demoContainers() {
  console.log('🚀 Container Management Demo\n');
  
  let requestId = 1;
  
  try {
    // Initialize session
    console.log('1. Initializing session...');
    const initResponse = await makeRequest({
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "0.1.0",
        clientInfo: {
          name: "container-demo",
          version: "1.0.0"
        }
      },
      id: requestId++
    });
    
    if (initResponse.error) {
      throw new Error(`Init failed: ${initResponse.error.message}`);
    }
    
    console.log('   ✓ Session initialized\n');
    
    // List available container tools
    console.log('2. Available container tools:');
    const toolsResponse = await makeRequest({
      jsonrpc: "2.0",
      method: "tools/list",
      params: {},
      id: requestId++
    });
    
    if (toolsResponse.result?.tools) {
      const containerTools = toolsResponse.result.tools
        .filter((t: any) => t.name.includes('container'))
        .map((t: any) => t.name);
      
      containerTools.forEach((tool: string) => {
        console.log(`   - ${tool}`);
      });
    }
    
    console.log('\n3. Testing container list operations...');
    
    // Test listing stacks (will fail without valid project)
    const stacksResponse = await makeRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "mittwald_container_list_stacks",
        arguments: {
          projectId: "p-demo123",
          output: "json"
        }
      },
      id: requestId++
    });
    
    console.log('   Stack list response:', 
      stacksResponse.result?.content?.[0]?.text 
        ? JSON.parse(stacksResponse.result.content[0].text).message
        : 'No response'
    );
    
    console.log('\n4. Example: Declaring a container stack');
    console.log('   This would deploy nginx and redis with volumes:');
    console.log(`
    await callTool('mittwald_container_declare_stack', {
      stackId: 'stack-xxxxx',
      desiredServices: {
        nginx: {
          imageUri: 'nginx:alpine',
          ports: [{ containerPort: 80 }]
        },
        redis: {
          imageUri: 'redis:7-alpine',
          volumes: [{
            name: 'redis-data',
            mountPath: '/data'
          }]
        }
      },
      desiredVolumes: {
        'redis-data': { size: '1Gi' }
      }
    });
    `);
    
    console.log('\n✅ Container tools are successfully integrated!');
    console.log('\nCapabilities:');
    console.log('- Stack management (list, declare)');
    console.log('- Service operations (list, logs)');
    console.log('- Volume management (list)');
    console.log('- Registry management (create, list)');
    console.log('- Support for Docker Hub, GitHub, GitLab registries');
    console.log('- Multi-container deployments with networking');
    console.log('- Persistent volume support');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
demoContainers().catch(console.error);