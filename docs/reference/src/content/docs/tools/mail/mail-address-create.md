---
title: Create Mail Address
description: Create a new mail address.
sidebar:
  label: Create Mail Address
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Mail Address
  - tag: meta
    attrs:
      name: og:description
      content: Create a new mail address.
lastUpdated: 2026-01-23
---
## Overview

Create a new mail address.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | `string` | Yes | Mail address to create |
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `catchAll` | `boolean` | No | Make this a catch-all mail address |
| `enableSpamProtection` | `boolean` | No | Enable spam protection for this mailbox |
| `quota` | `string` | No | Mailbox quota (default: 1GiB) |
| `password` | `string` | No | Mailbox password (CAUTION: providing this flag may log your password in shell history) |
| `randomPassword` | `boolean` | No | Generate a random password |
| `forwardTo` | `array` | No | Forward mail to other addresses |

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

