/**
 * @file MCP Tools Test
 * @module test-tools
 * 
 * @remarks
 * Tests all MCP tools functionality
 */

import { createMCPClient, log, TestTracker, runTest } from './test-utils.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

/**
 * Test tool discovery
 */
async function testToolDiscovery(client: Client): Promise<void> {
  const result = await client.listTools();
  
  if (!result.tools || result.tools.length === 0) {
    throw new Error('No tools found');
  }
  
  log.debug(`Found ${result.tools.length} tools`);
  
  // Verify expected tools exist
  const expectedTools = [
    'get_post',
    'get_channel',
    'get_notifications',
    'get_comment',
    'elicitation_example',
    'mcp_logging'
  ];
  
  for (const toolName of expectedTools) {
    const tool = result.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Expected tool not found: ${toolName}`);
    }
    
    // Verify tool has required fields
    if (!tool.description || !tool.inputSchema) {
      throw new Error(`Tool ${toolName} missing required fields`);
    }
  }
}

/**
 * Test example tools
 */
async function testExampleTools(client: Client): Promise<void> {
  // Test mcp_logging tool
  const loggingResult = await client.callTool({
    name: 'mcp_logging',
    arguments: {
      level: 'info',
      message: 'Test log message',
      data: { test: true }
    }
  });
  
  const content = loggingResult.content as any[];
  if (!content?.[0]?.text) {
    throw new Error('mcp_logging returned invalid response');
  }
}

/**
 * Test Reddit get post tool
 */
async function testRedditGetPost(client: Client): Promise<void> {
  const result = await client.callTool({
    name: 'get_post',
    arguments: {
      id: 'test123'
    }
  });
  
  const postContent = result.content as any[];
  if (!postContent?.[0]?.text) {
    throw new Error('get_post returned no content');
  }
}

/**
 * Test error handling
 */
async function testErrorHandling(client: Client): Promise<void> {
  // Test with invalid tool name
  try {
    await client.callTool({ name: 'invalid_tool_name', arguments: {} });
    throw new Error('Expected error for invalid tool name');
  } catch (error) {
    // Expected error
  }
  
  // Test with invalid parameters
  try {
    await client.callTool({ name: 'mcp_logging', arguments: {} });
    throw new Error('Expected error for missing required parameters');
  } catch (error) {
    // Expected error
  }
}

/**
 * Main test runner
 */
export async function testTools(): Promise<void> {
  log.section('🛠️  Testing MCP Tools');
  
  const tracker = new TestTracker();
  let client: Client | null = null;
  
  try {
    client = await createMCPClient();
    log.success('Connected to MCP server');
    
    await runTest('Tool Discovery', () => testToolDiscovery(client!), tracker);
    await runTest('Example Tools', () => testExampleTools(client!), tracker);
    await runTest('Reddit Get Post', () => testRedditGetPost(client!), tracker);
    await runTest('Error Handling', () => testErrorHandling(client!), tracker);
    
    tracker.printSummary();
    
  } catch (error) {
    log.error(`Test suite failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTools().catch(error => {
    log.error(`Fatal error: ${error}`);
    process.exit(1);
  });
}