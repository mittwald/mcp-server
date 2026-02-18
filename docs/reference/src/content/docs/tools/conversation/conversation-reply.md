---
title: Reply to Conversation
description: Reply to a conversation.
sidebar:
  label: Reply to Conversation
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Reply to Conversation
  - tag: meta
    attrs:
      name: og:description
      content: Reply to a conversation.
lastUpdated: 2026-01-23
---
## Overview

Reply to a conversation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | ID of the conversation to reply to |
| `message` | `string` | No | Message content for the reply |
| `messageFrom` | `string` | No | Source of the message (file path) |
| `editor` | `string` | No | Editor to use for message input |

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

