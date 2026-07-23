---
title: "View Container Logs"
description: "Display logs of a specific container. Use mittwald_container_list to find the containerId for your container."
sidebar:
  label: "View Container Logs"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "View Container Logs"
  - tag: meta
    attrs:
      name: og:description
      content: "Display logs of a specific container. Use mittwald_container_list to find the containerId for your container."
lastUpdated: 2026-07-23
---
## Overview

Display logs of a specific container. Use mittwald_container_list to find the containerId for your container.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `containerId` | `string` | Yes | ID of the container to get logs for |
| `projectId` | `string` | Yes | ID of the project containing the container |
| `tail` | `number` | No | Number of most recent log lines to retrieve (optional, returns all logs if not specified) |

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

