---
title: Update App Dependencies
description: Update one or more system software dependencies for an app installation.
sidebar:
  label: Update App Dependencies
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update App Dependencies
  - tag: meta
    attrs:
      name: og:description
      content: Update one or more system software dependencies for an app installation.
lastUpdated: 2026-01-23
---
## Overview

Update one or more system software dependencies for an app installation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | `string` | Yes | App installation ID (format: a-XXXXX). |
| `dependency` | `string` | No | Name of a dependency to update (e.g., php, node). Use together with the version field. |
| `version` | `string` | No | Target version or version range for the dependency specified in the dependency field. |
| `updates` | `array` | No | List of dependency updates to apply in one request. |
| `updatePolicy` | `none \| inheritedFromApp \| patchLevel \| all` | No | Update policy to apply after updating the dependency set. |
| `quiet` | `boolean` | No | Suppress progress output and only return a summary from the CLI. |

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

