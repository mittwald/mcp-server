# Phase-Aware Testing Documentation

## Overview

The phase-aware testing system allows functional tests to be run in three separate phases:

1. **Setup Phase**: Creates test projects and infrastructure
2. **Test Phase**: Runs actual tests using existing projects
3. **Teardown Phase**: Cleans up all test resources

This approach provides several benefits:
- Faster debugging by reusing existing projects
- Ability to inspect test infrastructure between phases
- More efficient test execution when running multiple test suites
- Better resource management with coordinated cleanup

## Project Naming Convention

All test projects follow a strict naming convention:
```
[TEST] {ISO-timestamp} - {Description}
```

Example:
```
[TEST] 2024-01-15T10-30-45-123Z - Simple Deployment
```

This convention ensures:
- Easy identification of test projects
- Chronological ordering
- Automatic cleanup of orphaned test projects

## Running Phase-Aware Tests

### Using the Coordinated Test Runner

The recommended way to run phase-aware tests:

```bash
# Run all tests with all phases
npm run test:phases

# Run only setup phase for all tests
npm run test:phases setup

# Run only test phase
npm run test:phases test

# Run only teardown phase
npm run test:phases teardown

# Run specific test suite
npm run test:phases all deployment

# Skip cleanup (for debugging)
npm run test:phases all --skip-cleanup
```

### Using Environment Variables

You can also control phases using environment variables:

```bash
# Run setup phase only
TEST_PHASE=setup npm run test:functional

# Run test phase only
TEST_PHASE=test npm run test:functional

# Run teardown phase only
TEST_PHASE=teardown npm run test:functional
```

### Individual Test Execution

For debugging specific tests:

```bash
# Run a single test file in setup phase
TEST_PHASE=setup npm run test:single tests/functional/simple-deployment.test.ts

# Run a single test file in test phase
TEST_PHASE=test npm run test:single tests/functional/simple-deployment.test.ts
```

## Test State Management

### State Files

Test state is persisted in JSON files in the `test-state` directory:
- `test-state/simple-deployment.json`
- `test-state/container-operations.json`
- etc.

Each state file contains:
- Created projects with IDs and metadata
- Timestamp of creation
- Test suite name
- Custom state data (e.g., container stack IDs)

### State File Structure

```json
{
  "projects": [
    {
      "projectId": "p-abc123",
      "shortId": "abc123",
      "serverId": "s-xyz789",
      "description": "[TEST] 2024-01-15T10-30-45-123Z - Simple Deployment"
    }
  ],
  "timestamp": "2024-01-15T10:30:45.123Z",
  "suiteName": "simple-deployment",
  "containerState": {
    "stackId": "stk-123",
    "createdRegistries": [],
    "createdServices": {},
    "createdVolumes": {}
  }
}
```

## Implementing Phase-Aware Tests

### 1. Extend PhaseTestBase

```typescript
import { PhaseTestBase, getTestPhaseConfig, TestProject } from '../utils/phase-test-base';

class MyTest extends PhaseTestBase {
  constructor() {
    super(getTestPhaseConfig('my-test-suite'));
  }

  protected async createTestProjects(): Promise<TestProject[]> {
    // Phase 1: Create projects
    const project = await this.projectManager.createTestProject('My Test');
    return [project];
  }

  protected async runTests(projects: TestProject[]): Promise<void> {
    // Phase 2: Run actual tests
    const project = projects[0];
    // ... run your tests ...
  }
}
```

### 2. Use Traditional Test Structure

```typescript
describe('My Test Suite (Phase-Aware)', () => {
  const test = new MyTest();
  
  beforeAll(async () => {
    // Any setup checks
  });
  
  it('should run the configured test phase', async () => {
    await test.run();
  }, 900000); // 15 minute timeout
});
```

## Best Practices

### 1. Project Creation

- Always use `TestProjectManager.createTestProject()` for consistency
- The [TEST] timestamp prefix is automatically added
- Wait for projects to be fully initialized before using them

### 2. Resource Tracking

- Track all created resources in your test class
- Use the TestProjectManager for apps and projects
- Implement custom cleanup for special resources (e.g., containers)

### 3. Error Handling

- Tests should handle partial failures gracefully
- Cleanup should always be attempted, even on test failure
- Use try-catch blocks in cleanup code

### 4. Debugging

When debugging tests:
1. Run setup phase: `npm run test:phases setup deployment`
2. Check created projects in Mittwald dashboard
3. Run test phase repeatedly: `npm run test:phases test deployment`
4. Clean up when done: `npm run test:phases teardown deployment`

### 5. CI/CD Integration

For CI/CD pipelines, always run all phases:
```bash
npm run test:phases all
```

This ensures proper cleanup even if tests fail.

## Troubleshooting

### State File Issues

If tests fail with "No test state found":
1. Check if the state file exists in `test-state/`
2. Run the setup phase first
3. Ensure the test suite name matches

### Cleanup Failures

If cleanup fails:
1. Check for permission errors (403)
2. Wait longer between operations
3. Use manual cleanup scripts if needed
4. Check Mittwald dashboard for orphaned resources

### Project Creation Timeouts

If project creation times out:
1. Increase timeout values in test configuration
2. Check Mittwald API status
3. Ensure sufficient server resources

## Migration Guide

To migrate existing tests to phase-aware:

1. Extend `PhaseTestBase` instead of direct setup/teardown
2. Move project creation to `createTestProjects()`
3. Move test logic to `runTests()`
4. Remove manual cleanup code (handled by base class)
5. Update timeout values if needed
6. Test each phase independently

## Environment Variables

- `TEST_PHASE`: Controls which phase to run (setup|test|teardown|all)
- `TEST_PROJECT_NAME`: Specify existing project name for test/teardown
- `SKIP_CLEANUP`: Set to 'true' to skip cleanup phase
- `TEST_SERVER_ID`: Specify server ID for project creation