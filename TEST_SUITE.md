# Mittwald MCP Server Test Suite

This directory contains a comprehensive test suite for the Mittwald MCP server running in Docker.

## Overview

The test suite validates that the MCP server is functioning correctly with:
- Proper Streaming HTTP transport implementation
- Mittwald API authentication
- Tool discovery and invocation
- Session management

## Test Files

### Core Test Scripts

1. **`test-mcp-connection.js`**
   - Tests basic MCP connection using Streaming HTTP transport
   - Validates session initialization and management
   - Confirms server capabilities

2. **`test-list-tools.js`**
   - Lists all available Mittwald tools
   - Groups tools by category (app, database, project, etc.)
   - Provides summary statistics

3. **`test-mittwald-resources.js`**
   - Tests actual tool invocation
   - Calls server_list, project_list, and app_list tools
   - Validates response formats

4. **`run-tests.sh`**
   - Comprehensive test runner
   - Checks all aspects of the server
   - Provides pass/fail summary

## Running Tests

### Prerequisites

1. Docker must be running
2. Server must be started: `docker compose up -d`
3. Mittwald API token must be configured in `.env`

### Running Individual Tests

```bash
# Test basic connection
node test-mcp-connection.js

# List all tools
node test-list-tools.js

# Test Mittwald resources
node test-mittwald-resources.js
```

### Running Full Test Suite

```bash
./run-tests.sh
```

## MCP Streaming HTTP Transport

The tests use the official MCP Streaming HTTP transport, which:
- Uses POST requests to `/mcp` endpoint
- Requires `Accept: application/json, text/event-stream` header
- Manages sessions via `mcp-session-id` header
- Returns responses in Server-Sent Events format

## Expected Results

When all tests pass, you should see:
- ✅ Server is healthy
- ✅ Mittwald API authenticated
- ✅ MCP connection successful
- ✅ 106 tools available
- ✅ Resource testing successful

## Troubleshooting

### Server not responding
```bash
docker compose ps  # Check if container is running
docker compose logs  # View server logs
```

### Authentication failed
- Verify `MITTWALD_API_TOKEN` in `.env` file
- Check token permissions in Mittwald dashboard

### Connection errors
- Ensure port 3000 is not in use
- Check Docker networking configuration