# App Dependency MCP Tools

These MCP wrappers expose Mittwald CLI dependency management commands for use by AI assistants and other MCP clients. They provide visibility into available system software, version planning, and safe dependency updates for app installations.

## Available Tools

| Tool Name | Description |
| --- | --- |
| `mittwald_app_dependency_list` | Lists all system software dependencies and optionally enriches the result with installation data. |
| `mittwald_app_dependency_versions` | Retrieves available versions for a specific dependency with optional filtering. |
| `mittwald_app_dependency_update` | Applies one or more dependency updates to an app installation. |

## Usage Examples

### List Dependencies
```json
{
  "name": "mittwald_app_dependency_list",
  "arguments": {
    "appType": "wordpress",
    "appId": "a-abc123",
    "includeMetadata": true
  }
}
```

### Fetch Available Versions
```json
{
  "name": "mittwald_app_dependency_versions",
  "arguments": {
    "dependency": "php",
    "versionRange": ">=8.2",
    "recommendedOnly": true
  }
}
```

### Update Dependencies
```json
{
  "name": "mittwald_app_dependency_update",
  "arguments": {
    "appId": "a-abc123",
    "updates": [
      { "dependency": "php", "version": "8.2" },
      { "dependency": "node", "version": "~18" }
    ],
    "updatePolicy": "patchLevel",
    "quiet": true
  }
}
```

## Common Workflows

1. **Compatibility checks** – Compare available PHP or Node versions before initiating an app upgrade.
2. **Bulk updates** – Update multiple dependencies in a single call while controlling update policies.
3. **Version planning** – Filter versions by semver range to plan migrations with recommended releases.

## Error Handling

- CLI execution errors are mapped to actionable messages (missing installation, invalid version range, unknown dependency).
- Invalid range inputs return data alongside a warning to help debug semver constraints.
- Quiet updates preserve the CLI summary output so MCP clients can surface success details.

Refer to `docs/mittwald-cli-coverage.md` for full coverage status.
