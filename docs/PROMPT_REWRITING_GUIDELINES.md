# Prompt Rewriting Guidelines - WP03 (T012)

**Purpose**: Define the outcome-focused style for Mittwald use case prompts to enable valid LLM tool discovery measurement.

**Author**: Sprint 008 Team
**Date**: 2025-12-09
**Status**: ✅ Complete

---

## Overview

Use case prompts must describe **business outcomes and goals**, not prescribe specific tools or tool sequences. This allows the LLM to discover which tools it needs, providing a valid measurement of tool discovery capability.

---

## Key Principles

### ✅ DO: Outcome-Focused Language

**Instead of**: "Use the Mittwald MCP tools to first list apps, then create a new PHP application..."

**Use**: "I need to deploy a PHP 8.2 web application so I can see it running with my custom configuration."

---

## Prohibited Terms (❌ DO NOT USE)

| Prohibited Term | Category | Reason |
|---|---|---|
| "Use the MCP tools" | Tool prescription | Tells LLM which tools to use |
| "Use the Mittwald tools" | Tool prescription | Directs tool selection |
| "Call the" [tool name] | Tool prescription | Explicitly invokes tools |
| "Invoke" [tool name] | Tool prescription | Prescribes tool order |
| "First, list..." (if prescriptive) | Sequence prescription | Dictates tool sequence |
| "Then create..." (if prescriptive) | Sequence prescription | Dictates tool order |
| Tool names (mcp__mittwald__*) | Direct reference | Removes discovery element |
| "Using the API" | Implementation detail | Exposes internal mechanics |

---

## Required Elements

Each prompt MUST include:

1. **Business Context**: Why does the user need this?
2. **Desired Outcome**: What should be accomplished?
3. **Success Criteria**: How will we know it worked?

Optional but helpful:

4. **Current State**: What is the starting point?
5. **Constraints**: Any limitations or requirements?

---

## Before/After Examples

### Example 1: App Deployment

**BEFORE (Prescriptive - ❌ WRONG)**:
```
Use the Mittwald MCP tools to:
1. List all existing apps using mcp__mittwald__app__list
2. Create a new PHP app using mcp__mittwald__app__create
3. Configure the app settings using mcp__mittwald__app__update
This should result in a deployed PHP application.
```

**AFTER (Outcome-Focused - ✅ CORRECT)**:
```
I need to deploy a PHP 8.2 web application with the following requirements:
- Web framework: Laravel
- PHP version: 8.2 or higher
- I want to see the application available online after deployment

Currently, I have no applications running in my Mittwald account.
```

---

### Example 2: Database Setup

**BEFORE (Prescriptive - ❌ WRONG)**:
```
Use the Mittwald MCP tools to:
1. Call mcp__mittwald__database__list to see existing databases
2. Create a MySQL database with mcp__mittwald__database__create
3. Create a database user with mcp__mittwald__user__create
```

**AFTER (Outcome-Focused - ✅ CORRECT)**:
```
I have a web project and I need to add a MySQL database.
I need:
- A new MySQL database for production data
- A dedicated database user with appropriate permissions
- Connection details so I can configure my application

Please help me set this up.
```

---

### Example 3: Container Management

**BEFORE (Prescriptive - ❌ WRONG)**:
```
Use the Mittwald tools to:
1. List containers with mcp__mittwald__container__list
2. Get container details with mcp__mittwald__container__get
3. Scale the container with mcp__mittwald__container__scale
```

**AFTER (Outcome-Focused - ✅ CORRECT)**:
```
I'd like to see what container resources I'm currently using in my account.
I want to understand:
- What containers are running
- Current resource allocation
- Available capacity for scaling

Based on this, I may want to adjust resources if needed.
```

---

### Example 4: DNS Configuration

**BEFORE (Prescriptive - ❌ WRONG)**:
```
Use the Mittwald MCP tools to configure DNS:
1. List domains with mcp__mittwald__domain__list
2. Create a DNS record with mcp__mittwald__dns__create
3. Update SSL settings with mcp__mittwald__ssl__update
```

**AFTER (Outcome-Focused - ✅ CORRECT)**:
```
I want to set up email forwarding for my domain.
Current situation:
- I own the domain example.com
- I need emails sent to admin@example.com to forward to my personal email

This will help me manage domain communications without running a mail server.
```

---

### Example 5: Backup Management

**BEFORE (Prescriptive - ❌ WRONG)**:
```
Create a backup using the MCP tools:
1. List available backups
2. Create a new backup
3. Schedule regular backups
```

**AFTER (Outcome-Focused - ✅ CORRECT)**:
```
I want to set up automated backups for my web applications and databases.
My requirements:
- Daily automatic backups
- At least 7 days of backup history
- Ability to restore from any backup

I want peace of mind knowing my data is protected.
```

---

## Checklist for Each Prompt

Before finalizing a use case prompt, verify:

- [ ] No "mcp__mittwald__" tool names mentioned
- [ ] No "Use the tools / Use the MCP" language
- [ ] No "Call" or "Invoke" directing specific tools
- [ ] Describes a real business need (not a technical procedure)
- [ ] Specifies desired outcomes clearly
- [ ] Includes enough context for LLM to discover appropriate tools
- [ ] No prescriptive "First..., Then..., Finally..." sequences
- [ ] Language is natural and conversational
- [ ] Could be understood by someone unfamiliar with Mittwald APIs

---

## Domain-Specific Considerations

### Apps Domain
- Focus on: deployment goals, configuration needs, scaling requirements
- NOT: app listing procedures or creation sequences

### Databases Domain
- Focus on: data storage needs, backup requirements, user access management
- NOT: database listing or creation commands

### Domains-Mail Domain
- Focus on: email forwarding, DNS setup, SSL certificates for business needs
- NOT: API procedures for domain management

### Containers Domain
- Focus on: resource management, scaling goals, container orchestration
- NOT: listing or configuring individual containers

### Access/Users Domain
- Focus on: user provisioning, permission management, SSH access setup
- NOT: user listing or API endpoint procedures

---

## Quality Standards

Each rewritten prompt should:

1. **Be Actionable**: LLM can understand what needs to happen
2. **Provide Context**: Explain why the task matters
3. **Define Success**: Clear criteria for completion
4. **Enable Discovery**: Tool selection is left to the LLM
5. **Match Reality**: Describes realistic scenarios

---

## Implementation Notes

- No rewriting of actual prompts was needed - all 31 use cases already follow this outcome-focused style
- This document serves as the reference standard for future use case creation
- All existing prompts have been verified against these guidelines
- Automated scan confirms zero tool name references (See T017)

---

## Sign-Off

✅ **Guidelines Created**: T012 Complete
✅ **All 31 Prompts Verified**: Outcome-focused format confirmed
✅ **Zero Tool Names**: Automated scan passed (T017)
✅ **Domain Expert Review**: Spot-check completed (T018)

**Status**: Ready for WP05 execution
