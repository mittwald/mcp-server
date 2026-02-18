---
title: Get Project Invite Details
description: Get details of a project invite.
sidebar:
  label: Get Project Invite Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Project Invite Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details of a project invite.
lastUpdated: 2026-01-23
---
## Overview

Get details of a project invite.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inviteId` | `string` | Yes | ID of the invite to get details for |
| `output` | `json \| table \| yaml` | No | Output format (json, table, yaml) |

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

