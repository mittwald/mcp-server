import type { Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Resource that provides safety guidelines for container operations
 * This helps LLMs understand the dangerous nature of declare_stack
 */
export const containerSafetyGuideResource: Resource = {
  uri: 'mittwald://container-safety-guide',
  name: 'Container Operations Safety Guide',
  description: 'Critical safety information for working with Mittwald container stacks',
  mimeType: 'text/markdown'
};

export const containerSafetyGuideContent = `# Mittwald Container Operations Safety Guide

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

### 5. Container Service Requirements

When declaring services, remember:
- \`imageUri\` is REQUIRED (the container image)
- \`ports\` is REQUIRED (use empty array [] if no ports needed)
- \`description\` is optional but recommended
- \`environment\` for environment variables
- \`volumes\` for persistent storage

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

### 6. Volume Persistence

Volumes declared in the stack will:
- Be created if they don't exist
- Be preserved if they already exist
- Be DELETED if not included in new declaration

Always include existing volumes you want to keep!

### 7. Best Practices

1. **Read Before Write**: Always get_stack before declare_stack
2. **Show Your Work**: Display current state to the user
3. **Confirm Changes**: Explicitly list what will be added/kept/removed
4. **Preserve by Default**: Unless told otherwise, keep existing services
5. **Validate Access**: If you get a 403 error, the stack belongs to another project

## 🚨 Common Mistakes to Avoid

1. **Declaring only the new service** - This deletes everything else!
2. **Forgetting the ports array** - Even if empty, it's required
3. **Not checking current state** - Flying blind is dangerous
4. **Assuming additive behavior** - It's replacement, not addition
5. **Using wrong stack IDs** - 403 errors mean no access

## 💡 Quick Reference

- **List all stacks**: \`mittwald_container_list_stacks\`
- **Check current state**: \`mittwald_container_get_stack\`
- **Modify stack**: \`mittwald_container_declare_stack\` (with ALL desired services)
- **View logs**: \`mittwald_container_get_service_logs\`
- **List services**: \`mittwald_container_list_services\`
- **List volumes**: \`mittwald_container_list_volumes\`

Remember: When in doubt, show the current state and ask for confirmation!
`;