---
title: Forward MySQL Port
description: Forward the TCP port of a MySQL database to a local port (provides command for long-running execution)
sidebar:
  label: Forward MySQL Port
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Forward MySQL Port
  - tag: meta
    attrs:
      name: og:description
      content: Forward the TCP port of a MySQL database to a local port (provides command for long-running execution)
lastUpdated: 2026-01-23
---
## Overview

Forward the TCP port of a MySQL database to a local port (provides command for long-running execution)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `sshUser` | `string` | No | Override the SSH user to connect with |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to use for public key authentication |
| `port` | `number` | No | The local TCP port to forward to (default: 3306) |

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

