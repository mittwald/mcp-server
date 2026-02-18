---
title: Revoke API Token
description: Revoke an API token.. Permanently disables the specified API token.
sidebar:
  label: Revoke API Token
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Revoke API Token
  - tag: meta
    attrs:
      name: og:description
      content: Revoke an API token.. Permanently disables the specified API token.
lastUpdated: 2026-01-23
---
## Overview

Revoke an API token.. Permanently disables the specified API token.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | `string` | Yes | ID of the API token to revoke |
| `confirm` | `boolean` | Yes | Must be set to true to confirm revocation (DESTRUCTIVE OPERATION - cannot be undone). |
| `force` | `boolean` | No | Pass --force to the CLI to override safety prompts after confirm=true is provided. |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |

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

