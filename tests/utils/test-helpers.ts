import { expect } from 'vitest';

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Check if Docker container is running
 */
export async function isDockerRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Validate MCP response structure
 */
export function validateMCPResponse(response: any): void {
  expect(response).toHaveProperty('jsonrpc', '2.0');
  expect(response).toHaveProperty('id');
  
  if (response.error) {
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  } else {
    expect(response).toHaveProperty('result');
  }
}

/**
 * Validate tool response format
 */
export function validateToolResponse(result: any): void {
  expect(result).toHaveProperty('content');
  expect(result.content).toBeInstanceOf(Array);
  
  if (result.content.length > 0) {
    const content = result.content[0];
    expect(content).toHaveProperty('type');
    expect(content).toHaveProperty('text');
    
    // Parse the text content if it's JSON
    if (content.type === 'text') {
      try {
        const parsed = JSON.parse(content.text);
        expect(parsed).toHaveProperty('status');
        expect(parsed).toHaveProperty('message');
        return parsed;
      } catch {
        // Not JSON, that's okay
      }
    }
  }
}

/**
 * Parse tool response content
 */
export function parseToolContent(result: any): any {
  if (!result.content || result.content.length === 0) {
    return null;
  }
  
  const content = result.content[0];
  if (content.type === 'text') {
    try {
      return JSON.parse(content.text);
    } catch {
      return content.text;
    }
  }
  
  return content;
}