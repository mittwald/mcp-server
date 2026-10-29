---
title: "Preview Domain Order"
description: "Prepare the registration (or transfer) of a domain without ordering anything. Validates the owner details, returns an order overview with price and contract duration, and a confirmationToken for mittwald_domain_order. Always show the overview to the user, including the note about the verification email, before ordering. Ask the user for the owner details; do not make them up."
sidebar:
  label: "Preview Domain Order"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Preview Domain Order"
  - tag: meta
    attrs:
      name: og:description
      content: "Prepare the registration (or transfer) of a domain without ordering anything. Validates the owner details, returns an order overview with price and contract duration, and a confirmationToken for mittwald_domain_order. Always show the overview to the user, including the note about the verification email, before ordering. Ask the user for the owner details; do not make them up."
lastUpdated: 2026-10-29
---
## Overview

Prepare the registration (or transfer) of a domain without ordering anything. Validates the owner details, returns an order overview with price and contract duration, and a confirmationToken for mittwald_domain_order. Always show the overview to the user, including the note about the verification email, before ordering. Ask the user for the owner details; do not make them up.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | `string` | Yes | Fully qualified domain name, e.g. example.de |
| `projectId` | `string` | Yes | ID of the project the domain will belong to |
| `authCode` | `string` | No | Auth code from the current registrar; only for transferring a domain that is already registered |
| `owner` | `object` | Yes | Domain owner. The owner is the legal holder of the domain and responsible for it. |

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

