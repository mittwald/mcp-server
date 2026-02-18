---
title: Revoke Organization Invite
description: Revoke an invite to an organization.
sidebar:
  label: Revoke Organization Invite
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Revoke Organization Invite
  - tag: meta
    attrs:
      name: og:description
      content: Revoke an invite to an organization.
lastUpdated: 2026-01-23
---
## Overview

Revoke an invite to an organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inviteId` | `string` | Yes | The ID of the invite to revoke |
| `confirm` | `boolean` | Yes | Must be set to true to confirm revocation (DESTRUCTIVE OPERATION - cannot be undone). |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |

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

