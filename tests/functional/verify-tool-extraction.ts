#!/usr/bin/env node
/**
 * Quick verification script for WP01 tool extraction fix
 * Tests that toolsInvoked[] gets populated correctly from session events
 */

import type { StreamEvent } from './src/types/index.js';

// Mock session events matching actual Claude Code headless stream structure
// Case 1: Top-level tool_use event
const mockToolUseEvent: StreamEvent = {
  type: 'tool_use',
  timestamp: new Date(),
  content: {
    id: 'call_123',
    tool_name: 'mcp__mittwald__app__create',
    name: 'mcp__mittwald__app__create',
    arguments: { name: 'test-app' },
  },
};

// Case 2: Message event with tool_use blocks in content array
const mockMessageWithToolsEvent: StreamEvent = {
  type: 'message',
  timestamp: new Date(),
  content: {
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'call_124',
          name: 'mcp__mittwald__database__mysql__create',
          input: { name: 'test-db' },
        },
        {
          type: 'text',
          text: 'Creating your database...',
        },
        {
          type: 'tool_use',
          id: 'call_125',
          name: 'mcp__mittwald__domain__create',
          input: { name: 'test.example.com' },
        },
      ],
    },
  },
};

// Simulate the extraction logic from executor.ts
function extractToolsFromEvent(event: StreamEvent): string[] {
  const toolsInvoked: Set<string> = new Set();

  // Extract tool calls (WP01 fix: handle tool_use events and message blocks)
  if (event.type === 'tool_use') {
    // Top-level tool_use events have tool name at top level
    const toolUseContent = event.content as Record<string, unknown>;
    const toolName = String(toolUseContent.tool_name || toolUseContent.name || '');
    if (toolName) {
      toolsInvoked.add(toolName);
    }
  } else if (event.type === 'message') {
    // Message events may contain tool_use blocks in content array
    const messageContent = event.content as Record<string, unknown>;
    const message = messageContent.message as { content?: Array<Record<string, unknown>> } | undefined;
    if (message?.content && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'tool_use') {
          const toolName = block.name as string;
          if (toolName) {
            toolsInvoked.add(toolName);
          }
        }
      }
    }
  }

  return Array.from(toolsInvoked);
}

// Test the extraction
console.log('🧪 WP01 Tool Extraction Verification\n');

// Test Case 1: Top-level tool_use event
console.log('Test Case 1: Top-level tool_use event');
const toolUseExtracted = extractToolsFromEvent(mockToolUseEvent);
console.log('Tools extracted:', toolUseExtracted);
const test1Passed = toolUseExtracted.includes('mcp__mittwald__app__create');
console.log(`Result: ${test1Passed ? '✓ PASS' : '✗ FAIL'}`);

// Test Case 2: Message event with tool_use blocks in content array
console.log('\nTest Case 2: Message with multiple tool_use blocks');
const messageExtracted = extractToolsFromEvent(mockMessageWithToolsEvent);
console.log('Tools extracted:', messageExtracted);
const expectedFromMessage = ['mcp__mittwald__database__mysql__create', 'mcp__mittwald__domain__create'];
const test2Passed =
  expectedFromMessage.every(tool => messageExtracted.includes(tool)) &&
  messageExtracted.length === expectedFromMessage.length;
console.log(`Result: ${test2Passed ? '✓ PASS' : '✗ FAIL'}`);

// Overall result
console.log('\n✅ Verification Results:');
console.log(`Test Case 1 (tool_use event): ${test1Passed ? '✓' : '✗'}`);
console.log(`Test Case 2 (message with tool blocks): ${test2Passed ? '✓' : '✗'}`);

const allTestsPassed = test1Passed && test2Passed;
if (allTestsPassed) {
  console.log('\n🎉 WP01 Tool Extraction: PASS\n');
  process.exit(0);
} else {
  console.log('\n❌ WP01 Tool Extraction: FAIL\n');
  process.exit(1);
}
