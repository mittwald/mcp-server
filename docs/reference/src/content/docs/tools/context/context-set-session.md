---
title: Set Session Context
description: Set user context in Redis session (session-aware, multi-tenant safe)
sidebar:
  label: Set Session Context
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Set Session Context
  - tag: meta
    attrs:
      name: og:description
      content: Set user context in Redis session (session-aware, multi-tenant safe)
lastUpdated: 2026-01-23
---
## Overview

Set user context in Redis session (session-aware, multi-tenant safe)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | No | The project ID to set as context for this user session |
| `serverId` | `string` | No | The server ID to set as context for this user session |
| `orgId` | `string` | No | The organization ID to set as context for this user session |
| `installationId` | `string` | No | The installation ID to set as context for this user session |
| `stackId` | `string` | No | The stack ID to set as context for this user session |

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

