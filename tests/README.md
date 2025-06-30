# Mittwald MCP Test Suite

## Overview

This test suite provides comprehensive testing for the Mittwald MCP server, including:
- Unit tests for individual components
- Integration tests for API interactions
- Functional tests for end-to-end workflows

## Test Structure

```
tests/
├── unit/          # Unit tests for individual functions
├── integration/   # Integration tests for API calls
├── functional/    # End-to-end functional tests
├── utils/         # Test utilities and helpers
└── config/        # Test configuration
```

## Running Tests

### Prerequisites

1. Set up your `.env` file with required test configuration:
```bash
# Required
MITTWALD_API_TOKEN=your_api_token
TEST_SERVER_ID=your_test_server_id

# Optional
TEST_ADMIN_EMAIL=test@example.com
SKIP_TEST_CLEANUP=false
TEST_PARALLEL=true
```

2. Build the project:
```bash
npm run build
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Functional tests only
npm run test:functional

# Watch mode for development
npm run test:watch
```

### Run Specific Test Files
```bash
# Run a specific test file
npm test tests/functional/app-installations.test.ts

# Run tests matching a pattern
npm test -- -t "should install WordPress"
```

## Key Test Files

### App Installation Tests (`app-installations.test.ts`)
Comprehensive test suite that:
- Creates a new test project
- Tests all 8 app types (WordPress, Nextcloud, Matomo, TYPO3, Contao, Joomla, Shopware 5/6)
- Validates installation responses
- Cleans up all resources after tests

### System Software Tests (`system-software.test.ts`)
Full lifecycle testing of system software management:
- Lists all available system software (Composer, ImageMagick, etc.)
- Gets versions for specific software packages
- Installs/updates system software on apps
- Verifies installations and update policies
- Tests error handling and edge cases
- Demonstrates real-world scenarios

### Test Utilities

- **MCPTestClient**: Wrapper for testing MCP tool calls
- **TestProjectManager**: Manages project lifecycle for tests
- **parseToolContent**: Parses MCP tool responses consistently

## Writing New Tests

### Example Test Structure
```typescript
import { describe, it, expect } from 'vitest';
import { MCPTestClient } from '../utils/mcp-test-client';

describe('My Feature', () => {
  let client: MCPTestClient;
  
  beforeAll(async () => {
    client = new MCPTestClient();
    await client.initialize();
  });
  
  afterAll(async () => {
    await client.close();
  });
  
  it('should do something', async () => {
    const response = await client.callTool('tool_name', {
      param: 'value'
    });
    
    expect(response.result).toBeDefined();
  });
});
```

### Best Practices

1. **Always clean up resources**: Use afterAll hooks to clean up projects/apps
2. **Use descriptive test names**: Tests should clearly state what they're testing
3. **Isolate tests**: Each test should be independent and not rely on others
4. **Use timeouts appropriately**: Long operations should have appropriate timeouts
5. **Log useful information**: Use logger for debugging, but avoid excessive logging

## Debugging Failed Tests

### Keep Test Resources
To debug failing tests, prevent automatic cleanup:
```bash
SKIP_TEST_CLEANUP=true npm test
```

### Verbose Logging
Enable debug logging:
```bash
DEBUG=* npm test
```

### Run Tests Sequentially
To avoid concurrency issues:
```bash
TEST_PARALLEL=false npm test
```

## CI/CD Integration

The test suite is designed to run in CI environments:

1. All tests create and clean up their own resources
2. Tests use environment variables for configuration
3. Proper timeouts prevent hanging tests
4. Exit codes indicate success/failure

Example GitHub Actions workflow:
```yaml
- name: Run tests
  env:
    MITTWALD_API_TOKEN: ${{ secrets.MITTWALD_API_TOKEN }}
    TEST_SERVER_ID: ${{ secrets.TEST_SERVER_ID }}
  run: |
    npm ci
    npm run build
    npm test
```

## Troubleshooting

### Common Issues

1. **"No servers available"**: Ensure TEST_SERVER_ID is set correctly
2. **"Project creation timeout"**: Mittwald API might be slow, increase timeout
3. **"App installation failed"**: Check app versions are current
4. **"Cleanup failed"**: Resources might be in use, wait and retry

### Getting Help

- Check test logs for detailed error messages
- Run with DEBUG=* for verbose output
- Ensure all environment variables are set correctly
- Verify Mittwald API token has necessary permissions