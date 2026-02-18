# Data Model: Complete Documentation Gap

**Feature**: 017-complete-documentation-gap
**Date**: 2025-01-25

## Overview

This feature produces markdown documentation files. The "data model" describes the structure of these documents and their relationships.

## Document Types

### 1. OAuth Getting-Started Guide

**Purpose**: Step-by-step guide for setting up Mittwald MCP with a specific tool
**Location**: `docs/setup-and-guides/src/content/docs/getting-started/{tool-slug}.md`

**Structure**:

```yaml
---
title: "Getting Started with {Tool Name}"
description: "Set up OAuth and Mittwald MCP in {Tool Name} with step-by-step instructions"
---

# Getting Started with {Tool Name}

[Brief introduction - what this guide covers]

## Prerequisites

- [Required software]
- [Required accounts]
- [Time estimate]

## Authentication Options

[Brief overview of OAuth vs API Key paths]

## Option A: OAuth Authentication (Recommended)

### Step 1: Register OAuth Client with Mittwald
[DCR registration via curl]

### Step 2: Add Mittwald MCP to {Tool}
[Tool-specific configuration]

### Step 3: Authenticate with Mittwald
[Browser flow walkthrough]

### Step 4: Verify Your Connection
[Test command/action]

## Option B: API Key Authentication

### Step 1: Get Your Mittwald API Token
[MStudio instructions]

### Step 2: Add Mittwald MCP with API Key
[Tool-specific configuration with token]

### Step 3: Verify Your Connection
[Test command/action]

## Common Tasks with Mittwald MCP

[4-5 example tasks with commands]

## Troubleshooting

### Error: "[Error Name]"
**Symptom**: [What user sees]
**Cause**: [Why it happens]
**Fix**: [How to resolve]

[5+ error scenarios]

## FAQ

### Q: [Common question]?
**A**: [Answer]

[6+ Q&A pairs]

## Next Steps

- [Link to reference docs]
- [Link to explainers]
- [Link to case studies]
- [Link to other tools]

## Still Need Help?

[Support resources]
```

### 2. Case Study Tutorial

**Purpose**: Real-world workflow tutorial for a specific customer segment
**Location**: `docs/setup-and-guides/src/content/docs/case-studies/{slug}.md`

**Structure**:

```yaml
---
title: "{Case Study Title}"
description: "{One-line summary of what this tutorial teaches}"
---

# {Case Study Title}

## Who Is This For?

**Customer Segment**: {Segment Name}
**Role**: {Typical role/job title}
**Context**: {Situation description}

## What You'll Solve

{Problem description - what challenge does this address?}

## Prerequisites

- Mittwald MCP connected to your tool ([Getting Started guide](/getting-started/))
- {Any segment-specific prerequisites}

## Step-by-Step Guide

### Step 1: {Action Title}

{Natural language instruction}

**Tool Used**: [`{tool/name}`](/reference/tools/{domain}/{tool}/)
**Expected Output**: {What user should see}

### Step 2: {Action Title}

{Continue for all steps...}

## What You'll Achieve

- **{Benefit 1}**: {Description}
- **{Benefit 2}**: {Description}
- **Next Steps**: {What user can do next}

## Tools Reference

| Tool | Domain | Purpose in This Tutorial |
|------|--------|--------------------------|
| [`{tool/name}`](/reference/tools/{domain}/{tool}/) | {domain} | {Why used here} |
| ... | ... | ... |

## Related Tutorials

- [{Related tutorial 1}](/case-studies/{slug}/)
- [{Related tutorial 2}](/case-studies/{slug}/)
```

### 3. Case Studies Index Page

**Purpose**: Landing page for all case studies with segment-based navigation
**Location**: `docs/setup-and-guides/src/content/docs/case-studies/index.md`

**Structure**:

```yaml
---
title: "Case Studies"
description: "Real-world tutorials showing how to use Mittwald MCP for common workflows"
---

# Case Studies

Learn how to use Mittwald MCP through practical, real-world examples. Each case study walks through a complete workflow from start to finish.

## Find Your Segment

{Brief intro about customer segments}

### Freelance Web Developers

{Segment description}

- [{Tutorial 1 title}](/case-studies/{slug}/)
- [{Tutorial 2 title}](/case-studies/{slug}/)

### Web Development Agencies

{Segment description}

- [{Tutorial 1 title}](/case-studies/{slug}/)
- [{Tutorial 2 title}](/case-studies/{slug}/)

### E-commerce Specialists

{Segment description}

- [{Tutorial 1 title}](/case-studies/{slug}/)
- [{Tutorial 2 title}](/case-studies/{slug}/)

### Enterprise TYPO3 Developers

{Segment description}

- [{Tutorial 1 title}](/case-studies/{slug}/)
- [{Tutorial 2 title}](/case-studies/{slug}/)

### Modern Stack Developers

{Segment description}

- [{Tutorial 1 title}](/case-studies/{slug}/)
- [{Tutorial 2 title}](/case-studies/{slug}/)

## All Case Studies

| Tutorial | Segment | Primary Focus |
|----------|---------|---------------|
| {Title} | {Segment} | {Focus} |
| ... | ... | ... |
```

## Entity Relationships

```
Getting Started Index
├── Claude Code Guide (NEW)
├── GitHub Copilot Guide (NEW)
├── Cursor Guide (EXISTS)
└── Codex CLI Guide (EXISTS)

Case Studies Index (NEW)
├── Freelancer Segment
│   ├── CS-001: Client Onboarding
│   └── CS-006: Backup Monitoring
├── Agency Segment
│   ├── CS-002: Multi-Project Management
│   └── CS-007: Developer Onboarding
├── E-commerce Segment
│   ├── CS-003: Launch Day Preparation
│   └── CS-008: Database Performance
├── TYPO3 Segment
│   ├── CS-004: Multi-Site Deployment
│   └── CS-009: Security Audit
└── Modern Stack Segment
    ├── CS-005: Container Deployment
    └── CS-010: CI/CD Pipeline

Reference Site (EXTERNAL)
└── /reference/tools/{domain}/{tool}/  ← Tool links point here
```

## File Naming Convention

| Document Type | Naming Pattern | Example |
|--------------|----------------|---------|
| OAuth Guide | `{tool-slug}.md` | `claude-code.md`, `github-copilot.md` |
| Case Study | `{kebab-case-title}.md` | `freelancer-client-onboarding.md` |
| Index Page | `index.md` | `case-studies/index.md` |

## Frontmatter Requirements

All documentation files require:

```yaml
---
title: "Required - appears in nav and page title"
description: "Required - SEO meta description"
---
```

Optional frontmatter (Starlight-specific):

```yaml
---
sidebar:
  order: 1  # Optional - controls sidebar position
  badge:
    text: "New"  # Optional - badge next to title
---
```
