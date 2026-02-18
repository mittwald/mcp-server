---
title: Update SFTP User
description: Update an existing SFTP user.
sidebar:
  label: Update SFTP User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update SFTP User
  - tag: meta
    attrs:
      name: og:description
      content: Update an existing SFTP user.
lastUpdated: 2026-01-23
---
## Overview

Update an existing SFTP user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sftpUserId` | `string` | Yes | The ID of the SFTP user to update |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `expires` | `string` | No | An interval after which the SFTP user expires (examples: 30m, 30d, 1y) |
| `description` | `string` | No | Set description for SFTP user |
| `publicKey` | `string` | No | Public key used for authentication |
| `password` | `string` | No | Password used for authentication |
| `accessLevel` | `read \| full` | No | Set access level permissions for the SFTP user |
| `directories` | `array` | No | Specify directories to restrict this SFTP user's access to |
| `enable` | `boolean` | No | Enable the SFTP user |
| `disable` | `boolean` | No | Disable the SFTP user |

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

