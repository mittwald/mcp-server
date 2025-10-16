# Volume Operations Safety Guide

## ⚠️ DESTRUCTIVE: mittwald_volume_delete
**Risk**: Permanently deletes the named volume and all data stored inside it.

**Required Safety Parameters**:
- **`confirm: true`** (REQUIRED) - Explicit confirmation that this destructive operation is intentional
- **`projectId`** (REQUIRED) - Project context to prevent cross-project deletion
- **`force: true`** (OPTIONAL) - Override mounted volume safety check (use with extreme caution)

**Safety Measures**:
- Requires explicit `confirm: true` parameter to prevent accidental deletion
- Audit logging captures sessionId and userId before deletion
- Pre-flight check identifies mounted volumes and blocks deletion unless `force` is set
- Returns affected services in response metadata for incident tracking

**Pre-deletion Checklist**:
1. Verify the project context (`projectId`) is correct
2. Confirm the volume name via `mittwald_volume_list`
3. Check whether the volume is mounted to any containers
4. Ensure critical data has been backed up and communicate impact to stakeholders
5. Obtain explicit confirmation from the user or change request owner
6. Set `confirm: true` to acknowledge this operation is destructive and cannot be undone

**Usage**:
Always confirm intent with the requesting user before deleting volumes. Deletions cannot be undone.

## Volume Naming Conventions
- Use lowercase letters, numbers, and hyphens (e.g., `wordpress-uploads`).
- Keep names descriptive so operators can identify a volume quickly.
- Avoid generic names like `data` or `storage` that make audits harder.

## Size Planning
- Consider future growth; plan for at least 2× the expected initial storage requirement.
- Monitor usage with `mittwald_volume_list` (storage usage metrics) and alert on sustained growth.
- Schedule regular cleanup or archival tasks for stale data to free capacity.
