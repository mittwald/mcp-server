# Mittwald MCP Server Test Suite

This directory contains the comprehensive test suite for the Mittwald MCP server.

## Structure

```
tests/
├── unit/              # Unit tests for individual functions/utilities
├── integration/       # Integration tests for MCP tools and endpoints
├── utils/            # Test utilities and helpers
└── setup.ts          # Global test setup
```

## Running Tests

### Prerequisites

1. Docker must be running
2. Server must be started: `docker compose up -d`
3. Mittwald API token must be configured in `.env`

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

```

## Test Framework

We use [Vitest](https://vitest.dev/) as our test framework because:
- Fast execution with native ESM support
- Compatible with Jest API
- Built-in TypeScript support
- Excellent watch mode
- UI mode for debugging

## Writing Tests

### Unit Tests

Unit tests go in `tests/unit/` and test individual functions in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/utils/my-function';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected output');
  });
});
```

### Integration Tests

Integration tests go in `tests/integration/` and test MCP tools with the running server:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';

describe('My Tool', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    client = new MCPTestClient();
    await client.initialize();
  });

  it('should work correctly', async () => {
    const response = await client.callTool('my_tool', { arg: 'value' });
    expect(response.result).toBeDefined();
  });
});
```

## Test Utilities

### MCPTestClient

A reusable client for testing MCP endpoints:

```typescript
const client = new MCPTestClient();
await client.initialize();
await client.callTool('tool_name', { args });
await client.listTools();
await client.listResources();
```

### Test Helpers

- `isDockerRunning()` - Check if Docker container is running
- `validateMCPResponse()` - Validate MCP response structure
- `validateToolResponse()` - Validate tool response format
- `parseToolContent()` - Parse tool response content

## Coverage

Run `npm run test:coverage` to generate coverage reports. Coverage files are generated in:
- Terminal output
- `coverage/` directory (HTML report)


## Adding New Tests

1. **For new utilities**: Add unit tests in `tests/unit/`
2. **For new tools**: Add integration tests in `tests/integration/tools/`
3. **For new features**: Add appropriate tests in the relevant directory
4. **Always test**:
   - Happy path
   - Error cases
   - Edge cases
   - Performance (for heavy operations)

## CI/CD Integration

Tests are run automatically on:
- Pull requests
- Commits to main branch
- Before releases

Ensure all tests pass before merging!