---
title: Login with Token
description: Login using API token.
sidebar:
  label: Login with Token
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Login with Token
  - tag: meta
    attrs:
      name: og:description
      content: Login using API token.
lastUpdated: 2026-01-23
---
## Overview

Login using API token.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | `string` | Yes | The API token to use for authentication |

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

