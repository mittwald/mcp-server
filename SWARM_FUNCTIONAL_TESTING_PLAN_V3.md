# 🧪 MITTWALD MCP FUNCTIONAL TESTING SWARM PLAN V3
## Docker-Based Testing with Puppeteer MCP & Advanced Coordination

This plan coordinates 14 agents to test all 82 Mittwald tools by running the MCP server in Docker, using Puppeteer MCP for UI validation, with sophisticated dependency management.

## 🔑 **CRITICAL UPDATES FROM V2**

1. **Docker Container Testing** - MCP server runs in Docker, agents test against it
2. **Log Monitoring** - Agents monitor Docker logs for validation
3. **Endpoint Testing** - Test actual MCP endpoints at http://localhost:3000
4. **Dual Validation** - API responses AND UI state verification

## 🐳 **DOCKER INFRASTRUCTURE SETUP**

### **Phase -1: Docker Preparation (Coordinated by Agent-2)**

```bash
# Agent-2 is responsible for Docker setup and monitoring
cd /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio

# 1. Start Docker container
docker-compose down
docker-compose build
docker-compose up -d

# 2. Wait for healthy state
until docker-compose ps | grep "healthy"; do
  echo "Waiting for container to be healthy..."
  sleep 5
done

# 3. Create Docker monitoring infrastructure
mkdir -p test-coordination/docker-logs
docker-compose logs -f > test-coordination/docker-logs/mcp-server.log 2>&1 &

# 4. Signal Docker ready
echo "$(date): Docker container healthy at http://localhost:3000" > test-coordination/triggers/docker-ready.trigger
```

## 📋 **ENHANCED COORDINATION STRATEGY**

### **Updated Coordination Structure**
```
test-coordination/
├── status/
│   ├── agent-{id}-status.json
│   └── docker-health.json          # Docker container status
├── triggers/
│   ├── docker-ready.trigger        # Container is healthy
│   ├── login-ready.trigger         # Manual login complete
│   └── {dependency}.trigger
├── docker-logs/
│   ├── mcp-server.log             # Real-time container logs
│   └── api-calls.log              # Filtered API call logs
├── screenshots/
│   └── {agent-id}/
├── api-responses/
│   └── {agent-id}/{tool-name}-response.json
└── reports/
```

## 🚀 **TESTING PHASES WITH DOCKER INTEGRATION**

### **PHASE 0: Infrastructure & Login Setup**
**Duration:** 10 minutes

#### **Step 1: Docker Container Launch**
```yaml
Agent-2 (Infrastructure Lead):
  responsibilities:
    - Start Docker container
    - Monitor health endpoint
    - Set up log streaming
    - Create docker-ready trigger
  validation:
    - GET http://localhost:3000/health returns 200
    - Logs show "Server listening on port 3000"
```

#### **Step 2: MCP Connection Test**
```yaml
All Agents:
  wait_for: ["docker-ready"]
  actions:
    - Connect to MCP server at http://localhost:3000
    - Verify tool listing: GET /tools
    - Confirm all 82 tools available
```

#### **Step 3: Manual Login Coordination**
```yaml
Agent-1 (Login Coordinator):
  wait_for: ["docker-ready"]
  actions:
    - Use Puppeteer to open https://studio.mittwald.de
    - Screenshot login page
    - Wait for manual login
    - Verify login success
    - Create login-ready trigger
```

### **PHASE 1: API Endpoint Testing with Docker Validation**

Each agent follows this testing pattern:

```javascript
// Example for Agent-1 testing mittwald_user_get_profile

// 1. Monitor Docker logs for this specific call
const logStream = spawn('tail', ['-f', './coordination/docker-logs/mcp-server.log']);
const logCapture = [];

// 2. Make API call to Docker container
const response = await fetch('http://localhost:3000/call-tool', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MITTWALD_API_TOKEN}`
  },
  body: JSON.stringify({
    tool: 'mittwald_user_get_profile',
    arguments: {}
  })
});

// 3. Capture response
const apiResult = await response.json();
fs.writeFileSync(
  `./coordination/api-responses/agent-1/user_get_profile-response.json`,
  JSON.stringify(apiResult, null, 2)
);

