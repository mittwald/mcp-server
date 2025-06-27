# 🧪 MITTWALD MCP FUNCTIONAL TESTING SWARM PLAN V2
## With Puppeteer MCP Integration & Dependency-Based Coordination

This plan coordinates 14 agents to test all 82 Mittwald tools using their built-in Puppeteer MCP server for UI validation, with sophisticated dependency management and manual login coordination.

## 🔑 **CRITICAL UPDATES FROM V1**

1. **Puppeteer is an MCP Server** - Agents must use `mcp__toolbase__puppeteer_*` tools
2. **Manual Login Required** - Coordinated login phases for UI access
3. **Dependency Triggers** - Sophisticated wait/notify system
4. **Existing Projects** - Use the 2 existing projects on server

## 📋 **DEPENDENCY-BASED COORDINATION STRATEGY**

### **Coordination Infrastructure**

```bash
# Main coordination directory structure
/Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/test-coordination/
├── status/
│   ├── agent-{id}-status.json      # Individual agent status
│   ├── dependencies.json           # Dependency graph
│   └── global-progress.json        # Overall test progress
├── triggers/
│   ├── login-ready.trigger         # Login coordination
│   ├── projects-ready.trigger      # Project availability
│   └── {dependency}.trigger        # Dynamic triggers
├── screenshots/
│   └── {agent-id}/{timestamp}_{tool}_{status}.png
└── reports/
    └── {agent-id}_final_report.md
```

### **Agent Status Schema**

```json
{
  "agentId": "agent-1-user",
  "status": "waiting_for_login",
  "progress": {
    "totalTools": 8,
    "completed": 0,
    "failed": 0,
    "inProgress": 0
  },
  "dependencies": {
    "required": ["login-ready"],
    "provides": ["user-api-tested"]
  },
  "currentOperation": "Waiting for manual login",
  "lastUpdate": "2025-01-27T14:30:00Z"
}
```

## 🔐 **PHASE 0: MANUAL LOGIN COORDINATION**

### **Login Coordinator (You)**
**Duration:** 5 minutes
**Action Required:** Login to Mittwald UI when prompted

```bash
# Agent-1 initiates login sequence
1. Agent-1 uses Puppeteer MCP to navigate to https://studio.mittwald.de
2. Agent-1 takes screenshot and waits for manual login
3. You perform manual login
4. Agent-1 detects successful login and creates trigger
5. All agents receive login-ready signal
```

## 🌊 **TESTING PHASES WITH DEPENDENCIES**

### **PHASE 1: Project Discovery & Setup**
**Trigger Required:** `login-ready`
**Duration:** 15 minutes

#### **Agent-2: Project Discovery & Preparation**
```yaml
dependencies:
  requires: ["login-ready"]
  provides: ["projects-cataloged", "project-assignments"]
actions:
  - Use Puppeteer MCP to navigate to projects page
  - Discover existing 2 projects on server
  - Document project IDs and current state
  - Create project assignment mapping
  - Trigger: "projects-ready"
```

### **PHASE 2: Parallel Account-Level Testing**
**Trigger Required:** `login-ready`
**Duration:** 30 minutes
**Parallel Execution:** 4 agents

#### **Testing Group Configuration**
```yaml
Agent-1 (User API):
  dependencies:
    requires: ["login-ready"]
    provides: ["user-api-tested"]
  puppeteer_sequence:
    - mcp__toolbase__puppeteer_navigate: {url: "https://studio.mittwald.de/profile"}
    - mcp__toolbase__puppeteer_screenshot: {name: "user_profile_initial"}
    - Test each API endpoint with UI validation
    - Document response times and UI state changes

Agent-10 (Notification API):
  dependencies:
    requires: ["login-ready"]
    provides: ["notification-api-tested"]
  parallel_with: ["Agent-1", "Agent-11", "Agent-12"]

Agent-11 (Conversation API):
  dependencies:
    requires: ["login-ready"]  
    provides: ["conversation-api-tested"]
  parallel_with: ["Agent-1", "Agent-10", "Agent-12"]

Agent-12 (Customer API):
  dependencies:
    requires: ["login-ready"]
    provides: ["customer-api-tested"]
  parallel_with: ["Agent-1", "Agent-10", "Agent-11"]
```

