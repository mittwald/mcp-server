# Agent C6: DDEV Configuration Resources

## Your Identity
You are **Agent C6**, responsible for **implementing DDEV configuration resources** that help users set up local development environments. DDEV commands primarily operate locally, but we can expose the **API-driven configuration generation** as MCP resources and provide setup guidance.

## Your Mission
Create MCP resources that:
1. Generate DDEV configuration YAML (via API calls) - **Resource with URI template**
2. Provide DDEV setup instructions with copy-paste commands - **Resource with URI template**

**Key Insight**: DDEV init/render-config make API calls to fetch app/database info, then perform local operations. We'll split this:
- **Resource**: Fetch API data, generate config/instructions (read-only, no side effects)
- **User executes locally**: Run the actual `ddev` commands on their machine

## Required Reading (Read in Order)

### MCP Resource Pattern
1. **`src/resources/container-comprehensive-guide.ts`** - Example resource implementation
2. **`src/resources/index.ts`** - Resource registration pattern
3. **`src/handlers/resource-handlers.ts`** - How resources are served
4. **`src/constants/resources.ts`** - Resource constants

### DDEV CLI Commands (in node_modules)
5. **`node_modules/@mittwald/cli/dist/commands/ddev/render-config.js`** - Understand what API calls it makes
6. **`node_modules/@mittwald/cli/dist/commands/ddev/init.js`** - Understand the full init workflow
7. **`node_modules/@mittwald/cli/dist/lib/ddev/config_builder.js`** - API call logic

### Architecture
8. **`LLM_CONTEXT.md`** - Project overview
9. **`ARCHITECTURE.md`** - System architecture
10. **`docs/mcp-cli-gap-architecture.md`** - Why DDEV is special

## Your Task List

### Task C6.1: Create DDEV Config Generator Resource (with URI Template)

MCP resources support **URI templates** for dynamic resources. Create a resource that accepts an app installation ID in the URI.

- [ ] Create file: `src/resources/ddev-config-generator.ts`
- [ ] Define resource with URI template:
  ```typescript
  import type { Resource } from '@modelcontextprotocol/sdk/types.js';
  import { assertStatus } from '@mittwald/api-client';
  import { getApiClient } from '../path/to/api-client.js';

  export const ddevConfigResource: Resource = {
    uri: 'mittwald://ddev/config/{appInstallationId}',
    name: 'DDEV Configuration Generator',
    description: 'Generates DDEV configuration YAML for a Mittwald app installation. Usage: mittwald://ddev/config/a-abc123',
    mimeType: 'application/x-yaml'
  };
  ```

- [ ] Implement content generator function:
  ```typescript
  /**
   * Generates DDEV config YAML by making API calls (like `mw ddev render-config`)
   * @param appInstallationId - App installation ID (e.g., "a-abc123")
   * @param databaseId - Optional database ID (default: auto-detect from app)
   * @param projectType - Optional project type (default: "auto")
   */
  export async function generateDdevConfig(
    appInstallationId: string,
    databaseId?: string,
    projectType: string = 'auto'
  ): Promise<string> {
    const apiClient = getApiClient();

    // 1. Fetch app installation
    const appRes = await apiClient.app.getAppinstallation({ appInstallationId });
    assertStatus(appRes, 200);
    const app = appRes.data;

    // 2. Determine database (if not provided)
    if (!databaseId && app.linkedDatabases?.length > 0) {
      databaseId = app.linkedDatabases[0]; // Use first linked database
    }

    // 3. Fetch database version (if database exists)
    let databaseConfig = undefined;
    if (databaseId) {
      const dbRes = await apiClient.database.getMysqlDatabase({
        mysqlDatabaseId: databaseId
      });
      if (dbRes.status === 200) {
        databaseConfig = {
          type: 'mysql',
          version: dbRes.data.version
        };
      }
    }

    // 4. Determine PHP version from system software
    const systemSoftware = app.systemSoftware || [];
    const phpSoftware = systemSoftware.find(s => s.systemSoftwareId?.includes('php'));
    const phpVersion = phpSoftware?.systemSoftwareVersion?.current || '8.2';

    // 5. Determine document root
    const docRoot = app.customDocumentRoot || '/';

    // 6. Generate YAML config
    const config = {
      type: projectType,
      webserver_type: 'apache-fpm',
      php_version: phpVersion,
      database: databaseConfig,
      docroot: docRoot.replace(/^\//, ''), // Remove leading slash
      web_environment: [
        `MITTWALD_APP_INSTALLATION_ID=${app.shortId}`,
        `MITTWALD_DATABASE_ID=${databaseId || ''}`
      ],
      hooks: {
        'post-pull': [
          { 'exec-host': 'ddev config --project-name $DDEV_PROJECT' },
          { 'exec-host': 'ddev restart' }
        ]
      }
    };

    return renderYAML(config);
  }
  ```