// 4. Extract relevant logs
const relevantLogs = logCapture.filter(line => 
  line.includes('mittwald_user_get_profile') || 
  line.includes('profile') ||
  line.includes('ERROR')
);

// 5. Validate with Puppeteer UI
await mcp__toolbase__puppeteer_navigate({
  url: "https://studio.mittwald.de/app/profile"
});

await mcp__toolbase__puppeteer_screenshot({
  name: "user_profile_ui_state"
});

// 6. Compare API response with UI state
const uiValidation = await mcp__toolbase__puppeteer_evaluate({
  script: `
    const uiData = {
      name: document.querySelector('.profile-name')?.textContent,
      email: document.querySelector('.profile-email')?.textContent
    };
    const apiData = ${JSON.stringify(apiResult.data)};
    return {
      matches: uiData.email === apiData.email,
      uiData,
      apiData
    };
  `
});
```

## 🤖 **AGENT-SPECIFIC DOCKER TESTING INSTRUCTIONS**

### **Agent Docker Testing Template**

```markdown
## Docker Container Testing Protocol

### Prerequisites
1. Ensure Docker container is running: `docker-compose ps`
2. Verify health: `curl http://localhost:3000/health`
3. Monitor logs: `tail -f test-coordination/docker-logs/mcp-server.log`

### For Each Tool Test:

1. **Clear Log Marker**
   ```bash
   echo "=== TEST START: ${TOOL_NAME} at $(date) ===" >> docker-logs/mcp-server.log
   ```

2. **Make MCP Tool Call**
   ```javascript
   const toolResponse = await fetch('http://localhost:3000/call-tool', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${process.env.MITTWALD_API_TOKEN}`
     },
     body: JSON.stringify({
       tool: toolName,
       arguments: toolArgs
     })
   });
   ```

3. **Capture Docker Logs**
   ```bash
   # Extract logs for this tool call
   sed -n "/TEST START: ${TOOL_NAME}/,/TEST END: ${TOOL_NAME}/p" \
     docker-logs/mcp-server.log > api-responses/${AGENT_ID}/${TOOL_NAME}-logs.txt
   ```

4. **Validate Response Structure**
   - Check HTTP status code
   - Verify response has expected fields
   - Save full response for analysis

5. **UI Validation with Puppeteer**
   - Navigate to relevant Mittwald page
   - Screenshot before/after states
   - Verify UI reflects API changes

6. **Log Analysis**
   - Check for errors in Docker logs
   - Verify Mittwald API was called
   - Confirm response was processed
```

### **Example: Agent-4 Database API Testing**

```bash
#!/bin/bash
AGENT_ID="agent-4-database"

# Wait for dependencies
while [ ! -f "./coordination/triggers/projects-ready.trigger" ]; do
  sleep 10
done

# Get assigned project
PROJECT_ID=$(grep "test-project-db:" ./coordination/project-assignments.txt | cut -d' ' -f2)

# Test MySQL Database Creation
echo "=== TEST START: mittwald_mysql_database_create at $(date) ===" >> docker-logs/mcp-server.log

# Make API call via Docker container
curl -X POST http://localhost:3000/call-tool \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MITTWALD_API_TOKEN}" \
  -d '{
    "tool": "mittwald_mysql_database_create",
    "arguments": {
      "projectId": "'${PROJECT_ID}'",
      "name": "test_db_'$(date +%s)'",
      "description": "Automated test database"
    }
  }' > api-responses/${AGENT_ID}/mysql_create-response.json

echo "=== TEST END: mittwald_mysql_database_create at $(date) ===" >> docker-logs/mcp-server.log

# Extract and analyze logs
grep -A 20 -B 5 "mittwald_mysql_database_create" docker-logs/mcp-server.log \
  > api-responses/${AGENT_ID}/mysql_create-logs.txt

# Validate with Puppeteer
node -e "
const validateDatabase = async () => {
  // Navigate to databases page
  await mcp__toolbase__puppeteer_navigate({
    url: 'https://studio.mittwald.de/app/projects/${PROJECT_ID}/databases'
  });
  
  // Wait for list to load
  await new Promise(r => setTimeout(r, 3000));
  
  // Screenshot database list
  await mcp__toolbase__puppeteer_screenshot({
    name: 'mysql_database_created',
    selector: '.database-list'
  });
  
  // Check if our database appears
  const dbExists = await mcp__toolbase__puppeteer_evaluate({
    script: \"Array.from(document.querySelectorAll('.database-name')).some(el => el.textContent.includes('test_db'))\"
  });
  
  console.log('Database visible in UI:', dbExists);
};
validateDatabase();
"
```

