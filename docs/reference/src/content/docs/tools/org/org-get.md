---
title: Get Organization
description: Get detailed information about a specific organization.
sidebar:
  label: Get Organization
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Organization
  - tag: meta
    attrs:
      name: og:description
      content: Get detailed information about a specific organization.
lastUpdated: 2026-01-23
---
## Overview

Get detailed information about a specific organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID to fetch (format: o-XXXXX) |

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

