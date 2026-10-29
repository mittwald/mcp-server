---
title: Register a Domain
description: Check availability, review price and owner details, and order a domain
destructive: true
---

## Copy-paste prompt

```text
I want to register the domain example.de for my Mittwald project "My Website".

Check whether it is available, then prepare the order with me as the owner and
show me the overview with price and contract duration before ordering anything.
```

## What the agent will do automatically

- Check availability with `mittwald_domain_check`. If the domain is taken, it reports whether a transfer is possible.
- Ask you for the owner details: person or organization, name, company, email, street and house number, postal code, city, country and phone number in international format.
- Validate the owner details against the rules of the domain ending and prepare the order with `mittwald_domain_order_preview`. Nothing is ordered at this point.
- Show you the order overview: domain, project, owner, price, fee, total and contract duration.
- Order the domain with `mittwald_domain_order` after you approved it.

## What you (human) must still do

- Provide correct owner details. The owner is the legal holder of the domain.
- Approve the order. Clients that support MCP elicitation additionally show a confirmation dialog before the order is placed; the order is only placed if you confirm it there.
- Confirm the verification email if one arrives. Who sends it depends on the domain ending:
  - **`.de` domains:** the email is sent from `noreply@mittwald.de` to the owner's email address and must be confirmed within **7 days**, otherwise the domain is suspended.
  - **All other domains:** for owner details entered for the first time, mittwald's registrar sends the email. Make sure the owner's email address is reachable and confirm it within the deadline stated in the email. Otherwise the domain is blocked, and email addresses belonging to the domain stop working as well.

The order the agent places is always exactly the previewed one. To change the owner or the project, the agent has to prepare a new preview, which you have to approve again.

## Transferring a domain

To move a domain that is registered elsewhere, get the auth code from its current registrar and include it in the prompt. The agent passes it to the check and the preview, and the overview shows the order as a transfer.

## Verification prompt

```text
List the domains of my project and show me the status of example.de.
```

## If the verification email does not arrive

```text
Resend the verification email for example.de.
```

The agent uses `mittwald_domain_resend_verification` once the domain appears in the domain list.
