---
title: List Organization Members
description: List all memberships belonging to an organization.
sidebar:
  label: List Organization Members
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List Organization Members
  - tag: meta
    attrs:
      name: og:description
      content: List all memberships belonging to an organization.
lastUpdated: 2026-01-23
---
## Overview

List all memberships belonging to an organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID to list memberships for (format: o-XXXXX) |

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

