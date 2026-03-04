---
title: View Container Logs
description: Display logs of a specific container.
sidebar:
  label: View Container Logs
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: View Container Logs
  - tag: meta
    attrs:
      name: og:description
      content: Display logs of a specific container.
lastUpdated: 2026-03-04
---
## Overview

Display logs of a specific container. Use `mittwald_container_list` to find the `containerId` for your container.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `containerId` | `string` | Yes | ID of the container to get logs for |
| `projectId` | `string` | Yes | ID of the project containing the container |
| `tail` | `number` | No | Number of most recent log lines to retrieve (returns all logs if not specified) |

## Return Type

**Type**: `object`

**Description**: Tool execution result with status, message, and data

**Example Response**:

```json
{
  "status": "success",
  "message": "Retrieved logs for container abc123",
  "data": {
    "containerId": "abc123",
    "projectId": "p-xxxxx",
    "logs": "2026-03-04T10:00:00Z Starting application...\n2026-03-04T10:00:01Z Application started successfully",
    "lineCount": 2
  },
  "metadata": {
    "durationMs": 45
  }
}
```

