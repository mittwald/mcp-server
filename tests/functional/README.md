# Functional Tests

This directory contains comprehensive functional tests that validate the full lifecycle of Mittwald operations through the MCP server.

## Overview

The functional tests perform real operations against the Mittwald API, including:
- Creating test projects
- Installing multiple applications in parallel
- Validating app installations
- Cleaning up all created resources

⚠️ **WARNING**: These tests create real resources in your Mittwald account that may incur costs. Always ensure proper cleanup.

## Test Structure

### `app-deployment-suite.test.ts`
Comprehensive test suite that:
1. Creates a test project
2. Installs multiple apps (WordPress, Nextcloud, Matomo, Joomla, Shopware 6, TYPO3) in parallel
3. Validates each installation
4. Performs operations on installed apps
5. Cleans up all resources

## Running Functional Tests

### Prerequisites
1. Valid Mittwald API token in `.env`
2. Docker container running: `docker compose up -d`
3. Sufficient Mittwald account resources

### Commands

```bash
# Run all functional tests
npm run test:functional

# Run with watch mode (useful for development)
npm run test:functional:watch

# Run a specific test file
npx vitest run tests/functional/app-deployment-suite.test.ts
```

## Test Configuration

### Timeouts
- Default test timeout: 20 minutes (for full suite)
- Individual app installation timeouts:
  - WordPress: 5 minutes
  - Nextcloud: 6.5 minutes
  - Matomo: 5 minutes
  - Joomla: 6 minutes
  - Shopware 6: 10 minutes
  - TYPO3: 8 minutes

### Parallel Execution
Apps are installed in parallel to reduce total test time. The test framework handles:
- Concurrent API calls
- Progress monitoring for each installation
- Individual timeout management
- Graceful error handling

## Test Utilities

### `TestProjectManager`
Manages the lifecycle of test resources:
- `createTestProject()`: Creates a project and waits for it to be ready
- `installApp()`: Installs a single app
- `installAppsInParallel()`: Installs multiple apps concurrently
- `cleanup()`: Removes all created resources

### Async Operations
- `pollOperation()`: Polls long-running operations with configurable retry logic
- `createProgressReporter()`: Provides console progress updates
- `runParallelOperations()`: Executes multiple async operations with timeout handling

## Resource Cleanup

The test suite implements automatic cleanup in the `afterAll` hook. If tests are interrupted:

1. Check for orphaned resources:
   ```bash
   mittwald project list
   ```

2. Manual cleanup if needed:
   ```bash
   mittwald project delete <project-id> --force
   ```

## Best Practices

1. **Always run tests in isolation**: Don't run functional tests in parallel with other tests
2. **Monitor resources**: Check your Mittwald dashboard after tests
3. **Use descriptive names**: Test resources are named with timestamps for easy identification
4. **Handle failures gracefully**: Tests continue even if some apps fail to install
5. **Log extensively**: All operations are logged for debugging

## Troubleshooting

### Common Issues

1. **Timeout errors**
   - Increase individual app timeouts in test configuration
   - Check Mittwald service status

2. **Resource limits**
   - Ensure your account has sufficient project/app limits
   - Clean up old test resources

3. **API rate limits**
   - Tests include appropriate delays between operations
   - Reduce parallelism if hitting limits

### Debug Mode

Set environment variable for verbose logging:
```bash
DEBUG=mittwald:* npm run test:functional
```

## Cost Considerations

Functional tests create real resources that may incur costs:
- Project hosting fees
- App installation fees
- Storage usage

Always ensure proper cleanup and consider using a dedicated test account.