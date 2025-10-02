# Volume Operations Safety Guide

## ⚠️ DESTRUCTIVE: mittwald_volume_delete
**Risk**: Permanently deletes the named volume and all data stored inside it.

**Safety Measures**:
- The Mittwald CLI blocks deletion when a volume is still mounted unless `force` is supplied.
- Always confirm the target project ID and volume name before executing the command.
- Use `force: true` only after verifying the volume is detached from all containers.
- Capture CLI output in audit logs to retain a record of destructive actions.

**Pre-deletion Checklist**:
1. Verify the project context (`projectId`) is correct.
2. Confirm the volume name via `mittwald_volume_list`.
3. Check whether the volume is mounted to any containers.
4. Ensure critical data has been backed up and communicate impact to stakeholders.
5. Obtain explicit confirmation from the user or change request owner.

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
