---
title: Run Container
description: Create and start a new container.
sidebar:
  label: Run Container
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Run Container
  - tag: meta
    attrs:
      name: og:description
      content: Create and start a new container.
lastUpdated: 2026-01-23
---
## Overview

Create and start a new container.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | `string` | Yes | Container image (e.g., ubuntu:20.04 or alpine@sha256:abc123...) |
| `command` | `string` | No | Override the default command specified in the container image |
| `args` | `array` | No | Runtime arguments passed to the command |
| `projectId` | `string` | Yes | ID or short ID of a project (optional if default project is set in context) |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `env` | `array` | No | Set environment variables in the container (format: KEY=VALUE) |
| `envFile` | `array` | No | Read environment variables from files |
| `description` | `string` | No | Add a descriptive label to the container |
| `entrypoint` | `string` | No | Override the default entrypoint of the container image |
| `name` | `string` | No | Assign a custom name to the container |
| `publish` | `array` | No | Publish container ports to the host (format: host-port:container-port) |
| `publishAll` | `boolean` | No | Publish all ports that are defined in the image |
| `volume` | `array` | No | Bind mount volumes to the container (format: host-path:container-path) |

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

