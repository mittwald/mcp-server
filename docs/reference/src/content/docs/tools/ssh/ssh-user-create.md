---
title: Create SSH User
description: Create a new SSH user.
sidebar:
  label: Create SSH User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create SSH User
  - tag: meta
    attrs:
      name: og:description
      content: Create a new SSH user.
lastUpdated: 2026-01-23
---
## Overview

Create a new SSH user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |
| `description` | `string` | Yes | Set description for SSH user |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `expires` | `string` | No | An interval after which the SSH user expires (examples: 30m, 30d, 1y) |
| `publicKey` | `string` | No | Public key used for authentication |
| `password` | `string` | No | Password used for authentication |

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

