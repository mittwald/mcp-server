# Container Update Tool

## Overview
The `mittwald_container_update` tool wraps the `mw container update` CLI command,
allowing modification of container attributes without recreating from scratch.

## Use Cases

### 1. Update Container Image
```json
{
  "name": "mittwald_container_update",
  "arguments": {
    "containerId": "c-abc123",
    "image": "nginx:1.24-alpine",
    "recreate": true
  }
}
```

### 2. Add Environment Variables
```json
{
  "name": "mittwald_container_update",
  "arguments": {
    "containerId": "c-abc123",
    "env": [
      "DEBUG=true",
      "LOG_LEVEL=info"
    ]
  }
}
```

### 3. Update Port Mappings
```json
{
  "name": "mittwald_container_update",
  "arguments": {
    "containerId": "c-abc123",
    "publish": [
      "8080:80",
      "8443:443"
    ]
  }
}
```

### 4. Mount Additional Volumes
```json
{
  "name": "mittwald_container_update",
  "arguments": {
    "containerId": "c-abc123",
    "volume": [
      "my-data-volume:/var/lib/data"
    ]
  }
}
```

## Important Notes

- **Recreate Flag**: Changes to image, entrypoint, command, or certain runtime parameters
  may require `recreate: true` to take effect immediately
- **Multiple Updates**: All specified attributes can be updated in a single call
- **Quiet Mode**: Returns only the container ID for programmatic use
- **Validation**: CLI validates port mappings, volume formats, and environment variables

## Error Handling

Common errors and their meanings:
- **Container not found**: Invalid container ID or insufficient permissions
- **Image not found**: Invalid image name or tag
- **Invalid port mapping**: Use `<host>:<container>` or `<port>` format
- **Invalid volume**: Use `<source>:<destination>` format
- **Permission denied**: Insufficient access to the container or project
