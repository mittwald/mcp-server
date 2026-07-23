---
title: "List Project Members"
description: "List project memberships."
sidebar:
  label: "List Project Members"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Project Members"
  - tag: meta
    attrs:
      name: og:description
      content: "List project memberships."
lastUpdated: 2026-07-23
---
## Overview

List project memberships.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |

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

