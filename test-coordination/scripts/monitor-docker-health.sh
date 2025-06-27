#!/bin/bash
# Continuous Docker Health Monitoring Script

COORDINATION_DIR="/Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/test-coordination"
CHECK_INTERVAL=30

echo "🔍 Starting Docker health monitoring (checking every ${CHECK_INTERVAL}s)..."

while true; do
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Check if container exists
    CONTAINER_ID=$(docker ps -q -f name=mcp-server-full)
    if [ -z "$CONTAINER_ID" ]; then
        STATUS="container-not-found"
        API_STATUS="000"
        HEALTH="unknown"
    else
        # Get container health
        HEALTH=$(docker inspect $CONTAINER_ID 2>/dev/null | jq -r '.[0].State.Health.Status' || echo "unknown")
        
        # Check API endpoint
        API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
        
        # Get container stats
        STATS=$(docker stats --no-stream --format "json" $CONTAINER_ID 2>/dev/null || echo '{}')
        
        if [ "$HEALTH" = "healthy" ] && [ "$API_STATUS" = "200" ]; then
            STATUS="healthy"
        else
            STATUS="unhealthy"
        fi
    fi
    
    # Get log file size
    LOG_SIZE="0"
    if [ -f "$COORDINATION_DIR/docker-logs/mcp-server.log" ]; then
        LOG_SIZE=$(du -h "$COORDINATION_DIR/docker-logs/mcp-server.log" | cut -f1)
    fi
    
    # Count recent errors in logs (last 100 lines)
    ERROR_COUNT=0
    if [ -f "$COORDINATION_DIR/docker-logs/mcp-server.log" ]; then
        ERROR_COUNT=$(tail -100 "$COORDINATION_DIR/docker-logs/mcp-server.log" | grep -c "ERROR\|FAIL\|Exception" || echo "0")
    fi
    
    # Update health status
    cat > "$COORDINATION_DIR/status/docker-health.json" << EOF
{
  "status": "$STATUS",
  "container_health": "$HEALTH",
  "api_status": "$API_STATUS",
  "container_id": "$CONTAINER_ID",
  "logs_size": "$LOG_SIZE",
  "recent_errors": $ERROR_COUNT,
  "last_check": "$TIMESTAMP",
  "stats": $STATS
}
EOF
    
    # Alert on issues
    if [ "$STATUS" != "healthy" ]; then
        ALERT="⚠️ DOCKER ISSUE at $TIMESTAMP: Status=$STATUS, Health=$HEALTH, API=$API_STATUS"
        echo "$ALERT"
        echo "$ALERT" >> "$COORDINATION_DIR/alerts.log"
        
        # Try to capture recent logs for debugging
        if [ ! -z "$CONTAINER_ID" ]; then
            echo "Recent container logs:" >> "$COORDINATION_DIR/alerts.log"
            docker logs --tail=20 $CONTAINER_ID >> "$COORDINATION_DIR/alerts.log" 2>&1
        fi
    fi
    
    # Check if log monitor is still running
    if [ -f "$COORDINATION_DIR/docker-logs/monitor.pid" ]; then
        LOG_PID=$(cat "$COORDINATION_DIR/docker-logs/monitor.pid")
        if ! ps -p $LOG_PID > /dev/null 2>&1; then
            echo "⚠️ Log monitor stopped, restarting..."
            docker-compose logs -f > "$COORDINATION_DIR/docker-logs/mcp-server.log" 2>&1 &
            echo $! > "$COORDINATION_DIR/docker-logs/monitor.pid"
        fi
    fi
    
    sleep $CHECK_INTERVAL
done