## 📊 **DOCKER LOG ANALYSIS PATTERNS**

### **What to Look For in Logs**

```bash
# Success patterns
✅ "Tool call successful: mittwald_*"
✅ "Mittwald API response: 200"
✅ "Successfully created/updated/deleted"

# Error patterns  
❌ "Tool call failed:"
❌ "Mittwald API error:"
❌ "Authentication failed"
❌ "Rate limit exceeded"

# Performance patterns
⏱️ "API call took: XXXms"
⏱️ "Total execution time:"
```

### **Log Monitoring Script for Agents**

```bash
#!/bin/bash
# monitor-docker-logs.sh

AGENT_ID=$1
TOOL_NAME=$2

# Start monitoring before API call
MARKER="TEST_${AGENT_ID}_${TOOL_NAME}_$(date +%s)"
echo "=== $MARKER START ===" >> docker-logs/mcp-server.log

# Make your API call here
# ...

echo "=== $MARKER END ===" >> docker-logs/mcp-server.log

# Extract relevant logs
sed -n "/$MARKER START/,/$MARKER END/p" docker-logs/mcp-server.log > \
  "api-responses/${AGENT_ID}/${TOOL_NAME}-docker-logs.txt"

# Check for errors
if grep -q "ERROR\|Failed\|Exception" "api-responses/${AGENT_ID}/${TOOL_NAME}-docker-logs.txt"; then
  echo "❌ Errors detected in Docker logs for $TOOL_NAME"
  exit 1
else
  echo "✅ No errors in Docker logs for $TOOL_NAME"
fi
```

## 🔄 **CONTINUOUS DOCKER HEALTH MONITORING**

### **Agent-2: Docker Monitor Role**

```bash
#!/bin/bash
# Agent-2 runs this continuously

while true; do
  # Check container health
  HEALTH=$(docker inspect mittwald-typescript-mcp-systempromptio_mcp-server-full_1 \
    --format='{{.State.Health.Status}}')
  
  # Check API endpoint
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
  
  # Update status
  cat > test-coordination/status/docker-health.json << EOF
{
  "container_health": "$HEALTH",
  "api_status": "$API_STATUS",
  "logs_size": "$(du -h test-coordination/docker-logs/mcp-server.log | cut -f1)",
  "last_check": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "uptime": "$(docker ps --format 'table {{.Status}}' | grep mcp-server)"
}
EOF

  # Alert if unhealthy
  if [ "$HEALTH" != "healthy" ] || [ "$API_STATUS" != "200" ]; then
    echo "⚠️ DOCKER UNHEALTHY: Health=$HEALTH, API=$API_STATUS" | tee -a test-coordination/alerts.log
  fi
  
  sleep 30
done
```

## 🎯 **SUCCESS CRITERIA WITH DOCKER VALIDATION**

1. ✅ All 82 tools successfully called via Docker container
2. ✅ Docker logs show successful Mittwald API interactions
3. ✅ No errors or exceptions in container logs
4. ✅ API responses match expected schema
5. ✅ UI screenshots confirm API changes
6. ✅ Performance metrics captured from logs
7. ✅ Container remains healthy throughout testing

## 🚨 **DOCKER TROUBLESHOOTING**

### **Container Issues**
```bash
# Restart container if needed
docker-compose restart
docker-compose logs --tail=100

# Check resource usage
docker stats mittwald-typescript-mcp-systempromptio_mcp-server-full_1

# Inspect container
docker exec -it mittwald-typescript-mcp-systempromptio_mcp-server-full_1 sh
```

### **API Connection Issues**
```bash
# Test from inside container
docker exec mittwald-typescript-mcp-systempromptio_mcp-server-full_1 \
  wget -O- http://localhost:3000/health

# Check exposed ports
docker port mittwald-typescript-mcp-systempromptio_mcp-server-full_1
```

This V3 plan integrates Docker container testing with the sophisticated coordination system, ensuring comprehensive validation of the MCP server implementation.