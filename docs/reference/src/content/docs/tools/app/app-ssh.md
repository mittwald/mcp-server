---
title: Connect to App via SSH
description: Connect to an app via SSH.
sidebar:
  label: Connect to App via SSH
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Connect to App via SSH
  - tag: meta
    attrs:
      name: og:description
      content: Connect to an app via SSH.
lastUpdated: 2026-01-23
---
## Overview

Connect to an app via SSH.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `sshUser` | `string` | No | Override the SSH user to connect with; if omitted, your own user will be used |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to use for public key authentication |
| `cd` | `boolean` | No | Change to installation path after connecting |
| `info` | `boolean` | No | Only print connection information, without actually connecting |
| `test` | `boolean` | No | Test connection and exit |

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

