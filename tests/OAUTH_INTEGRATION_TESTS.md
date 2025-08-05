# OAuth Integration Tests Documentation

This document describes the comprehensive OAuth integration test suite for the Mittwald MCP Server.

## Overview

The OAuth integration tests provide comprehensive coverage of the OAuth 2.0 authentication flow, token management, session handling, and middleware integration. These tests ensure that the OAuth implementation works correctly with the MockOAuth2Server and handles various scenarios including success cases, error conditions, and edge cases.

## Test Structure

### Integration Tests Directory: `tests/integration/`

1. **`oauth-authorization-flow.test.ts`** - OAuth authorization flow testing
2. **`oauth-token-management.test.ts`** - Token lifecycle management
3. **`oauth-session-management.test.ts`** - Session integration with OAuth
4. **`oauth-middleware-integration.test.ts`** - Authentication middleware testing
5. **`oauth-end-to-end.test.ts`** - End-to-end workflow scenarios
6. **`oauth-flow.test.ts`** - Basic OAuth flow integration
7. **`mock-oauth2-server.test.ts`** - MockOAuth2Server integration

## Test Coverage Areas

### 1. OAuth Authorization Flow (`oauth-authorization-flow.test.ts`)

**Coverage:**
- ✅ Authorization URL generation with PKCE parameters
- ✅ OAuth state management and storage in Redis
- ✅ Callback handling for success and error scenarios
- ✅ Token exchange integration with MockOAuth2Server
- ✅ State security (tampering protection, expiration)
- ✅ Concurrent OAuth flow handling
- ✅ Error scenarios and graceful recovery
- ✅ PKCE security implementation (S256)

**Key Test Scenarios:**
- Valid authorization URL structure with all required parameters
- OAuth state storage and retrieval from Redis
- Callback processing with valid/invalid states and codes
- State expiration and cleanup mechanisms
- Prevention of state reuse attacks
- Concurrent flow isolation

### 2. OAuth Token Management (`oauth-token-management.test.ts`)

**Coverage:**
- ✅ Token exchange request structure and validation
- ✅ Token refresh workflow implementation
- ✅ Token validation against OAuth provider
- ✅ User info retrieval from OAuth endpoints
- ✅ Token revocation handling
- ✅ JWT-OAuth token coordination
- ✅ Token lifecycle management (create, refresh, revoke)
- ✅ Error recovery and resilience testing
- ✅ Concurrent token operations

**Key Test Scenarios:**
- Proper token exchange request formatting
- Token refresh with MockOAuth2Server integration
- Token validation through userinfo endpoint
- Graceful handling of invalid/expired tokens
- Session updates with refreshed tokens
- Token revocation without throwing errors

### 3. OAuth Session Management (`oauth-session-management.test.ts`)

**Coverage:**
- ✅ Session creation with OAuth token data
- ✅ Multi-session support per user
- ✅ Session expiration and automated cleanup
- ✅ OAuth session API integration
- ✅ Context management within OAuth sessions
- ✅ Session state coordination with OAuth flow
- ✅ Performance and scalability under load
- ✅ Session TTL management with OAuth data

**Key Test Scenarios:**
- Creating sessions with OAuth tokens and metadata
- Managing multiple concurrent sessions per user
- Session context updates preserving OAuth data
- Expired session cleanup maintaining data integrity
- API endpoints for session management
- High-load concurrent session operations

### 4. OAuth Middleware Integration (`oauth-middleware-integration.test.ts`)

**Coverage:**
- ✅ Request authentication and authorization
- ✅ JWT token validation and processing
- ✅ Session data injection into request context
- ✅ OAuth scope validation and enforcement
- ✅ Proper error response formatting
- ✅ WWW-Authenticate header handling
- ✅ CORS integration with OAuth flows
- ✅ Session middleware coordination
- ✅ Concurrent authenticated request handling
- ✅ Error recovery and resilience

**Key Test Scenarios:**
- Rejecting unauthenticated requests with proper OAuth metadata
- JWT token validation (signature, expiration, audience)
- Session data injection for authenticated requests
- Scope-based access control
- Proper OAuth error response formatting
- CORS preflight handling without authentication

### 5. OAuth End-to-End Workflows (`oauth-end-to-end.test.ts`)

**Coverage:**
- ✅ Complete OAuth flow from initiation to authenticated requests
- ✅ OAuth error scenarios and recovery mechanisms
- ✅ Full session lifecycle from OAuth to logout
- ✅ Token refresh workflows end-to-end
- ✅ Context switching within OAuth sessions
- ✅ MCP protocol integration with OAuth authentication
- ✅ Resource cleanup and maintenance
- ✅ Load testing and performance validation

**Key Test Scenarios:**
- Full OAuth flow: login → callback → session → authenticated requests
- Error handling throughout the complete flow
- Session lifecycle management with OAuth tokens
- Token refresh maintaining session continuity
- MCP protocol requests with OAuth authentication
- Cleanup of expired OAuth resources