- [ ] Add YAML rendering utility (use `js-yaml` package if needed)
- [ ] Export content handler
- [ ] Commit with message: `feat(ddev): add DDEV config generator resource`

---

### Task C6.2: Create DDEV Setup Instructions Resource (with URI Template)

- [ ] Create file: `src/resources/ddev-setup-instructions.ts`
- [ ] Define resource with URI template:
  ```typescript
  export const ddevSetupInstructionsResource: Resource = {
    uri: 'mittwald://ddev/setup-instructions/{appInstallationId}',
    name: 'DDEV Setup Instructions',
    description: 'Provides copy-paste shell commands to initialize DDEV for a Mittwald app. Usage: mittwald://ddev/setup-instructions/a-abc123',
    mimeType: 'text/markdown'
  };
  ```

- [ ] Implement instructions generator:
  ```typescript
  export async function generateDdevSetupInstructions(
    appInstallationId: string,
    projectName?: string
  ): Promise<string> {
    const apiClient = getApiClient();

    // Fetch app installation to get project ID and details
    const appRes = await apiClient.app.getAppinstallation({ appInstallationId });
    assertStatus(appRes, 200);
    const app = appRes.data;

    // Determine database ID
    const databaseId = app.linkedDatabases?.[0] || 'none';

    // Generate project name
    const suggestedProjectName = projectName ||
      `mittwald-${app.shortId}` ||
      'my-mittwald-project';

    return `# DDEV Setup Instructions for ${app.description || appInstallationId}

