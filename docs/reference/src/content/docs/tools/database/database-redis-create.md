---
title: Create Redis Database
description: Provision a new Redis database within a project.
sidebar:
  label: Create Redis Database
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Redis Database
  - tag: meta
    attrs:
      name: og:description
      content: Provision a new Redis database within a project.
lastUpdated: 2026-01-23
---
## Overview

Provision a new Redis database within a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | Project ID or short ID for the Redis database (format: p-XXXXX). |
| `description` | `string` | Yes | Human-readable description for the Redis database. |
| `version` | `string` | Yes | Redis version to deploy (see redis versions tool for options). |
| `persistent` | `boolean` | No | Enable persistent storage. Defaults to true. |
| `maxMemory` | `string` | No | Maximum memory size (e.g., 512Mi, 1Gi). |
| `maxMemoryPolicy` | `noeviction \| allkeys-lru \| allkeys-lfu \| volatile-lru \| volatile-lfu \| allkeys-random \| volatile-random \| volatile-ttl` | No | Redis eviction policy applied when memory limit is reached. |
| `quiet` | `boolean` | No | Suppress CLI output for machine-friendly responses. |

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

