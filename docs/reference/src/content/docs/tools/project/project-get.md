---
title: Get Project Details
description: Get details of a project.
sidebar:
  label: Get Project Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Project Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details of a project.
lastUpdated: 2026-01-23
---
## Overview

Get details of a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |
| `output` | `txt \| json \| yaml` | No | Output format |

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

