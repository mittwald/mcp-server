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