## Prerequisites
- [DDEV installed](https://ddev.readthedocs.io/en/stable/) on your local machine
- SSH access to your Mittwald app installation

## Step 1: Fetch DDEV Configuration

First, get the DDEV configuration YAML:

\`\`\`bash
# Fetch config from MCP resource (use your MCP client or copy from resource)
# Resource URI: mittwald://ddev/config/${appInstallationId}
\`\`\`

Save the configuration to \`.ddev/config.yaml\`.

## Step 2: Run DDEV Commands

Execute these commands in your project directory:

\`\`\`bash
# Initialize DDEV project with the fetched config
ddev config --project-name ${suggestedProjectName}

# Install the official Mittwald DDEV addon
ddev get mittwald/ddev

# Add SSH credentials for remote access
ddev auth ssh

# Start the DDEV environment
ddev start
\`\`\`

## Step 3: Verify Setup

\`\`\`bash
# Check DDEV status
ddev status

# Test SSH connection to Mittwald
ddev ssh -c "pwd"
\`\`\`

## What This Does

1. **Creates local .ddev directory** with Mittwald-specific configuration
2. **Installs Mittwald plugin** for seamless integration
3. **Configures SSH** for remote file access and database sync
4. **Sets up local environment** mirroring your Mittwald app

## App Installation Details
- **App ID**: ${app.shortId}
- **Database ID**: ${databaseId}
- **Project Type**: Auto-detected
- **PHP Version**: Auto-detected from app

## Next Steps

After setup, you can:
- Pull files: \`ddev pull mittwald\`
- Push files: \`ddev push mittwald\`
- SSH into app: \`ddev ssh\`
- Access database: \`ddev mysql\`

## Troubleshooting

If you encounter issues:
1. Verify DDEV version: \`ddev version\` (requires >= 1.22)
2. Check SSH keys: \`ddev auth ssh\`
3. Review logs: \`ddev logs\`

---

📖 **Learn more**: [Mittwald DDEV Documentation](https://docs.mittwald.de/ddev)
`;
  }
  ```

- [ ] Commit with message: `feat(ddev): add DDEV setup instructions resource`

---

### Task C6.3: Register Resources with URI Template Support

Resources with URI templates need **dynamic handling**. Update the resource system to parse URIs.

- [ ] Update `src/resources/index.ts`:
  ```typescript
  import { ddevConfigResource, generateDdevConfig } from './ddev-config-generator.js';
  import { ddevSetupInstructionsResource, generateDdevSetupInstructions } from './ddev-setup-instructions.js';

  export const resources: Resource[] = [
    // ... existing resources
    ddevConfigResource,
    ddevSetupInstructionsResource
  ];

  // Add dynamic resource content handler
  export async function getResourceContent(uri: string): Promise<string> {
    // Check for DDEV config resource
    const ddevConfigMatch = uri.match(/^mittwald:\/\/ddev\/config\/([a-z0-9-]+)$/i);
    if (ddevConfigMatch) {
      const appInstallationId = ddevConfigMatch[1];
      return generateDdevConfig(appInstallationId);
    }

    // Check for DDEV setup instructions resource
    const ddevSetupMatch = uri.match(/^mittwald:\/\/ddev\/setup-instructions\/([a-z0-9-]+)$/i);
    if (ddevSetupMatch) {
      const appInstallationId = ddevSetupMatch[1];
      return generateDdevSetupInstructions(appInstallationId);
    }

    // ... existing resource handlers
  }
  ```

- [ ] Commit with message: `feat(ddev): register DDEV resources with dynamic URI handling`

---

### Task C6.4: Update Resource List Handler

MCP resources with URI templates should show the template pattern, not individual instances.

- [ ] Update `src/handlers/resource-handlers.ts`:
  ```typescript
  export async function handleListResources(): Promise<ListResourcesResult> {
    try {
      // Return resource templates (clients will substitute {appInstallationId})
      return { resources: [...RESOURCES] };
    } catch (error) {
      throw new Error(RESOURCE_ERROR_MESSAGES.LIST_FAILED(error));
    }
  }

  export async function handleResourceCall(
    request: ReadResourceRequest,
    extra?: { authInfo?: AuthInfo },
  ): Promise<ReadResourceResult> {
    try {
      const { uri } = request.params;

      // Dynamic resource matching
      const content = await getResourceContent(uri);

      // Determine MIME type from URI pattern
      let mimeType = 'text/plain';
      if (uri.includes('/config/')) {
        mimeType = 'application/x-yaml';
      } else if (uri.includes('/setup-instructions/')) {
        mimeType = 'text/markdown';
      }

      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType,
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(RESOURCE_ERROR_MESSAGES.FETCH_FAILED(error));
    }
  }
  ```

- [ ] Commit with message: `feat(ddev): add dynamic resource handling for URI templates`

---

### Task C6.5: Add YAML Rendering Utility

- [ ] Install `js-yaml` if not already present:
  ```bash
  npm install js-yaml
  npm install --save-dev @types/js-yaml
  ```

- [ ] Create utility function in `src/resources/ddev-config-generator.ts`:
  ```typescript
  import { dump as yamlDump } from 'js-yaml';

  function renderYAML(config: Record<string, any>): string {
    return yamlDump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }
  ```

- [ ] Commit with message: `feat(ddev): add YAML rendering utility`

---

### Task C6.6: Update Documentation

- [ ] Create `docs/ddev-resources.md`:
  ```markdown
  # DDEV Configuration Resources

  ## Overview
  DDEV is a local development tool that requires setup on the user's machine.
  While `mw ddev init` performs local operations, we can provide the **configuration data**
  via MCP resources.

  ## Available Resources

  ### 1. DDEV Config Generator
  **URI**: `mittwald://ddev/config/{appInstallationId}`

  **Purpose**: Generates DDEV configuration YAML by making API calls to fetch app and database info.

  **Example**:
  - `mittwald://ddev/config/a-abc123` - Generates config for app installation `a-abc123`

  **Output**: YAML configuration file

  ### 2. DDEV Setup Instructions
  **URI**: `mittwald://ddev/setup-instructions/{appInstallationId}`

  **Purpose**: Provides copy-paste shell commands to set up DDEV locally.

  **Example**:
  - `mittwald://ddev/setup-instructions/a-abc123`

  **Output**: Markdown with shell commands

  ## Why Resources Instead of Tools?

  DDEV commands are **local operations** that:
  - Create files on the user's filesystem (`.ddev/` directory)
  - Execute local `ddev` commands (`ddev config`, `ddev get`, `ddev auth ssh`)
  - Require DDEV to be installed locally

  **Resources are read-only** and provide:
  - API-fetched configuration data
  - Instructions for manual execution

  This approach:
  - ✅ Provides helpful configuration without side effects
  - ✅ Maintains clear separation: API calls (MCP) vs local operations (user)
  - ✅ Works in any MCP client (no local filesystem access needed)

  ## Usage in MCP Clients

  AI assistants can:
  1. Fetch the resource: `mittwald://ddev/config/a-abc123`
  2. Display the YAML config to the user
  3. Fetch setup instructions: `mittwald://ddev/setup-instructions/a-abc123`
  4. Guide user through local execution
  ```

- [ ] Add link to `docs/INDEX.md`
- [ ] Update `docs/mittwald-cli-coverage.md` to mark DDEV commands as "Resource-based"
- [ ] Commit with message: `docs(ddev): document DDEV resource approach`

---

### Task C6.7: Update Coverage Reports

- [ ] Run: `npm run coverage:generate`
- [ ] Update DDEV entries in coverage report:
  ```markdown
  | ddev init | ⚠️ Missing | | | Resource-based: Configuration available via mittwald://ddev/setup-instructions/{appId} |
  | ddev render-config | ⚠️ Missing | | | Resource-based: Available via mittwald://ddev/config/{appId} |
  ```
- [ ] Commit with message: `docs(coverage): update DDEV commands to reflect resource approach`

---

### Task C6.8: Testing & Verification

- [ ] Test resource URI matching:
  ```typescript
  // In test file: tests/unit/resources/ddev-resources.test.ts
  describe('DDEV Resources', () => {
    it('should match config URI pattern', () => {
      const uri = 'mittwald://ddev/config/a-abc123';
      const match = uri.match(/^mittwald:\/\/ddev\/config\/([a-z0-9-]+)$/i);
      expect(match).toBeTruthy();
      expect(match[1]).toBe('a-abc123');
    });

    it('should generate valid YAML config', async () => {
      const yaml = await generateDdevConfig('a-test123');
      expect(yaml).toContain('type:');
      expect(yaml).toContain('php_version:');
      expect(yaml).toContain('MITTWALD_APP_INSTALLATION_ID=a-test123');
    });
  });
  ```

- [ ] Run tests: `npm run test:unit`
- [ ] Build project: `npm run build`
- [ ] Commit with message: `test(ddev): add DDEV resource tests`

---

## Critical Guidelines

### Git Workflow
- ✅ **Commit after EACH task** (8 commits expected)
- ✅ **Use conventional commit format**: `feat(ddev):`, `docs(ddev):`, `test(ddev):`
- ❌ **DO NOT rebase** - keep linear history
- ❌ **DO NOT squash commits**
- ✅ **Push after every 2-3 commits**

### Code Quality
- Resources are **read-only** - no side effects, no file writes
- Use URI templates: `{appInstallationId}` in resource URIs
- Validate app installation IDs (format: `a-[a-z0-9]+`)
- Handle API errors gracefully (app not found, database not found, etc.)
- Return helpful error messages in YAML/Markdown

### Resource Design Principles
1. **Resources vs Tools**:
   - Resources: Data you can READ (like GET in REST)
   - Tools: Actions you can EXECUTE (like POST/PUT/DELETE)
   - DDEV config = Data → Resource ✅
   - DDEV init = Action → Tool, but local-only → Not in MCP ❌

2. **URI Templates**:
   - Use `{paramName}` syntax
   - Document parameter format in description
   - Validate parameters before API calls

3. **MIME Types**:
   - YAML: `application/x-yaml`
   - Markdown: `text/markdown`
   - Plain text: `text/plain`

### When to Ask for Help
- ❓ API client integration issues
- ❓ YAML rendering produces invalid output
- ❓ URI template matching fails
- ❓ Not sure how to handle optional parameters (database ID, project type)
- ❓ **ANY time you're blocked for >20 minutes**

## Success Criteria
- [x] DDEV config resource registered with URI template
- [x] DDEV setup instructions resource registered with URI template
- [x] Dynamic URI matching works (extracts app installation ID)
- [x] YAML generation produces valid DDEV config
- [x] Setup instructions include all necessary commands
- [x] Tests pass
- [x] Build succeeds
- [x] Documentation complete
- [x] Coverage reports updated
- [x] All commits follow conventional format

## Dependencies
**Blocking**: None - can start immediately
**Recommended**: Complete after Agent C1-C5 (lower priority)

## Estimated Effort
**1-2 days** (straightforward resource implementation, mostly API calls + formatting)

---

**Remember**: Resources are about providing **data**, not performing **actions**. We're giving users the configuration they need, then letting them run the local DDEV commands themselves. This maintains clean separation of concerns.

You've got this! 🎯
