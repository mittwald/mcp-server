---
title: Update SSH User
description: Update an existing SSH user.
sidebar:
  label: Update SSH User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update SSH User
  - tag: meta
    attrs:
      name: og:description
      content: Update an existing SSH user.
lastUpdated: 2026-01-23
---
## Overview

Update an existing SSH user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sshUserId` | `string` | Yes | The ID of the SSH user to update |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `expires` | `string` | No | An interval after which the SSH user expires (examples: 30m, 30d, 1y) |
| `description` | `string` | No | Set description for SSH user |
| `publicKey` | `string` | No | Public key used for authentication |
| `password` | `string` | No | Password used for authentication |
| `enable` | `boolean` | No | Enable the SSH user |
| `disable` | `boolean` | No | Disable the SSH user |

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

