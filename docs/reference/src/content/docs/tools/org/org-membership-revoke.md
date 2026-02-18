---
title: Revoke Organization Membership
description: Revoke a user's membership to an organization.
sidebar:
  label: Revoke Organization Membership
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Revoke Organization Membership
  - tag: meta
    attrs:
      name: og:description
      content: Revoke a user's membership to an organization.
lastUpdated: 2026-01-23
---
## Overview

Revoke a user's membership to an organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `membershipId` | `string` | Yes | Membership ID to revoke |
| `organizationId` | `string` | No | Organization ID related to the membership (optional) |
| `confirm` | `boolean` | Yes | Must be set to true to confirm revocation (DESTRUCTIVE OPERATION - cannot be undone). |

## Return Type

**Type**: `object`

**Description**: Tool execution result with status, message, and data

**Example Response**:

```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": null,
  "metadata": {
    "durationMs": 0
  }
}
```

