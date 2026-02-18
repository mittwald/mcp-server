---
title: List App Dependencies
description: Get all available system software dependencies and optionally filter by app type or installation.
sidebar:
  label: List App Dependencies
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List App Dependencies
  - tag: meta
    attrs:
      name: og:description
      content: Get all available system software dependencies and optionally filter by app type or installation.
lastUpdated: 2026-01-23
---
## Overview

Get all available system software dependencies and optionally filter by app type or installation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appType` | `string` | No | Optional filter by application type tag (for example 'wordpress', 'nodejs', 'php'). |
| `appId` | `string` | No | Optional app installation ID (format: a-XXXXX) used to enrich results with current versions. |
| `includeMetadata` | `boolean` | No | Include metadata returned by the CLI in the response payload. |

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

