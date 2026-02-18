---
title: Close Conversation
description: Close a conversation.
sidebar:
  label: Close Conversation
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Close Conversation
  - tag: meta
    attrs:
      name: og:description
      content: Close a conversation.
lastUpdated: 2026-01-23
---
## Overview

Close a conversation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | ID of the conversation to close |

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

