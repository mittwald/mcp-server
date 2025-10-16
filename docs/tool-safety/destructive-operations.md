## Global Confirmation Requirement

All destructive Mittwald CLI tools now require `confirm: true` to execute. Calls without the flag are rejected, providing a consistent safety net across backups, databases, containers, users, and projects.

---

# Destructive Operations Safety Guide

## Organization Management

### ⚠️ DESTRUCTIVE: mittwald_org_delete
**Risk**: Permanently deletes an organization and all associated resources.

**Safety Measures**:
- Requires `confirm: true` parameter
- User must have owner role
- Cannot be undone

**Usage**:
Only use when explicitly requested by the user with clear understanding of consequences.

### ⚠️ DISRUPTIVE: mittwald_org_membership_revoke
**Risk**: Removes user access to organization.

**Safety Measures**:
- Requires membership ID
- Verify user intent before executing

**Usage**:
Confirm with user before revoking access.