## Prerequisites and Setup

### Required Services

1. **MockOAuth2Server**: OAuth provider simulation
   ```bash
   docker-compose up -d mock-oauth
   ```

2. **Redis**: Session and state storage
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

### Environment Configuration

```bash
NODE_ENV=test
DISABLE_OAUTH=false
REDIS_URL=redis://localhost:6379
OAUTH_ISSUER=http://localhost:8080/default
MITTWALD_OAUTH_CLIENT_ID=mittwald-mcp-server
MITTWALD_OAUTH_CLIENT_SECRET=test-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
JWT_SECRET=test-jwt-secret-for-oauth-tests
```

### Running OAuth Integration Tests

```bash
# Run all OAuth integration tests
npm run test:integration

# Run specific OAuth test files
npm test oauth-authorization-flow
npm test oauth-token-management
npm test oauth-session-management
npm test oauth-middleware-integration
npm test oauth-end-to-end

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Patterns and Best Practices

### Test Structure Pattern

```typescript
describe('OAuth Feature Integration Tests', () => {
  let app: Express;
  let request: supertest.SuperTest<supertest.Test>;
  let sessionManager: SessionManager;
  let redisClient: RedisClient;

  beforeAll(async () => {
    // Initialize test environment
    // Setup OAuth client, app, components
    // Wait for MockOAuth2Server availability
  });

  afterAll(async () => {
    // Cleanup connections
    await redisClient.disconnect?.();
  });

  beforeEach(async () => {
    // Clean Redis state for test isolation
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  });

  afterEach(async () => {
    // Ensure cleanup after each test
  });

  describe('Feature Area', () => {
    it('should handle specific scenario', async () => {
      // Test implementation
    });
  });
});
```

### Mock Data Conventions

- **User IDs**: `test-user-{scenario}` (e.g., `test-user-token-refresh`)
- **Session IDs**: `test-session-{scenario}` 
- **OAuth Tokens**: `oauth-{type}-token-{scenario}` (e.g., `oauth-access-token-123`)
- **Project IDs**: `test-project-{scenario}`

### Error Testing Patterns

- Test both success and failure scenarios
- Validate error message content and structure
- Ensure proper HTTP status codes
- Test error recovery and cleanup
- Validate security measures (no information leakage)

### Performance Testing

- Test concurrent operations
- Validate resource cleanup efficiency
- Test high-load scenarios
- Measure response times for critical operations

## Security Testing

### Areas Covered

1. **State Protection**: CSRF protection via OAuth state parameter
2. **Token Security**: JWT signature validation, expiration checks
3. **Session Security**: Session isolation, proper cleanup
4. **Information Disclosure**: Error responses don't leak sensitive data
5. **PKCE Implementation**: Proper code challenge/verifier handling

### Security Test Examples

```typescript
// State tampering protection
it('should prevent state reuse attacks', async () => {
  // Test state consumption after use
});

// Token validation
it('should reject tokens with invalid signatures', async () => {
  // Test JWT signature validation
});

// Information disclosure prevention
it('should not expose sensitive information in error responses', async () => {
  // Validate error response content
});
```

## Debugging and Troubleshooting

### Common Issues

1. **MockOAuth2Server Not Available**
   - Ensure Docker Compose is running: `docker-compose up -d mock-oauth`
   - Check server availability: `curl http://localhost:8080/default/.well-known/openid-configuration`

2. **Redis Connection Issues**
   - Verify Redis is running: `redis-cli ping`
   - Check Redis URL configuration

3. **Test Timeouts**
   - MockOAuth2Server startup time
   - Redis connection delays
   - Consider increasing test timeouts for CI environments

### Debug Logging

Enable debug logging for troubleshooting:

```bash
DEBUG=oauth:* npm test
```

## Continuous Integration

### CI Configuration

Tests should run with:
- Clean Redis instance per test run
- MockOAuth2Server container
- Proper environment variable configuration
- Test isolation and cleanup

### Performance Expectations

- Individual tests: < 5 seconds
- Full OAuth test suite: < 60 seconds
- Cleanup operations: < 1 second
- High-load tests: < 30 seconds

## Contributing

### Adding New OAuth Tests

1. Follow existing test structure and patterns
2. Include both success and error scenarios
3. Add proper cleanup in `afterEach` hooks
4. Test security aspects where relevant
5. Include performance considerations for resource-intensive operations
6. Update this documentation with new test coverage

### Test Categories to Consider

- **New OAuth Features**: Add comprehensive test coverage
- **Integration Points**: Test interactions with other systems
- **Error Scenarios**: Test edge cases and error conditions
- **Performance**: Test under load and concurrent usage
- **Security**: Validate security measures and protections

---

This OAuth integration test suite provides comprehensive coverage of the OAuth 2.0 implementation, ensuring reliability, security, and performance of the authentication system.