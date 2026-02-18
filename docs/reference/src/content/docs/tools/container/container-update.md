---
title: Update Container
description: Updates attributes of an existing container such as image, environment variables, port mappings, and volumes.
sidebar:
  label: Update Container
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update Container
  - tag: meta
    attrs:
      name: og:description
      content: Updates attributes of an existing container such as image, environment variables, port mappings, and volumes.
lastUpdated: 2026-01-23
---
## Overview

Updates attributes of an existing container such as image, environment variables, port mappings, and volumes.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `containerId` | `string` | Yes | Container ID or short ID to update |
| `image` | `string` | No | Update the container image (e.g., "nginx:latest", "mysql:8.0") |
| `env` | `array` | No | Environment variables in KEY=VALUE format. Multiple values can be specified. |
| `envFile` | `array` | No | Paths to files containing environment variables (one KEY=VALUE per line). Multiple files can be specified. |
| `description` | `string` | No | Update the descriptive label of the container |
| `entrypoint` | `string` | No | Override the entrypoint of the container |
| `command` | `string` | No | Update the command to run in the container (overrides image default) |
| `publish` | `array` | No | Port mappings in format <host-port>:<container-port> or just <container-port>. Multiple mappings can be specified. |
| `publishAll` | `boolean` | No | Automatically publish all ports exposed by the container image |
| `volume` | `array` | No | Volume mounts in format <host-path>:<container-path> or <named-volume>:<container-path>. Multiple volumes can be specified. |
| `recreate` | `boolean` | No | Recreate the container after updating to apply changes immediately |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `projectId` | `string` | No | Project ID or short ID (optional if default project is set in context) |

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

