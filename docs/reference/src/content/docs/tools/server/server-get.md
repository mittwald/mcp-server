---
title: Get Server Details
description: Get server details.. Retrieves information about a specific server.
sidebar:
  label: Get Server Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Server Details
  - tag: meta
    attrs:
      name: og:description
      content: Get server details.. Retrieves information about a specific server.
lastUpdated: 2026-01-23
---
## Overview

Get server details.. Retrieves information about a specific server.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serverId` | `string` | Yes | ID or short ID of a server; this argument is optional if a default server is set in the context |
| `output` | `txt \| json \| yaml` | No | Output format (default: txt) |

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

