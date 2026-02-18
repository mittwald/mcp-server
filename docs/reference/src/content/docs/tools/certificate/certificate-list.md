---
title: List SSL Certificates
description: List SSL/TLS certificates available for a domain.
sidebar:
  label: List SSL Certificates
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List SSL Certificates
  - tag: meta
    attrs:
      name: og:description
      content: List SSL/TLS certificates available for a domain.
lastUpdated: 2026-01-23
---
## Overview

List SSL/TLS certificates available for a domain.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |
| `domain` | `string` | Yes | Domain name to list certificates for |
| `output` | `txt \| json \| yaml \| csv \| tsv` | No | Output format (internally converted to JSON for processing) |

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

