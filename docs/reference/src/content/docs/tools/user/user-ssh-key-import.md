---
title: Import SSH Key
description: Import an existing (local) SSH key.. Imports an existing SSH public key from the local filesystem.
sidebar:
  label: Import SSH Key
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Import SSH Key
  - tag: meta
    attrs:
      name: og:description
      content: Import an existing (local) SSH key.. Imports an existing SSH public key from the local filesystem.
lastUpdated: 2026-01-23
---
## Overview

Import an existing (local) SSH key.. Imports an existing SSH public key from the local filesystem.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `expires` | `string` | No | An interval after which the SSH key expires (examples: 30m, 30d, 1y) |
| `input` | `string` | No | A filename in your ~/.ssh directory containing the key to import (default: id_rsa.pub) |

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

