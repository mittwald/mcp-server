import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { assertStatus } from '@mittwald/api-client';
import { getMittwaldClient } from '../services/mittwald/mittwald-client.js';

const APP_INSTALLATION_ID_PATTERN = /^a-[a-z0-9]+$/i;

export const ddevSetupInstructionsResource: Resource = {
  uri: 'mittwald://ddev/setup-instructions/{appInstallationId}',
  name: 'DDEV Setup Instructions',
  description: 'Provides copy-paste shell commands to initialize DDEV for a Mittwald app. Usage: mittwald://ddev/setup-instructions/a-abc123',
  mimeType: 'text/markdown'
};

function validateAppInstallationId(appInstallationId: string): void {
  if (!APP_INSTALLATION_ID_PATTERN.test(appInstallationId)) {
    throw new Error('Invalid app installation ID. Expected format: a-abc123');
  }
}

export async function generateDdevSetupInstructions(
  appInstallationId: string,
  accessToken: string,
  projectName?: string
): Promise<string> {
  validateAppInstallationId(appInstallationId);

  const mittwaldClient = getMittwaldClient(accessToken);
  const apiClient = mittwaldClient.api;

  const appRes = await apiClient.app.getAppinstallation({ appInstallationId });
  assertStatus(appRes, 200);
  const app = appRes.data;

  const resolvedDatabaseId = app.linkedDatabases?.[0] ?? 'none';
  const suggestedProjectName = projectName
    || (app.shortId ? `mittwald-${app.shortId}` : undefined)
    || 'my-mittwald-project';

  const projectDescription = app.description || appInstallationId;

  return `# DDEV Setup Instructions for ${projectDescription}

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
- **App ID**: ${app.shortId ?? appInstallationId}
- **Database ID**: ${resolvedDatabaseId}
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
