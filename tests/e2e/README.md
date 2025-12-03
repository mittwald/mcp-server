# E2E Test Suite

## Overview

End-to-end tests verify the complete OAuth 2.1 + PKCE flow and MCP tool execution workflow.

## Prerequisites

- Docker and docker-compose
- Node.js 20+
- Redis and OAuth services (via docker-compose.test.yml)

## Setup

```bash
# Start test dependencies
docker compose -f tests/e2e/docker-compose.test.yml up -d

# Wait for services to be ready
sleep 5

# Run E2E tests
npm run test:e2e
```

## Test Structure

```
tests/e2e/
├── claude-ai-oauth-flow.test.ts    # Complete 38-step OAuth workflow
├── all-clients-compatibility.test.ts  # Multi-client OAuth tests
├── docker-compose.test.yml         # Test environment definition
├── mittwald-stub-server.ts         # Mock Mittwald API responses
├── setup.ts                        # Test environment setup/teardown
└── README.md                       # This file
```

## Test Coverage

### OAuth Flow (claude-ai-oauth-flow.test.ts)
- Dynamic Client Registration (DCR)
- Authorization Code + PKCE flow
- Token exchange and JWT issuance
- Session establishment
- MCP tool execution with valid session

### Multi-Client (all-clients-compatibility.test.ts)
- MCP Jam Inspector (public client)
- Claude.ai (confidential client)
- ChatGPT (pre-registered client)
- Cross-client token isolation

## Security Testing Strategy

Security validation is primarily covered by unit tests for faster feedback:

| Security Feature | Unit Tests | E2E Coverage |
|------------------|------------|--------------|
| DCR Access Tokens (WP01) | `packages/oauth-bridge/tests/token-flow.test.ts` | DCR flow in E2E |
| OAuth State Replay (WP02) | `packages/oauth-bridge/tests/unit/state-store.test.ts` | State handling in flow |
| Startup Guards (WP03) | `packages/oauth-bridge/tests/unit/startup-validator.test.ts` | N/A (startup only) |
| Shell Injection (WP04) | `tests/unit/cli-wrapper.test.ts` | CLI execution in MCP tools |

### Why Unit Tests for Security?

1. **Faster feedback**: Unit tests run in milliseconds, E2E in seconds/minutes
2. **Better isolation**: Test specific security behaviors without external dependencies
3. **Easier debugging**: Failures pinpoint exact code paths
4. **Higher coverage**: Can test edge cases that are hard to trigger E2E

## Running Tests

```bash
# All E2E tests
npm run test:e2e

# Specific test file
npm run test:e2e -- claude-ai-oauth-flow

# With verbose output
npm run test:e2e -- --reporter=verbose

# Security-focused unit tests
npm test -- tests/unit/cli-wrapper.test.ts
npm test -- packages/oauth-bridge/tests/unit/
```

## CI Configuration

E2E tests run in GitHub Actions with:
- Redis service container
- Test timeout: 5 minutes per test
- Retry: 2 attempts for flaky network issues

## Troubleshooting

### Tests fail with connection refused
```bash
# Check services are running
docker compose -f tests/e2e/docker-compose.test.yml ps

# View service logs
docker compose -f tests/e2e/docker-compose.test.yml logs
```

### Flaky test failures
- Check Redis connection stability
- Verify no port conflicts (6379, 3000, 8080)
- Increase timeouts for slow CI environments

### Debug mode
```bash
DEBUG=e2e:* npm run test:e2e
```
