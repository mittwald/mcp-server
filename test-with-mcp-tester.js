#!/usr/bin/env node

import { MCPTestFrameworkAdvanced } from '@robertdouglass/mcp-tester';

async function testMittwaldMCP() {
  console.log('🧪 Testing Mittwald MCP Server with mcp-tester...\n');
  
  const framework = new MCPTestFrameworkAdvanced({
    verbose: true,
    timeout: 30000,
    outputDir: './mcp-test-results'
  });

  // Configuration for StreamableHTTP-based MCP server
  const config = {
    type: 'streamableHttp',
    url: 'http://localhost:3000/mcp'
  };

  const tests = {
    name: 'Mittwald MCP Server Tests',
    testDiscovery: true,
    testStability: true,
    toolTests: [
      // Test server list
      {
        toolName: 'mittwald_server_list',
        arguments: { output: 'json' },
        assertions: [
          async (result) => {
            console.log('🖥️ Server list result:', JSON.stringify(result, null, 2));
            if (!result.content) throw new Error('No server list returned');
          }
        ]
      },
      // Test project list
      {
        toolName: 'mittwald_project_list',
        arguments: { output: 'json' },
        assertions: [
          async (result) => {
            console.log('📁 Project list result:', JSON.stringify(result, null, 2));
            if (!result.content) throw new Error('No project list returned');
          }
        ]
      },
      // Test app list (with default project if available)
      {
        toolName: 'mittwald_app_list',
        arguments: { output: 'json' },
        assertions: [
          async (result) => {
            console.log('📱 App list result:', JSON.stringify(result, null, 2));
            if (!result.content) throw new Error('No app list returned');
          }
        ]
      }
    ]
  };

  try {
    console.log('🚀 Starting tests...\n');
    await framework.testServer(config, tests);
    const report = await framework.generateReport();
    framework.printSummary(report);
    
    if (report.summary.failed > 0) {
      console.error('\n❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All Mittwald MCP tests passed!');
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

testMittwaldMCP().catch(console.error);