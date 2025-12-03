# Organization Management Examples

## List Organizations
```json
{
  "name": "mittwald_org_list",
  "arguments": {}
}
```

## Get Organization Details
```json
{
  "name": "mittwald_org_get",
  "arguments": {
    "organizationId": "o-abc123"
  }
}
```

## Invite User to Organization
```json
{
  "name": "mittwald_org_invite",
  "arguments": {
    "organizationId": "o-abc123",
    "email": "user@example.com",
    "role": "member",
    "message": "Welcome to our organization!"
  }
}
```

## List Organization Members
```json
{
  "name": "mittwald_org_membership_list",
  "arguments": {
    "organizationId": "o-abc123"
  }
}
```

## ⚠️ Delete Organization (DESTRUCTIVE)
```json
{
  "name": "mittwald_org_delete",
  "arguments": {
    "organizationId": "o-abc123",
    "confirm": true
  }
}
```
**WARNING**: This permanently deletes the organization!

## ⚠️ Revoke Organization Invite (DESTRUCTIVE)
```json
{
  "name": "mittwald_org_invite_revoke",
  "arguments": {
    "inviteId": "org-invite-abc123",
    "confirm": true
  }
}
```
**WARNING**: Revoking an invite immediately invalidates the link. `confirm: true` is REQUIRED.

## ⚠️ Revoke Organization Membership (DESTRUCTIVE)
```json
{
  "name": "mittwald_org_membership_revoke",
  "arguments": {
    "membershipId": "org-member-xyz789",
    "confirm": true
  }
}
```
**WARNING**: Removing a membership cuts access instantly. Double-check user intent before setting `confirm: true`.

