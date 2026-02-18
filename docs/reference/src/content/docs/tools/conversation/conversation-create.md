---
title: Create Conversation
description: Create a new conversation.
sidebar:
  label: Create Conversation
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Conversation
  - tag: meta
    attrs:
      name: og:description
      content: Create a new conversation.
lastUpdated: 2026-01-23
---
## Overview

Create a new conversation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | Yes | Title for the conversation |
| `message` | `string` | No | Message content for the conversation |
| `messageFrom` | `string` | No | Source of the message (file path) |
| `editor` | `string` | No | Editor to use for message input |
| `category` | `string` | No | Category for the conversation |

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

