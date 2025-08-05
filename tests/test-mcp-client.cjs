#!/usr/bin/env node

/**
 * Test MCP client to reproduce potential crash issues
 * Tests both HTTP and HTTPS endpoints to isolate SSL problems
 */

const https = require('https');
const http = require('http');

// Test configuration
const HTTPS_URL = 'https://localhost:3000/mcp';
const HTTP_URL = 'http://localhost:3001/mcp';

// Allow self-signed certificates for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🧪 Testing MCP endpoints...');

async function testEndpoint(url, isHttps = false) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = isHttps ? https : http;
    
    console.log(`📡 Testing ${isHttps ? 'HTTPS' : 'HTTP'}: ${url}`);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestMCPClient/1.0',
        'Accept': 'application/json'
      }
    };
    
    // Simulate MCP initialization request
    const mcpInitRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          }
        },
        clientInfo: {
          name: 'TestMCPClient',
          version: '1.0.0'
        }
      }
    });
    
    const req = client.request(options, (res) => {
      console.log(`✅ ${isHttps ? 'HTTPS' : 'HTTP'} Response status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Response body:`, body.substring(0, 200) + (body.length > 200 ? '...' : ''));
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ ${isHttps ? 'HTTPS' : 'HTTP'} Request failed:`, error.message, error.code);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error(`⏰ ${isHttps ? 'HTTPS' : 'HTTP'} Request timed out`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    // Set timeout
    req.setTimeout(10000);
    
    // Write the MCP request
    req.write(mcpInitRequest);
    req.end();
  });
}

async function runTests() {
  try {
    console.log('\n=== Testing HTTP endpoint ===');
    const httpResult = await testEndpoint(HTTP_URL, false);
    console.log('✅ HTTP test completed\n');
    
    console.log('=== Testing HTTPS endpoint ===');
    const httpsResult = await testEndpoint(HTTPS_URL, true);
    console.log('✅ HTTPS test completed\n');
    
    console.log('🎉 All tests completed successfully!');
    console.log('📊 Summary:');
    console.log(`  HTTP Status: ${httpResult.status}`);
    console.log(`  HTTPS Status: ${httpsResult.status}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

runTests();