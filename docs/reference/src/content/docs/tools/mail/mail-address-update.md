---
title: Update Mail Address
description: Update a mail address.
sidebar:
  label: Update Mail Address
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update Mail Address
  - tag: meta
    attrs:
      name: og:description
      content: Update a mail address.
lastUpdated: 2026-01-23
---
## Overview

Update a mail address.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | ID of the mail address to update |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `catchAll` | `boolean` | No | Make this a catch-all mail address |
| `enableSpamProtection` | `boolean` | No | Enable spam protection for this mailbox |
| `quota` | `string` | No | Mailbox quota |
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

