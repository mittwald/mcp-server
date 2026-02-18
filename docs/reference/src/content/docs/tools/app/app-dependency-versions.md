---
title: List Dependency Versions
description: Fetch available versions for a specific system software dependency.
sidebar:
  label: List Dependency Versions
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Dependency Versions
  - tag: meta
    attrs:
      name: og:description
      content: Fetch available versions for a specific system software dependency.
lastUpdated: 2026-01-23
---
## Overview

Fetch available versions for a specific system software dependency.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dependency` | `string` | Yes | Name of the dependency to retrieve versions for (e.g., php, node, composer). |
| `versionRange` | `string` | No | Optional semver constraint to filter the returned versions. |
| `recommendedOnly` | `boolean` | No | Return only versions flagged as recommended. |
| `includeDependencies` | `boolean` | No | Include nested dependency metadata in the response payload. |

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

