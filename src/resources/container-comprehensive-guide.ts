import type { Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Resource that provides comprehensive container operations guide
 * This helps LLMs understand Mittwald's container infrastructure and avoid common pitfalls
 */
export const containerComprehensiveGuideResource: Resource = {
  uri: 'mittwald://container-comprehensive-guide',
  name: 'Mittwald Container Operations Complete Guide',
  description: 'Comprehensive guide for safely working with Mittwald container stacks, including safety guidelines, common pitfalls, and best practices',
  mimeType: 'text/markdown'
};

export const containerComprehensiveGuideContent = `# Mittwald Container Operations Complete Guide

## ⚠️ CRITICAL WARNING: Declarative Stack API

The \`mittwald_container_declare_stack\` tool uses a **declarative** approach, which means:
- It REPLACES the entire stack configuration
- Any services or volumes NOT included in the declaration will be DELETED
- This is NOT additive - it's a complete replacement

## 🛡️ Safe Container Management Workflow

### 1. ALWAYS Check Current State First
Before ANY container operation:
\`\`\`
1. Call mittwald_container_get_stack to see what's currently running
2. Document all existing services and volumes
3. Include ALL existing services you want to keep in any new declaration
\`\`\`

### 2. Required Workflow for Adding Services

**User says:** "Add nginx to my stack"

**CORRECT approach:**
\`\`\`
1. Get current stack state
2. Show user existing services: "Found 3 services: elasticsearch, redis, postgres"
3. Explain: "To add nginx, I need to redeclare with all 4 services"
4. Get confirmation: "This will KEEP existing services and ADD nginx. Proceed?"
5. Declare stack with ALL services
\`\`\`

**WRONG approach:**
\`\`\`
❌ Immediately declaring stack with only nginx
❌ This would DELETE all existing services!
\`\`\`

### 3. Required Confirmations

Always get explicit confirmation when:
- Adding services (show what will be kept)
- Removing services (show what will be deleted)
- Modifying services (show what will change)

### 4. Example Safe Interactions

#### Adding a Service:
\`\`\`
USER: "Add nginx to my project"

ASSISTANT: Let me check your current container setup first...
*calls get_stack*

I found 3 services currently running:
- elasticsearch:8.11 (search engine)
- redis:7-alpine (cache)
- postgres:15 (database)

To add nginx, I'll need to declare a new stack configuration that includes:
✅ KEEP: elasticsearch, redis, postgres (unchanged)
➕ ADD: nginx:latest on port 80

Should I proceed? This will preserve all existing services.
\`\`\`

#### Removing a Service:
\`\`\`
USER: "Remove redis from my stack"

ASSISTANT: Let me check your current setup...
*calls get_stack*

Current services:
- nginx:latest
- redis:7-alpine
- postgres:15

To remove redis, I'll declare a new stack with:
✅ KEEP: nginx, postgres
❌ REMOVE: redis (and any associated data volumes)

⚠️ WARNING: This will permanently delete the redis container and its data.
Are you sure you want to proceed?
\`\`\`

## 🔧 Service Definition Requirements

Every service MUST have:
- \`imageUri\` (required) - The container image
- \`ports\` (required) - Use empty array \`[]\` if no ports needed
- \`description\` (optional but recommended)

Example minimal service:
\`\`\`json
{
  "nginx": {
    "imageUri": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "tcp"}],
    "description": "Web server"
  }
}
\`\`\`

## 🚨 Common Pitfalls and Solutions

### 1. OpenSearch Container Issues

**Problem**: Exit code 64 or immediate crashes
**Solution**: OpenSearch needs specific settings for containers:
\`\`\`json
{
  "environment": {
    "discovery.type": "single-node",
    "OPENSEARCH_JAVA_OPTS": "-Xms512m -Xmx512m",
    "bootstrap.memory_lock": "false",  // Critical for containers!
    "DISABLE_SECURITY_PLUGIN": "true",
    "DISABLE_INSTALL_DEMO_CONFIG": "true"
  }
}
\`\`\`

### 2. Container Stuck in "Creating" State
**Causes**:
- Complex configurations may take longer
- Resource constraints
- Image pull delays

**Solution**: 
- Start with minimal configurations
- Use simpler image tags (e.g., \`:2\` instead of \`:2.11.1\`)
- Be patient - container creation can take 1-2 minutes

### 3. Virtual Host Creation Failures
**Problem**: "Failed to create ingress: No ID returned"
**Solutions**:
- Virtual hosts need existing targets (apps or containers)
- Wait for services to be fully running before creating ingresses
- Use container IDs, not short IDs for path mappings

### 4. Indexer Container Crashes
**Problem**: Alpine containers exiting immediately
**Solutions**:
\`\`\`bash
# DON'T: This exits immediately
command: ["sh", "-c", "apk add curl && sleep infinity"]

# DO: Use proper sleep loop
command: ["sh", "-c", "while true; do sleep 3600; done"]

# OR: Use tail -f
command: ["sh", "-c", "apk add --no-cache curl jq && tail -f /dev/null"]
\`\`\`

## 📋 Recommended Workflow

### Step 1: Check Current State
\`\`\`javascript
// Always start by checking what exists
mittwald_context_get()
mittwald_project_list()
mittwald_container_list_stacks()
mittwald_container_get_stack()
\`\`\`

### Step 2: Plan Your Stack
1. List all services needed
2. Identify dependencies (e.g., dashboards needs opensearch)
3. Plan network communication between services

### Step 3: Deploy Incrementally
\`\`\`javascript
// Start with core services
1. Deploy backend services first (databases, search engines)
2. Wait for them to be running
3. Add frontend services
4. Finally add utility containers (indexers, proxies)
\`\`\`

### Step 4: Verify Services
\`\`\`javascript
// Check service status
mittwald_container_list_services()
// Look for status: "running" not "creating" or "error"
\`\`\`

### Step 5: Configure Access
\`\`\`javascript
// Only after services are running
1. Create virtual hosts
2. Configure domain mappings
3. Test with Puppeteer
\`\`\`

## 🎯 Service-Specific Tips

### OpenSearch
- Disable security plugins for development
- Set explicit memory limits
- Use single-node discovery for simplicity
- Version 2.x is more stable than specific versions

### OpenSearch Dashboards
- Must wait for OpenSearch to be fully running
- Use array format for OPENSEARCH_HOSTS: \`["http://opensearch:9200"]\`
- Disable security plugin to match OpenSearch config

### Nginx Proxy
- Can configure inline with command parameter
- Escape dollar signs in nginx configs: \`\\$host\`
- Mount config volumes if complex configuration needed

## 🐛 Debugging Strategies

### 1. Service Won't Start
- Check logs (may get 502 errors initially)
- Verify environment variables
- Check for typos in service names (internal DNS)
- Ensure ports array is present

### 2. Network Communication Issues
- Services communicate using service names as hostnames
- Use http://servicename:port format
- No https/SSL needed for internal communication

### 3. Virtual Host Issues
- Delete and recreate rather than update
- Check that target service is running
- Use full container IDs for reliability

## ✅ Best Practices

1. **Always Show Current State**: Before any changes, show user what exists
2. **Explain Declarative Nature**: Warn users about deletion risks
3. **Incremental Progress**: Build complex stacks step by step
4. **Patient Waiting**: Services take time to start, don't rush
5. **Fallback Strategies**: Have simpler alternatives ready
6. **Read Before Write**: Always get_stack before declare_stack
7. **Show Your Work**: Display current state to the user
8. **Confirm Changes**: Explicitly list what will be added/kept/removed
9. **Preserve by Default**: Unless told otherwise, keep existing services
10. **Validate Access**: If you get a 403 error, the stack belongs to another project

## 💻 Example Patterns

### Safe Service Addition
\`\`\`python
# 1. Get current services
current = get_stack()
# 2. Build new declaration with ALL services
new_services = current.services + new_service
# 3. Confirm with user
print(f"Keeping: {current.services}, Adding: {new_service}")
# 4. Declare complete stack
declare_stack(services=new_services)
\`\`\`

### Health Check Pattern
\`\`\`python
while True:
    services = list_services()
    if all(s.status == "running" for s in services):
        break
    if any(s.status == "error" for s in services):
        investigate_errors()
    sleep(5)
\`\`\`

## 🔍 Key Mittwald Quirks

1. **Context Setting**: Can set context but may not persist in MCP
2. **Tool Parameters**: Very specific about parameter names (e.g., \`ingressId\` not \`virtualHostId\`)
3. **ID Formats**: Sometimes accepts short IDs, sometimes needs full UUIDs
4. **Async Operations**: Most operations are async, need to poll for completion

## 📊 Volume Persistence

Volumes declared in the stack will:
- Be created if they don't exist
- Be preserved if they already exist
- Be DELETED if not included in new declaration

Always include existing volumes you want to keep!

## 🚫 Common Mistakes to Avoid

1. **Declaring only the new service** - This deletes everything else!
2. **Forgetting the ports array** - Even if empty, it's required
3. **Not checking current state** - Flying blind is dangerous
4. **Assuming additive behavior** - It's replacement, not addition
5. **Using wrong stack IDs** - 403 errors mean no access
6. **Not waiting for services to start** - Creating ingresses too early
7. **Using wrong hostnames** - Service names for internal, domains for external

## 💡 Quick Reference

### Container Commands
- **List all stacks**: \`mittwald_container_list_stacks\`
- **Check current state**: \`mittwald_container_get_stack\`
- **Modify stack**: \`mittwald_container_declare_stack\` (with ALL desired services)
- **View logs**: \`mittwald_container_get_service_logs\`
- **List services**: \`mittwald_container_list_services\`
- **List volumes**: \`mittwald_container_list_volumes\`
- **List registries**: \`mittwald_container_list_registries\`

### Service Status Values
- \`creating\` - Service is being deployed
- \`running\` - Service is operational
- \`error\` - Service failed to start
- \`stopping\` - Service is shutting down

## ✅ Summary Checklist

- [ ] Always check current state before changes
- [ ] Include ALL services in declarations
- [ ] Use proper OpenSearch container settings
- [ ] Wait for services to be "running" not "creating"
- [ ] Create virtual hosts only after services are ready
- [ ] Use service names for internal communication
- [ ] Be patient with container startup times
- [ ] Have fallback approaches ready
- [ ] Test with Puppeteer to verify public access
- [ ] Confirm all changes with the user
- [ ] Show what will be kept, added, and removed

Remember: When in doubt, show the current state and ask for confirmation!

This guide should help future LLM interactions with Mittwald container deployments be more successful and avoid common pitfalls encountered during real-world usage.`;