### **PHASE 3: Project-Dependent Testing**
**Trigger Required:** `projects-ready`
**Duration:** 45 minutes
**Resource Allocation:** Split existing 2 projects

#### **Project Assignment**
```yaml
Project-1 (existing):
  assigned_to: ["Agent-3", "Agent-7", "Agent-8", "Agent-13"]
  type: "light-resource-testing"

Project-2 (existing):  
  assigned_to: ["Agent-4", "Agent-5", "Agent-6", "Agent-9"]
  type: "heavy-resource-testing"

Agent-14 (App API):
  special_allocation: "Requires clean state - coordinate with Project-2"
```

## 🤖 **AGENT-SPECIFIC PUPPETEER INSTRUCTIONS**

### **Example: Agent-1 User API Testing**

```markdown
## Your Testing Instructions

You have access to Puppeteer through MCP tools. Use these tools for UI validation:
- mcp__toolbase__puppeteer_navigate
- mcp__toolbase__puppeteer_screenshot  
- mcp__toolbase__puppeteer_click
- mcp__toolbase__puppeteer_fill
- mcp__toolbase__puppeteer_evaluate

### Phase 0: Login Coordination
1. Navigate to https://studio.mittwald.de
2. Take screenshot "login_page_ready"
3. Update your status: "waiting_for_manual_login"
4. Wait for file: ./coordination/triggers/login-ready.trigger
5. Once trigger exists, proceed with testing

### Phase 1: User API Testing Sequence
For each API endpoint:
1. Call the API endpoint
2. Navigate to relevant UI page
3. Take before screenshot
4. Verify UI reflects API state
5. Take after screenshot
6. Document results

Example for mittwald_user_get_profile:
```javascript
// 1. Call API
const profile = await mittwald_user_get_profile();

// 2. Navigate to profile page
await mcp__toolbase__puppeteer_navigate({
  url: "https://studio.mittwald.de/profile"
});

// 3. Wait for page load
await mcp__toolbase__puppeteer_evaluate({
  script: "document.readyState === 'complete'"
});

// 4. Take screenshot
await mcp__toolbase__puppeteer_screenshot({
  name: "user_profile_api_validated",
  selector: ".profile-container"
});

// 5. Verify data matches
await mcp__toolbase__puppeteer_evaluate({
  script: `
    const displayName = document.querySelector('.profile-name')?.textContent;
    const email = document.querySelector('.profile-email')?.textContent;
    return {
      nameMatch: displayName?.includes('${profile.name}'),
      emailMatch: email === '${profile.email}'
    };
  `
});
```

### Status Updates
Update your status file every 5 operations:
```bash
echo '{
  "agentId": "agent-1-user",
  "status": "testing",
  "progress": {"completed": 5, "total": 8},
  "lastUpdate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}' > ./coordination/status/agent-1-status.json
```
```

## 🔄 **DEPENDENCY MANAGEMENT SYSTEM**

### **Trigger Creation**
```bash
# When a dependency is satisfied, create trigger file
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Dependency satisfied by Agent-X" > ./coordination/triggers/{dependency}.trigger
```

### **Trigger Monitoring**
```bash
# Agents monitor for their required triggers
while [ ! -f "./coordination/triggers/projects-ready.trigger" ]; do
  sleep 10
  echo "Waiting for projects-ready trigger..."
done
```

### **Dependency Graph**
```json
{
  "phases": {
    "login": {
      "provides": ["login-ready"],
      "required_by": ["all-agents"]
    },
    "project-discovery": {
      "requires": ["login-ready"],
      "provides": ["projects-ready", "project-assignments"],
      "agent": "agent-2"
    },
    "account-testing": {
      "requires": ["login-ready"],
      "provides": ["account-apis-tested"],
      "agents": ["agent-1", "agent-10", "agent-11", "agent-12"]
    },
    "resource-testing": {
      "requires": ["projects-ready"],
      "provides": ["resource-apis-tested"],
      "agents": ["agent-3", "agent-4", "agent-5", "agent-6", "agent-7", "agent-8", "agent-9", "agent-13"]
    },
    "app-testing": {
      "requires": ["resource-apis-tested"],
      "provides": ["all-tests-complete"],
      "agent": "agent-14"
    }
  }
}
```

