#!/bin/bash

echo "Testing MCP response size logging..."

# First, initialize a session
echo -e "\n0. Initializing MCP session:"
SESSION_ID=$(curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "capabilities": {}
    },
    "id": 0
  }' 2>/dev/null | jq -r '.result.sessionId // empty')

echo "   Session ID: $SESSION_ID"

# Test 1: Tool list (should be large)
echo -e "\n1. Testing tools/list request:"
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }' 2>/dev/null | jq -r '.result.tools | length' | xargs -I {} echo "   Response contains {} tools"

# Test 2: Single tool call (should be small)
echo -e "\n2. Testing single tool call:"
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "mittwald_project_list",
      "arguments": {}
    },
    "id": 2
  }' 2>/dev/null | jq -r '.result.content[0].text // "No content"' | head -20

echo -e "\n3. Checking Docker logs for response size entries:"
docker logs mittwald-typescript-mcp-systempromptio-mcp-server-full-1 2>&1 | grep -E "response size|Tool list response" | tail -10