/**
 * @file Virtual Host Troubleshooting Guide Resource
 * @module resources/virtualhost-troubleshooting
 */

import type { Resource } from '@modelcontextprotocol/sdk/types.js';

export const virtualHostTroubleshootingResource: Resource = {
  uri: 'mittwald://guides/virtualhost-troubleshooting',
  name: 'Virtual Host Troubleshooting Guide',
  mimeType: 'text/markdown',
};

export const virtualHostTroubleshootingContent = `# Virtual Host Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Virtual Host Shows "Kein Ziel" (No Target) in UI

**Symptoms:**
- Virtual host created successfully via API
- API shows correct configuration
- UI shows "Kein Ziel" or empty target
- Container dropdowns are empty

**Root Cause:**
The virtual host was created with the wrong project ID (often using a stack ID instead).

**Solution:**
\`\`\`bash
# 1. Detect what type of ID you have
mittwald_context_detect id="YOUR_ID_HERE"

# 2. Delete the incorrectly created virtual host
mittwald_domain_virtualhost_delete ingressId="INGRESS_ID" force=true

# 3. Create with correct project ID (p-XXXXXX format)
mittwald_domain_virtualhost_create 
  hostname="yourdomain.com"
  projectId="p-XXXXXX"  # Must be project ID, not stack ID!
  pathToContainer=["/:CONTAINER_ID:PORT/tcp"]
\`\`\`

### Issue 2: Container Not Found in Project

**Symptoms:**
- Error: "Container not found in project"
- Container exists but virtual host creation fails

**Root Cause:**
Container belongs to a different project or the container ID is incorrect.

**Solution:**
\`\`\`bash
# 1. List all projects to find the right one
mittwald_project_list

# 2. List stacks in the project
mittwald_container_list_stacks projectId="p-XXXXXX"

# 3. List services in the stack
mittwald_container_list_services stackId="STACK_ID"

# 4. Use the correct service ID from step 3
\`\`\`

### Issue 3: Invalid Container ID Format

**Symptoms:**
- Error about invalid container ID format
- Using wrong type of ID

**ID Format Guide:**
- **Project**: \`p-XXXXXX\` (6 alphanumeric chars)
- **Stack**: UUID format (36 chars with dashes)
- **Container**: Full UUID from service listing
- **App**: \`a-XXXXXX\` (6 alphanumeric chars)
- **Server**: \`s-XXXXXX\` (6 alphanumeric chars)

### Issue 4: Port/Protocol Format Errors

**Correct Format:**
\`\`\`
pathToContainer=["/:CONTAINER_ID:9200/tcp"]
pathToContainer=["/api:CONTAINER_ID:3000/tcp"]
\`\`\`

**Common Mistakes:**
- Missing protocol: \`:9200\` (should be \`:9200/tcp\`)
- Wrong separator: \`:9200-tcp\` (should be \`:9200/tcp\`)
- No port: \`/:CONTAINER_ID\` (missing port/protocol)

## Best Practices

1. **Always verify context before creating virtual hosts:**
   \`\`\`bash
   mittwald_context_detect id="YOUR_ID"
   \`\`\`

2. **Use the project ID from the UI breadcrumb:**
   Look for "Projekt > p-XXXXXX" in the UI

3. **Validate container ownership:**
   Containers must belong to the same project as the virtual host

4. **Check existing virtual hosts:**
   \`\`\`bash
   mittwald_domain_virtualhost_list projectId="p-XXXXXX"
   \`\`\`

## Quick Diagnostic Commands

\`\`\`bash
# Get full context for any ID
mittwald_context_detect id="ANY_ID"

# List all virtual hosts in project
mittwald_domain_virtualhost_list projectId="p-XXXXXX"

# Get virtual host details
mittwald_domain_virtualhost_get ingressId="INGRESS_ID"

# List containers in a stack
mittwald_container_list_services stackId="STACK_ID"
\`\`\`

## Prevention Tips

1. **Create an alias for common projects:**
   Store your project ID in a note to avoid mixing it up

2. **Use context detection before operations:**
   Always verify you have the right type of ID

3. **Follow the hierarchy:**
   Server → Project → Stack → Container

4. **Check the UI after API operations:**
   Ensure changes appear where expected
`;