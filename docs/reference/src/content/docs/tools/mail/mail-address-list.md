---
title: "List Mail Addresses"
description: "List all mail addresses for a project."
sidebar:
  label: "List Mail Addresses"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Mail Addresses"
  - tag: meta
    attrs:
      name: og:description
      content: "List all mail addresses for a project."
lastUpdated: 2026-07-23
---
## Overview

List all mail addresses for a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |

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

