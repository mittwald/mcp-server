---
title: Get Project Membership Details
description: Get details of a project membership.
sidebar:
  label: Get Project Membership Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Project Membership Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details of a project membership.
lastUpdated: 2026-01-23
---
## Overview

Get details of a project membership.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `membershipId` | `string` | Yes | ID of the membership to get details for |
| `output` | `txt \| json \| yaml` | No | Output format (txt, json, yaml) |

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

