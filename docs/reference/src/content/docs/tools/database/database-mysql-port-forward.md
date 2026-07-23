---
title: "Get MySQL Port Forwarding Instructions"
description: "Get a ready-to-run SSH port forwarding command that exposes a MySQL database on a local TCP port. This tool does not open the tunnel itself - run the returned command locally."
sidebar:
  label: "Get MySQL Port Forwarding Instructions"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Get MySQL Port Forwarding Instructions"
  - tag: meta
    attrs:
      name: og:description
      content: "Get a ready-to-run SSH port forwarding command that exposes a MySQL database on a local TCP port. This tool does not open the tunnel itself - run the returned command locally."
lastUpdated: 2026-07-23
---
## Overview

Get a ready-to-run SSH port forwarding command that exposes a MySQL database on a local TCP port. This tool does not open the tunnel itself - run the returned command locally.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
| `port` | `number` | No | The local TCP port to forward to (default: 3306) |
| `sshUser` | `string` | No | Override the SSH user to connect with; if omitted, your own mStudio user will be used |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to include in the returned ssh command |

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

