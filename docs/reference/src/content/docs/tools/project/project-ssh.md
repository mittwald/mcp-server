---
title: Connect to Project via SSH
description: Connect to a project via SSH. (provides command for interactive terminal)
sidebar:
  label: Connect to Project via SSH
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Connect to Project via SSH
  - tag: meta
    attrs:
      name: og:description
      content: Connect to a project via SSH. (provides command for interactive terminal)
lastUpdated: 2026-01-23
---
## Overview

Connect to a project via SSH. (provides command for interactive terminal)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `sshUser` | `string` | No | Override the SSH user to connect with; if omitted, your own user will be used |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to use for public key authentication |

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

