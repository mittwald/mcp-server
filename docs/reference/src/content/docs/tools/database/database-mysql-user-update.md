---
title: Update MySQL User
description: Update properties of an existing MySQL user.
sidebar:
  label: Update MySQL User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update MySQL User
  - tag: meta
    attrs:
      name: og:description
      content: Update properties of an existing MySQL user.
lastUpdated: 2026-01-23
---
## Overview

Update properties of an existing MySQL user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | ID or short ID of the MySQL user to update. |
| `description` | `string` | No | New description displayed in mStudio. |
| `accessLevel` | `readonly \| full` | No | Adjust access permissions for the MySQL user. |
| `password` | `string` | No | Set a new password for the MySQL user. |
| `accessIpMask` | `string` | No | Restrict external access to a specific IP or CIDR mask. |
| `enableExternalAccess` | `boolean` | No | Enable external access for this user. |
| `disableExternalAccess` | `boolean` | No | Disable external access for this user. |
| `quiet` | `boolean` | No | Suppress CLI output for machine-friendly responses. |

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

