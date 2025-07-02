import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { z } from "zod";
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

const VirtualHostHelpArgs = z.object({});
type VirtualHostHelpArgs = z.infer<typeof VirtualHostHelpArgs>;

export const handleVirtualHostHelp: MittwaldToolHandler<VirtualHostHelpArgs> = async () => {
  const helpContent = `
# Mittwald Virtual Host Configuration Guide

## Overview
Virtual hosts (domains) handle routing to your apps in Mittwald. Understanding the relationship between virtual hosts, apps, and document roots is crucial for successful configuration.

## Key Concepts

### Two-Layer Architecture
\`\`\`
[Virtual Host] → [App] → [Document Root]
   (Domain)      (Target)   (File Location)
\`\`\`

- **Virtual Hosts**: Handle domain routing and path mappings
- **Apps**: Handle the actual content serving and document root configuration
- **Document Root**: Configured at the APP level, NOT the virtual host level

## Available Commands

### virtualhost create
Create a new virtual host (ingress) for a domain.

**Required Parameters:**
- \`hostname\`: The domain name (e.g., "example.com")
- \`projectId\`: The project ID (format: p-XXXXXX)
- **At least one path mapping**: pathToApp, pathToContainer, or pathToUrl

**Path Mapping Options:**

1. **pathToApp**: Maps to an app installation
   - Format: \`["path:appId"]\`
   - Example: \`["/:a-3c96b5"]\` or \`["/:3ecaf1a9-6eb4-4869-b811-8a13c3a2e745"]\`
   - App IDs always start with \`a-\`

2. **pathToContainer**: Maps to a container
   - Format: \`["path:containerId:port/protocol"]\`
   - Example: \`["/:c-f6kw84:5601/tcp"]\`
   - Container IDs always start with \`c-\`

3. **pathToUrl**: Maps to external URL (redirect)
   - Format: \`["path:url"]\`
   - Example: \`["/api:https://api.example.com"]\`

**Complete Example:**
\`\`\`json
{
  "hostname": "example.com",
  "projectId": "p-abc123",
  "pathToApp": ["/:a-jy18b3"]
}
\`\`\`

### virtualhost list
List all virtual hosts for a project.

**Required Parameters:**
- \`projectId\`: The project ID (format: p-XXXXXX)

**Example:**
\`\`\`json
{
  "projectId": "p-abc123",
  "output": "json"
}
\`\`\`

### virtualhost get
Get details of a specific virtual host.

**Required Parameters:**
- \`ingressId\`: The virtual host ID

**Example:**
\`\`\`json
{
  "ingressId": "i-abc123"
}
\`\`\`

### virtualhost delete
Delete a virtual host.

**Required Parameters:**
- \`virtualHostId\`: The virtual host ID (NOT ingressId!)

**Example:**
\`\`\`json
{
  "virtualHostId": "vh-abc123",
  "force": true
}
\`\`\`

## Step-by-Step Process

### 1. Create Your App First
\`\`\`bash
# Example: Create a StaticSite app
mittwald_app_create_static
  --projectId "p-xxxxx"
  --siteTitle "My Static Site"
  --documentRoot "/"  # Document root relative to installation path
\`\`\`

### 2. Get the App ID
\`\`\`bash
mittwald_app_list
  --projectId "p-xxxxx"
  --output "json"
\`\`\`
Look for the \`shortId\` (e.g., \`a-jy18b3\`) or full \`id\`.

### 3. Create Virtual Host
\`\`\`bash
mittwald_domain_virtualhost_create
  --hostname "example.com"
  --pathToApp ["/:a-jy18b3"]  # Map root path to app
  --projectId "p-xxxxx"
\`\`\`

### 4. Verify Configuration
\`\`\`bash
mittwald_domain_virtualhost_list
  --projectId "p-xxxxx"
  --output "json"
\`\`\`

## Document Root Handling

### Where Document Root is Configured
- **StaticSite Apps**: Use \`--documentRoot\` parameter during creation
- **PHP Apps**: Use \`--documentRoot\` parameter during creation
- **Virtual Hosts**: DO NOT have document root configuration

### How It Works
1. Virtual host receives request at \`example.com/some/path\`
2. Routes to app based on path mapping
3. App serves content from its configured document root

### Updating Document Root
To change an app's document root:
\`\`\`bash
mittwald_app_update
  --installationId "a-xxxxx"
  --documentRoot "/new/path"
\`\`\`

## Common Issues

### 1. "Kein Ziel" (No Target) in UI
- Ensure you're using the correct project ID (p-XXXXXX format)
- Virtual hosts must be created with project IDs, not stack IDs
- Verify at least one path mapping is specified

### 2. ID Confusion
- Use \`mittwald_context_detect --id "xxxxx"\` to identify what type of ID you have
- App IDs start with \`a-\`
- Container IDs start with \`c-\`
- Project IDs start with \`p-\`

### 3. Delete Operations
- Use \`virtualHostId\` (NOT \`ingressId\`) for deletion
- The parameter name is important!

### 4. Default Virtual Hosts
- Projects may have default virtual hosts (e.g., \`p-xxxxx.project.space\`)
- These may show \`target: "unknown"\` in listings

## Best Practices

1. **Always verify IDs**: Use \`mittwald_context_detect\` when unsure
2. **Check existing virtual hosts**: List before creating to avoid conflicts
3. **Document root paths**: Always relative to the app's installation path
4. **Path mappings**: Start with root \`/\` unless you need specific routing

## Complete Example: StaticSite Setup
\`\`\`bash
# 1. Create StaticSite app
mittwald_app_create_static
  --projectId "p-luln2c"
  --siteTitle "My Website"
  --documentRoot "/public"

# 2. List apps to get ID
mittwald_app_list --projectId "p-luln2c" --output "json"
# Returns: a-jy18b3

# 3. Create virtual host
mittwald_domain_virtualhost_create
  --hostname "mywebsite.com"
  --pathToApp ["/:a-jy18b3"]
  --projectId "p-luln2c"

# Result: mywebsite.com → StaticSite app → serves from /public directory
\`\`\`

## Troubleshooting Commands
- \`mittwald_domain_virtualhost_get --ingressId "xxx"\` - Get virtual host details
- \`mittwald_app_get --installation_id "xxx"\` - Get app configuration
- \`mittwald_context_detect --id "xxx"\` - Identify ID type

## ID Hierarchy in Mittwald
\`\`\`
Server → Project (p-XXXXXX) → Stack (UUID) → Container (c-XXXXXX)
                                        ↓
                                   App (a-XXXXXX)
\`\`\`

Virtual hosts are created at the **project** level and route to **apps** or **containers**.
`;

  return formatToolResponse(
    "success", 
    "Virtual Host Help",
    {
      help: helpContent.trim(),
      availableCommands: [
        "mittwald_domain_virtualhost_create",
        "mittwald_domain_virtualhost_list",
        "mittwald_domain_virtualhost_get",
        "mittwald_domain_virtualhost_delete",
        "mittwald_domain_virtualhost_help"
      ]
    }
  );
};

export const virtualHostHelpDefinition = {
  name: "mittwald_domain_virtualhost_help",
  description: "Show help for virtual host (ingress) commands",
  parameters: VirtualHostHelpArgs,
  handler: handleVirtualHostHelp,
};