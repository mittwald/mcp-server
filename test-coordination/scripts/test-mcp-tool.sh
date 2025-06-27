#!/bin/bash
# Helper script for agents to test MCP tools against Docker container

# Usage: ./test-mcp-tool.sh <agent-id> <tool-name> <json-args>
# Example: ./test-mcp-tool.sh agent-1 mittwald_user_get_profile '{}'

AGENT_ID=$1
TOOL_NAME=$2
TOOL_ARGS=$3

if [ -z "$AGENT_ID" ] || [ -z "$TOOL_NAME" ]; then
    echo "Usage: $0 <agent-id> <tool-name> [json-args]"
    exit 1
fi

# Default to empty object if no args provided
if [ -z "$TOOL_ARGS" ]; then
    TOOL_ARGS='{}'
fi

# Ensure output directories exist
mkdir -p "test-coordination/api-responses/$AGENT_ID"
mkdir -p "test-coordination/docker-logs/tool-calls"

# Create unique test ID
TEST_ID="${AGENT_ID}_${TOOL_NAME}_$(date +%s)"
LOG_MARKER="=== TEST $TEST_ID ==="

# Mark start in Docker logs
echo "$LOG_MARKER START at $(date)" >> test-coordination/docker-logs/mcp-server.log

# Prepare the request
REQUEST_FILE="test-coordination/api-responses/$AGENT_ID/${TOOL_NAME}-request.json"
cat > "$REQUEST_FILE" << EOF
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "$TOOL_NAME",
    "arguments": $TOOL_ARGS
  },
  "id": "$TEST_ID"
}
EOF

echo "📡 Calling MCP tool: $TOOL_NAME"
echo "   Agent: $AGENT_ID"
echo "   Args: $TOOL_ARGS"

# Make the API call
RESPONSE_FILE="test-coordination/api-responses/$AGENT_ID/${TOOL_NAME}-response.json"
HTTP_STATUS=$(curl -s -w "\n%{http_code}" \
    -X POST http://localhost:3000 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${MITTWALD_API_TOKEN}" \
    -d @"$REQUEST_FILE" \
    -o "$RESPONSE_FILE")

# Extract HTTP status code
STATUS_CODE=$(echo "$HTTP_STATUS" | tail -1)
echo "   HTTP Status: $STATUS_CODE"

# Mark end in Docker logs
echo "$LOG_MARKER END at $(date)" >> test-coordination/docker-logs/mcp-server.log

# Extract relevant logs for this call
LOGS_FILE="test-coordination/docker-logs/tool-calls/${TEST_ID}.log"
sleep 1  # Give logs time to flush
sed -n "/$LOG_MARKER START/,/$LOG_MARKER END/p" test-coordination/docker-logs/mcp-server.log > "$LOGS_FILE"

# Analyze response
if [ "$STATUS_CODE" = "200" ]; then
    # Check if response contains error
    if jq -e '.error' "$RESPONSE_FILE" > /dev/null 2>&1; then
        ERROR_MSG=$(jq -r '.error.message // .error' "$RESPONSE_FILE")
        echo "❌ Tool returned error: $ERROR_MSG"
        exit 2
    else
        # Extract result
        RESULT=$(jq '.result' "$RESPONSE_FILE")
        echo "✅ Tool call successful"
        echo "   Result preview: $(echo "$RESULT" | jq -c . | head -c 100)..."
        
        # Save formatted result
        echo "$RESULT" | jq . > "test-coordination/api-responses/$AGENT_ID/${TOOL_NAME}-result.json"
    fi
else
    echo "❌ HTTP request failed with status $STATUS_CODE"
    echo "   Response: $(cat "$RESPONSE_FILE")"
    exit 1
fi

# Check logs for errors
if grep -q "ERROR\|Exception\|Failed" "$LOGS_FILE"; then
    echo "⚠️  Errors found in Docker logs:"
    grep "ERROR\|Exception\|Failed" "$LOGS_FILE" | head -5
fi

# Performance info
if grep -q "execution time\|took" "$LOGS_FILE"; then
    echo "⏱️  Performance:"
    grep -i "time\|took\|duration" "$LOGS_FILE" | tail -3
fi

echo "📁 Output files:"
echo "   - Request: $REQUEST_FILE"
echo "   - Response: $RESPONSE_FILE"
echo "   - Logs: $LOGS_FILE"