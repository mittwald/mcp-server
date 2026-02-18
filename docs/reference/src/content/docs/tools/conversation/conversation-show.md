---
title: Show Conversation Details
description: Show details of a conversation.
sidebar:
  label: Show Conversation Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Show Conversation Details
  - tag: meta
    attrs:
      name: og:description
      content: Show details of a conversation.
lastUpdated: 2026-01-23
---
## Overview

Show details of a conversation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | ID of the conversation to show |

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

