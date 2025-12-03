# Volume Management Examples

## Create Volume

### Basic volume creation
```json
{
  "name": "mittwald_volume_create",
  "arguments": {
    "projectId": "p-abc123",
    "name": "app-uploads"
  }
}
```

### Create silently and capture the volume name
```json
{
  "name": "mittwald_volume_create",
  "arguments": {
    "projectId": "p-abc123",
    "name": "cache-data",
    "quiet": true
  }
}
```

## List Volumes

### List all volumes in a project
```json
{
  "name": "mittwald_volume_list",
  "arguments": {
    "projectId": "p-abc123"
  }
}
```

## Delete Volume

### ⚠️ Delete unmounted volume
```json
{
  "name": "mittwald_volume_delete",
  "arguments": {
    "projectId": "p-abc123",
    "volumeId": "app-uploads",
    "confirm": true
  }
}
```
**WARNING**: This permanently deletes all data in the volume! The `confirm: true` parameter is REQUIRED.

### ⚠️⚠️ Force delete mounted volume (extreme caution!)
```json
{
  "name": "mittwald_volume_delete",
  "arguments": {
    "projectId": "p-abc123",
    "volumeId": "cache-data",
    "confirm": true,
    "force": true
  }
}
```
**DANGER**: This detaches the volume even if containers are still using it. Both `confirm: true` (deletion intent) and `force: true` (mounted override) are required. Confirm service downtime and data backups first.

## Common Use Cases

1. **Persistent uploads**: Create a dedicated volume for user uploads in web applications.
2. **Database backups**: Store recurring database dumps on a separate persistent volume.
3. **Cache storage**: Keep cache data off the application container filesystem for easier scaling.
4. **Shared data**: Mount a single volume into multiple containers that need shared state.

## Volume Lifecycle Best Practices

1. **Create** volumes before deploying containers that depend on them.
2. **Monitor** usage regularly with `mittwald_volume_list` and adjust capacity planning early.
3. **Back up** important data prior to executing destructive actions like `mittwald_volume_delete`.
4. **Clean up** unused or orphaned volumes to free infrastructure resources.
