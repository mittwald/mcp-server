---
title: Get User Profile
description: Get profile information for a user.. Defaults to the currently authenticated user if no user ID is provided.
sidebar:
  label: Get User Profile
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get User Profile
  - tag: meta
    attrs:
      name: og:description
      content: Get profile information for a user.. Defaults to the currently authenticated user if no user ID is provided.
lastUpdated: 2026-01-23
---
## Overview

Get profile information for a user.. Defaults to the currently authenticated user if no user ID is provided.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | No | The user ID to get information for; defaults to the special value "self", which references the currently authenticated user |
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

