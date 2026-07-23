---
title: "List Organization Invites"
description: "List all invites for an organization."
sidebar:
  label: "List Organization Invites"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Organization Invites"
  - tag: meta
    attrs:
      name: og:description
      content: "List all invites for an organization."
lastUpdated: 2026-07-23
---
## Overview

List all invites for an organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orgId` | `string` | No | ID or short ID of an org; this parameter is optional if a default org is set in the context |

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

