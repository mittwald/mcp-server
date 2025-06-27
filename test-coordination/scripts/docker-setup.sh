#!/bin/bash
# Docker Setup Script for Testing Coordinator (Agent-2)

set -e

echo "🐳 Starting Docker setup for Mittwald MCP testing..."

# Navigate to main directory
cd /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio

# 1. Clean up any existing containers
echo "📦 Cleaning up existing containers..."
docker-compose down -v

# 2. Ensure we have latest .env
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create it with MITTWALD_API_TOKEN"
    exit 1
fi

# 3. Build fresh container
echo "🔨 Building Docker container..."
docker-compose build --no-cache

# 4. Start container
echo "🚀 Starting Docker container..."
docker-compose up -d

# 5. Wait for container to be healthy
echo "⏳ Waiting for container health check..."
ATTEMPTS=0
MAX_ATTEMPTS=30

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    HEALTH=$(docker inspect mittwald-typescript-mcp-systempromptio_mcp-server-full_1 2>/dev/null | jq -r '.[0].State.Health.Status' || echo "not-found")
    
    if [ "$HEALTH" = "healthy" ]; then
        echo "✅ Container is healthy!"
        break
    fi
    
    echo "   Health status: $HEALTH (attempt $((ATTEMPTS+1))/$MAX_ATTEMPTS)"
    sleep 5
    ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo "❌ Container failed to become healthy!"
    docker-compose logs --tail=50
    exit 1
fi

# 6. Verify API endpoint
echo "🔍 Verifying API endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API endpoint responding at http://localhost:3000"
else
    echo "❌ API endpoint not responding (status: $HTTP_STATUS)"
    docker-compose logs --tail=50
    exit 1
fi

# 7. Set up log monitoring
echo "📝 Setting up log monitoring..."
mkdir -p test-coordination/docker-logs
docker-compose logs -f > test-coordination/docker-logs/mcp-server.log 2>&1 &
LOG_PID=$!
echo $LOG_PID > test-coordination/docker-logs/monitor.pid

# 8. Verify MCP tools are available
echo "🔧 Checking MCP tools availability..."
TOOLS_COUNT=$(curl -s http://localhost:3000/tools | jq '.tools | length' || echo "0")
echo "   Found $TOOLS_COUNT tools available"

if [ "$TOOLS_COUNT" -lt 82 ]; then
    echo "⚠️  Warning: Expected 82 tools but found $TOOLS_COUNT"
fi

# 9. Create Docker health monitoring
cat > test-coordination/status/docker-health.json << EOF
{
  "status": "healthy",
  "container_id": "$(docker ps -q -f name=mcp-server-full)",
  "api_endpoint": "http://localhost:3000",
  "tools_count": $TOOLS_COUNT,
  "log_monitor_pid": $LOG_PID,
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# 10. Create trigger file
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Docker container ready at http://localhost:3000" > test-coordination/triggers/docker-ready.trigger

echo "🎉 Docker setup complete!"
echo ""
echo "📊 Status:"
echo "   - Container: Running and healthy"
echo "   - API: http://localhost:3000"
echo "   - Tools: $TOOLS_COUNT available"
echo "   - Logs: test-coordination/docker-logs/mcp-server.log"
echo ""
echo "Next steps:"
echo "   1. Agents should wait for docker-ready.trigger"
echo "   2. Manual login required after Puppeteer setup"
echo "   3. Monitor logs: tail -f test-coordination/docker-logs/mcp-server.log"