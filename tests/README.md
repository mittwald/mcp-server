# Testing

## Current Test Status

The Mittwald MCP Server currently has minimal test coverage focused on core utilities.

### Available Tests

#### Unit Tests
- **Version Filter Tests**: `tests/unit/utils/version-filter.test.ts`
  - Tests for version filtering and sorting functionality
  - Status: ✅ **11/11 PASSING**

### Running Tests

```bash
# Run all tests (currently only unit tests)
npm test

# Run unit tests specifically
npm run test:unit

# Run with coverage
npm run test:coverage
```

## Test Development

### Adding New Tests

The project uses [Vitest](https://vitest.dev/) for testing. To add new tests:

1. Create test files in appropriate directories:
   - `tests/unit/` for unit tests
   - `tests/integration/` for integration tests (when implemented)

2. Follow the naming convention: `*.test.ts`

3. Use Vitest's testing APIs:
   ```typescript
   import { describe, it, expect } from 'vitest';
   
   describe('My Feature', () => {
     it('should work correctly', () => {
       expect(true).toBe(true);
     });
   });
   ```

### Test Categories

#### Unit Tests ✅
- **Purpose**: Test individual functions and utilities
- **Current Status**: Working (11/11 passing)
- **Examples**: Version filtering, utility functions

#### Integration Tests 🚧
- **Purpose**: Test MCP protocol integration and tool handlers
- **Current Status**: Not implemented
- **Future**: CLI wrapper integration tests

#### Functional Tests 🚧
- **Purpose**: End-to-end testing with real Mittwald API
- **Current Status**: Not implemented
- **Future**: Docker container testing, full workflow validation

## Development Notes

### Previous Test Suite

The project previously had extensive integration and functional tests that were built for a different architecture (direct API client usage). These tests were removed as they were:

- Incompatible with the current CLI wrapper architecture
- Using outdated MCP protocol versions
- Expecting different response formats
- Testing non-existent handlers

### Future Test Development

For comprehensive testing of the CLI wrapper architecture, consider:

1. **CLI Execution Tests**: Test `executeCli` wrapper functionality
2. **Tool Handler Tests**: Test individual tool handlers with mocked CLI responses
3. **MCP Protocol Tests**: Test MCP server responses and session management
4. **Docker Integration Tests**: Test the complete Docker deployment

## Test Configuration

### Vitest Configuration

Tests are configured through `vitest.config.ts` (if present) or `package.json` test scripts.

### Environment Variables

Tests may require environment variables:
Note: Tests should use the mock OAuth server and session tokens; do not rely on `MITTWALD_API_TOKEN`.
- `TEST_SERVER_ID`: For functional tests requiring server context

### Docker Testing

For testing the full Docker deployment:

```bash
# Build and run container
docker build -t mittwald-mcp-test .
docker run -d -p 3000:3000 --env-file .env --name mittwald-mcp-test mittwald-mcp-test

# Test health endpoint
curl http://localhost:3000/health

# Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

## Contributing

When adding new functionality:

1. **Always add unit tests** for new utility functions
2. **Consider integration tests** for new tool handlers
3. **Update this README** with new test information
4. **Follow existing patterns** in the unit test structure

---

**Note**: This is a production-ready MCP server with minimal but focused test coverage. The working unit tests validate core functionality, and manual testing procedures are documented for deployment verification.
