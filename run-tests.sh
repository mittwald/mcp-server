#!/bin/bash

echo "🧪 Mittwald MCP Server Test Suite"
echo "================================="
echo ""

# Check if server is running
echo "1️⃣ Checking server health..."
if curl -s http://localhost:3000/health | grep -q '"status":"ok"'; then
  echo "   ✅ Server is healthy"
else
  echo "   ❌ Server is not responding"
  echo "   Please run: docker compose up -d"
  exit 1
fi

# Check Mittwald authentication
echo ""
echo "2️⃣ Checking Mittwald API authentication..."
if curl -s http://localhost:3000/test-auth | grep -q '"status":"success"'; then
  echo "   ✅ Mittwald API authenticated"
else
  echo "   ❌ Mittwald API authentication failed"
  exit 1
fi

# Run connection test
echo ""
echo "3️⃣ Testing MCP connection..."
if node test-mcp-connection.js > /dev/null 2>&1; then
  echo "   ✅ MCP connection successful"
else
  echo "   ❌ MCP connection failed"
  exit 1
fi

# Run tools listing test
echo ""
echo "4️⃣ Testing tool listing..."
TOOL_COUNT=$(node test-list-tools.js 2>/dev/null | grep "Total tools available:" | grep -o '[0-9]*')
if [ -n "$TOOL_COUNT" ] && [ "$TOOL_COUNT" -gt 0 ]; then
  echo "   ✅ Found $TOOL_COUNT tools"
else
  echo "   ❌ Tool listing failed"
  exit 1
fi

# Run resource test
echo ""
echo "5️⃣ Testing Mittwald resources..."
if node test-mittwald-resources.js > /dev/null 2>&1; then
  echo "   ✅ Resource testing successful"
else
  echo "   ❌ Resource testing failed"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "📊 Test Summary:"
echo "   - Server Health: ✅"
echo "   - Mittwald Auth: ✅"
echo "   - MCP Connection: ✅"
echo "   - Tool Listing: ✅ ($TOOL_COUNT tools)"
echo "   - Resource Access: ✅"
echo ""
echo "🚀 The Mittwald MCP server is working correctly!"