# DDEV Configuration Resources

## Overview
DDEV is a local development tool that requires setup on the user's machine. While the Mittwald CLI commands `mw ddev init` and `mw ddev render-config` perform local operations, we can surface the required configuration data via MCP resources so assistants can guide users safely.

## Available Resources

### 1. DDEV Config Generator
- **URI**: `mittwald://ddev/config/{appInstallationId}`
- **Purpose**: Generates DDEV configuration YAML by making Mittwald API calls to fetch app and database information.
- **Example**: `mittwald://ddev/config/a-abc123`
- **Output**: YAML configuration file with project type, PHP version, database connection, environment variables, and hooks.

### 2. DDEV Setup Instructions
- **URI**: `mittwald://ddev/setup-instructions/{appInstallationId}`
- **Purpose**: Provides copy-paste shell commands to initialize DDEV locally using the generated configuration.
- **Example**: `mittwald://ddev/setup-instructions/a-abc123`
- **Output**: Markdown instructions covering prerequisites, configuration download, command execution, and verification steps.

## Why Resources Instead of Tools?
DDEV commands run entirely on the user's workstation:
- Create and update files within the local `.ddev/` directory
- Execute `ddev` CLI commands (`ddev config`, `ddev get`, `ddev auth ssh`, etc.)
- Require an installed DDEV environment and local SSH access

MCP resources are read-only and can safely return:
- API-derived configuration tailored to the user's Mittwald app
- Guided instructions for local execution without side effects

This split keeps MCP responses informative while leaving the actual filesystem and CLI operations to the user, ensuring consistent behaviour across MCP clients.

## Usage in MCP Clients
1. Fetch `mittwald://ddev/config/{appInstallationId}` to retrieve the YAML configuration.
2. Present the configuration to the user and suggest saving it as `.ddev/config.yaml`.
3. Fetch `mittwald://ddev/setup-instructions/{appInstallationId}` for the step-by-step commands.
4. Guide the user through running the commands locally.

## Related Documentation
- `docs/mittwald-cli-coverage.md` – Coverage matrix showing DDEV commands as resource-based implementations.
- `docs/agent-prompts/AGENT-C6-ddev-resources.md` – Agent prompt with implementation details and success criteria.