## 📸 **PUPPETEER MCP SCREENSHOT STRATEGY**

### **Screenshot Naming Convention**
```
{timestamp}_{agentId}_{toolName}_{operation}_{status}.png

Examples:
20250127_143022_agent1_user_authenticate_before_pending.png
20250127_143025_agent1_user_authenticate_after_success.png
20250127_143030_agent1_user_profile_validated_success.png
```

### **Required Screenshots Per Tool**
1. **API Call Initiated** - UI state before operation
2. **API Response Received** - Immediate UI changes
3. **UI Validation Complete** - Final state verification
4. **Error States** - Any failures or unexpected states

## 🔧 **AGENT WORKTREE SETUP WITH MCP**

```bash
# Each agent's setup script
#!/bin/bash
AGENT_ID="agent-1-user"
DOMAIN="user"

# 1. Create worktree
cd /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio
git worktree add ../test-${DOMAIN} feat/integrate-all-apis

# 2. Setup in worktree
cd ../test-${DOMAIN}
npm install
npm run build

# 3. Create coordination symlink
ln -s ../mittwald-typescript-mcp-systempromptio/test-coordination ./coordination

# 4. Initialize agent status
cat > ./coordination/status/${AGENT_ID}-status.json << EOF
{
  "agentId": "${AGENT_ID}",
  "status": "initializing",
  "progress": {"totalTools": 0, "completed": 0},
  "dependencies": {"required": ["login-ready"], "provides": ["${DOMAIN}-api-tested"]},
  "lastUpdate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# 5. Start monitoring for triggers
./monitor-triggers.sh &
```

## 🚨 **CRITICAL COORDINATION RULES**

1. **USE PUPPETEER MCP** - All UI interactions via `mcp__toolbase__puppeteer_*` tools
2. **WAIT FOR LOGIN** - No agent proceeds until manual login is complete
3. **RESPECT DEPENDENCIES** - Check trigger files before starting
4. **UPDATE STATUS FREQUENTLY** - Every 5 operations minimum
5. **CAPTURE ALL STATES** - Success, failure, and edge cases
6. **COORDINATE RESOURCES** - Don't conflict with other agents' operations

## 📊 **MONITORING & PROGRESS TRACKING**

### **Real-time Dashboard** (for you to monitor)
```bash
# Monitor all agent statuses
watch -n 5 'for f in test-coordination/status/*.json; do echo "=== $(basename $f) ==="; cat $f | jq -r "[.agentId, .status, .progress.completed, .progress.totalTools] | @tsv"; done'

# Check triggers
ls -la test-coordination/triggers/

# Count screenshots
find test-coordination/screenshots -name "*.png" | wc -l
```

## 🎯 **SUCCESS METRICS**

- ✅ All 82 tools tested with Puppeteer UI validation
- ✅ Manual login coordination successful
- ✅ Dependency triggers properly managed
- ✅ No resource conflicts between agents
- ✅ Comprehensive screenshot evidence
- ✅ All API responses validated against UI state

## 🐛 **TROUBLESHOOTING**

### **Agent Stuck Waiting**
```bash
# Check missing dependencies
cat coordination/status/agent-X-status.json | jq .dependencies.required
ls coordination/triggers/

# Force trigger if needed (only in emergencies)
echo "MANUAL: Forced by operator" > coordination/triggers/projects-ready.trigger
```

### **Puppeteer Connection Issues**
```bash
# Agents should retry with longer timeout
await mcp__toolbase__puppeteer_navigate({
  url: "https://studio.mittwald.de",
  allowDangerous: false,
  launchOptions: { headless: false, args: ['--no-sandbox'] }
});
```

This sophisticated plan addresses all the issues from V1:
- Proper Puppeteer MCP usage instructions
- Manual login coordination
- Dependency-based triggers
- Use of existing projects
- Real-time status monitoring