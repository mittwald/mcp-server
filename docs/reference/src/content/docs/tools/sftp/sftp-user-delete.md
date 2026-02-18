---
title: Delete SFTP User
description: Delete an SFTP user.
sidebar:
  label: Delete SFTP User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete SFTP User
  - tag: meta
    attrs:
      name: og:description
      content: Delete an SFTP user.
lastUpdated: 2026-01-23
---
## Overview

Delete an SFTP user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sftpUserId` | `string` | Yes | The ID of the SFTP user to delete |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `force` | `boolean` | No | Do not ask for confirmation |
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

