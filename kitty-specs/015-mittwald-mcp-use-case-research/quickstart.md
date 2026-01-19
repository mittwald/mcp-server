# Quickstart: Authoring Mittwald MCP Case Studies

**Feature**: 015-mittwald-mcp-use-case-research
**Mission**: research
**Last Updated**: 2025-01-19

## Overview

This guide helps authors write case studies for the Mittwald MCP documentation. Each case study demonstrates how a specific customer persona can use LLM clients with MCP to solve real hosting workflow problems.

## Before You Start

1. **Read the assigned case study concept** in `plan.md` (Work Package Strategy table)
2. **Review the customer segment** in `research.md` (Customer Segments section)
3. **Check the MCP tool inventory** at `evals/inventory/tools-current.json`
4. **Understand the tools** you'll be using by reading their descriptions

## Case Study Template

Each case study uses a **4-section streamlined tutorial format**:

```markdown
# [CS-###] [Title]

## Persona
**Segment**: [SEG-00X] [Segment Name]
**Role**: [Job title/description]
**Context**: [1-2 sentences on their situation]

## Problem
[2-3 sentences describing the pain point and its business impact]

## Solution: MCP Workflow

### Prerequisites
- Mittwald MCP server connected to [LLM Client]
- Active Mittwald project with [required resources]

### Step 1: [Action Name]
```
[LLM prompt or MCP tool invocation]
```
**Tools Used**: `tool/name`, `tool/name2`
**Expected Output**: [What the user sees]

### Step 2: [Action Name]
[Continue pattern...]

## Outcomes
- **Time Saved**: [Qualitative estimate]
- **Error Reduction**: [What manual mistakes are avoided]
- **Next Steps**: [How to extend this workflow]
```

## Writing Guidelines

### Section 1: Persona (Keep it brief)
- Use segment ID from research.md (SEG-001 through SEG-005)
- Role should be realistic for that segment
- Context sets up why they need this workflow

**Example**:
```markdown
## Persona
**Segment**: SEG-001 Freelance Web Developer
**Role**: Solo WordPress developer managing 8 client websites
**Context**: Just landed a new client who needs a complete web presence with custom domain and professional email.
```

### Section 2: Problem (Be specific)
- State the pain point clearly
- Include business impact (time wasted, errors made, stress caused)
- Keep to 2-3 sentences

**Example**:
```markdown
## Problem
Setting up a new client project manually takes 45+ minutes: create project, configure domain, set up DNS, create email addresses, request SSL certificate, and verify everything works. Each step requires navigating different MStudio screens, and forgetting one step (like DNS propagation) causes delays and client frustration.
```

### Section 3: Solution (Show the workflow)
- List prerequisites first
- Each step should have:
  - Clear action name
  - The actual prompt or command
  - Tools used (use `display_name` format like `domain/list`)
  - What output to expect
- Use realistic prompts that a developer would actually type

**Example**:
```markdown
### Prerequisites
- Mittwald MCP server connected to Claude Code
- Mittwald organization with available project quota
- Client's domain name ready (e.g., newclient.de)

### Step 1: Create Project and Configure Domain
```
Create a new Mittwald project called "NewClient Website" and
configure the domain newclient.de with proper DNS records
pointing to the project.
```
**Tools Used**: `project/create`, `domain/virtualhost/create`, `domain/dnszone/update`
**Expected Output**: Project created with ID p-xxxxx, domain configured with A record pointing to server IP.
```

### Section 4: Outcomes (Quantify the value)
- Time saved: Compare to manual workflow
- Error reduction: What mistakes are avoided
- Next steps: Natural extensions of this workflow

**Example**:
```markdown
## Outcomes
- **Time Saved**: 45 minutes reduced to 3 minutes of prompting + waiting for DNS
- **Error Reduction**: No forgotten DNS records, consistent SSL configuration, email deliverybox always created
- **Next Steps**: Add backup schedule automation, set up staging environment
```

## Tool Coverage Requirements

Your case study must use the tools assigned in `plan.md`. When writing:

1. **List all tools used** at the bottom of your case study
2. **Use display_name format** (e.g., `app/list` not `mcp__mittwald__mittwald_app_list`)
3. **Ensure tools are actually invoked** in the workflow steps

Add a summary section at the end:

```markdown
---
## Tools Used in This Case Study
- `project/create`
- `domain/virtualhost/create`
- `domain/dnszone/update`
- `mail/address/create`
- `mail/deliverybox/create`
- `certificate/request`
```

## Quality Checklist

Before submitting your case study:

- [ ] Persona uses correct segment ID (SEG-001 through SEG-005)
- [ ] Problem is specific and mentions business impact
- [ ] All workflow steps have Tools Used listed
- [ ] Tool names use display_name format
- [ ] Expected outputs are realistic
- [ ] Outcomes include time saved and error reduction
- [ ] All assigned tools from plan.md are used
- [ ] File saved to `findings/CS-###-kebab-title.md`

## File Naming

Save case studies to:
```
kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-###-kebab-case-title.md
```

Examples:
- `CS-001-freelancer-client-onboarding.md`
- `CS-003-ecommerce-launch-day-preparation.md`

## Getting Help

- **Customer segments**: See `research.md` § Customer Segments
- **Tool inventory**: See `evals/inventory/tools-current.json`
- **Tool descriptions**: See tool inventory or MStudio documentation
- **Case study assignments**: See `plan.md` § Work Package Strategy

## LLM Client Recommendations

| Use Case | Recommended Client |
|----------|-------------------|
| Terminal-based infrastructure automation | Claude Code |
| Interactive web-based workflows | ChatGPT Developer Mode |
| Google Cloud integrated scenarios | Gemini CLI |

Most case studies should recommend **Claude Code** as it's the most natural fit for Mittwald developers working in terminals.
