---
title: Get App Details
description: Get details about an app installation.
sidebar:
  label: Get App Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get App Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details about an app installation.
lastUpdated: 2026-01-23
---
## Overview

Get details about an app installation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
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

