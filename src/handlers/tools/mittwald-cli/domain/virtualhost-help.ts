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

### Understanding Document Root Paths

**CRITICAL**: Document root paths in Mittwald are relative to the app's base directory, NOT the full filesystem path!

#### File System Structure
\`\`\`
/home/p-XXXXXX/                  # Project home directory
├── html/                        # Web content directory
│   ├── app-name-XXXXX/         # App installation directory
│   │   ├── index.html          # Your files
│   │   └── public/             # Subdirectory example
│   └── another-app-XXXXX/
└── files/                       # Other project files
\`\`\`

#### Document Root Configuration Examples

**Correct Document Root Values:**
- \`/\` or empty - Serves from app root (e.g., \`/home/p-XXXXXX/html/app-name-XXXXX/\`)
- \`/public\` - Serves from public subdirectory
- \`./\` - Also serves from app root

**Common Mistakes:**
- \`/app-name-XXXXX/app-name-XXXXX\` - WRONG! Creates non-existent path
- \`/html/app-name-XXXXX\` - WRONG! System already handles the html prefix
- Full paths like \`/home/p-XXXXXX/html/...\` - WRONG! Use relative paths

### Debugging Document Root Issues

When encountering 404 errors:

1. **SSH into the server** to check actual file structure:
   \`\`\`bash
   ssh user@server
   ls -la html/
   find html -name 'index.html' -type f
   \`\`\`

2. **Check Apache error logs**:
   \`\`\`bash
   tail -20 /var/log/http/error.log | grep DocumentRoot
   \`\`\`
   
   Look for warnings like:
   \`\`\`
   AH00112: Warning: DocumentRoot [/home/p-XXXXXX/html/app-name/app-name] does not exist
   \`\`\`

3. **Examine virtual host configuration**:
   \`\`\`bash
   cat /usr/local/apache2/conf/vhost.d/*/your-domain.vhost
   \`\`\`
   
   Check the DocumentRoot directive - it shows the full path Apache is using.

### Real-World Example

**Problem**: StaticSite app shows 404 error
- Document Root set to: \`/staticsite-h2jwy/staticsite-h2jwy\`
- Actual file location: \`/home/p-luln2c/html/staticsite-h2jwy/index.html\`
- Apache looking for: \`/home/p-luln2c/html/staticsite-h2jwy/staticsite-h2jwy/\` (doesn't exist!)

**Solution**: Change Document Root to \`/\` or leave empty

### Updating Document Root
To change an app's document root:
\`\`\`bash
mittwald_app_update
  --installationId "a-xxxxx"
  --documentRoot "/new/path"
\`\`\`

**Note**: Configuration changes may take 1-2 minutes to propagate. Monitor error logs to confirm when changes are applied.

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

### 5. 404 Errors After Configuration
- **Document Root Issues**: Most common cause - see "Document Root Handling" section above
- **Configuration Propagation**: Changes made in mStudio may take 1-2 minutes to apply
- **Virtual Host Files**: Located in \`/usr/local/apache2/conf/vhost.d/\` (read-only, auto-generated)
- **Debugging Steps**:
  1. SSH to server and verify file locations
  2. Check Apache error logs for DocumentRoot warnings
  3. Examine generated vhost configuration
  4. Wait for configuration to propagate after changes

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

## SSH Troubleshooting Guide

### When to Use SSH
Use SSH debugging when:
- Getting persistent 404 errors after configuration changes
- Need to verify actual file locations
- Want to check if configuration has propagated

### SSH Commands for Debugging

1. **Check project structure**:
   \`\`\`bash
   pwd                          # Shows home directory (e.g., /home/p-XXXXXX)
   ls -la                       # List all directories
   ls -la html/                 # List web content directories
   \`\`\`

2. **Find your app files**:
   \`\`\`bash
   find html -name 'index.html' -type f    # Find all index files
   ls -la html/app-name-*/                 # Check app directory contents
   \`\`\`

3. **Check Apache configuration**:
   \`\`\`bash
   # Find virtual host files
   ls -la /usr/local/apache2/conf/vhost.d/
   
   # Read your domain's vhost config
   cat /usr/local/apache2/conf/vhost.d/*/your-domain.vhost
   
   # Check for DocumentRoot in the config
   grep DocumentRoot /usr/local/apache2/conf/vhost.d/*/your-domain.vhost
   \`\`\`

4. **Monitor error logs**:
   \`\`\`bash
   # Check recent errors
   tail -20 /var/log/http/error.log
   
   # Watch for DocumentRoot warnings
   tail -20 /var/log/http/error.log | grep DocumentRoot
   
   # Monitor logs in real-time (if staying connected)
   tail -f /var/log/http/error.log
   \`\`\`

### Understanding Log Messages

**DocumentRoot Warning**:
\`\`\`
AH00112: Warning: DocumentRoot [/home/p-XXXXXX/html/app-name/app-name] does not exist
\`\`\`
This means Apache is looking for files in a directory that doesn't exist. The path shown is what you need to fix.

**Successful Request**:
Look for HTTP 200 status codes in access.log after fixing configuration.

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