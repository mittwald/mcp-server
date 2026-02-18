---
title: Get My Project Membership
description: Get details of own project membership.
sidebar:
  label: Get My Project Membership
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get My Project Membership
  - tag: meta
    attrs:
      name: og:description
      content: Get details of own project membership.
lastUpdated: 2026-01-23
---
## Overview

Get details of own project membership.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `output` | `txt \| json \| yaml` | No | Output format (txt, json, yaml) |

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

