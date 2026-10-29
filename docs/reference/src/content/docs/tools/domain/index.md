---
title: Domain Tools
description: Complete reference for domain management tools
sidebar:
  label: Domain
  order: 0
lastUpdated: 2026-10-29
---

## Domain Tools

Reference documentation for all domain management tools.

### Available Tools

| Tool | Description |
|------|-------------|
| [`mittwald_domain_check`](./check) | Check whether a domain can be registered (or, if it is taken, transferred) at mittwald, and which owner details its domain ending requires. Use this before mittwald_domain_order_preview when a user wants to register or buy a domain. |
| [`mittwald_domain_dnszone_get`](./dnszone-get) | Get DNS zone information.. |
| [`mittwald_domain_dnszone_list`](./dnszone-list) | List DNS zones for a project.. |
| [`mittwald_domain_dnszone_update`](./dnszone-update) | Update DNS zone records.. |
| [`mittwald_domain_get`](./get) | Get domain information.. |
| [`mittwald_domain_list`](./list) | List domains belonging to a project.. |
| [`mittwald_domain_order`](./order) | Order (register or transfer) a domain. This costs money. Only call this after you showed the overview from mittwald_domain_order_preview to the user and the user explicitly approved the order. The order is placed exactly as previewed; to change anything, run the preview again. Depending on the client, the user is asked to confirm the order once more. |
| [`mittwald_domain_order_preview`](./order-preview) | Prepare the registration (or transfer) of a domain without ordering anything. Validates the owner details, returns an order overview with price and contract duration, and a confirmationToken for mittwald_domain_order. Always show the overview to the user, including the note about the verification email, before ordering. Ask the user for the owner details; do not make them up. |
| [`mittwald_domain_resend_verification`](./resend-verification) | Resend the email that asks the domain owner to verify their email address. For .de domains it is sent from noreply@mittwald.de and must be confirmed within 7 days; for other domains our registrar sends it and the deadline is stated in the email. Domains whose owner email is not verified in time are blocked. |
| [`mittwald_domain_virtualhost_create`](./virtualhost-create) | Create a domain virtualhost. |
| [`mittwald_domain_virtualhost_delete`](./virtualhost-delete) | Delete a domain virtualhost. |
| [`mittwald_domain_virtualhost_get`](./virtualhost-get) | Get details of a domain virtualhost. |
| [`mittwald_domain_virtualhost_list`](./virtualhost-list) | List domain virtualhosts. |

