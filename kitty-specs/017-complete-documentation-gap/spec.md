# Feature Specification: Complete Documentation Gap

**Feature Branch**: `017-complete-documentation-gap`
**Created**: 2025-01-25
**Status**: Draft
**Mission**: software-dev
**Input**: Close the documentation gap identified in Feature 016: 2 missing OAuth guides + 10 missing case study tutorials.

## Overview

Feature 016 created the documentation infrastructure (two Astro Starlight sites) and partial content. This feature completes the remaining documentation:

1. **2 OAuth Getting-Started Guides**: Claude Code and GitHub Copilot
2. **10 Case Study Tutorials**: Transform Feature 015 research findings into user-facing tutorials

All content goes into the existing `docs/setup-and-guides/` site.

## User Scenarios & Testing

### User Story 1 - Claude Code Setup (Priority: P1)

A developer wants to use Mittwald MCP with Claude Code. They find the Getting Started guide and follow it to complete OAuth setup.

**Why this priority**: Claude Code is Anthropic's flagship tool and a primary use case for Mittwald MCP. Without this guide, Claude Code users cannot authenticate.

**Independent Test**: A developer with no prior MCP experience can complete OAuth setup for Claude Code within 10 minutes following the guide.

**Acceptance Scenarios**:

1. **Given** the Claude Code getting-started guide exists, **When** a developer follows all steps, **Then** they successfully register an OAuth client and authenticate via Claude Code.
2. **Given** a developer encounters an OAuth error, **When** they consult the troubleshooting section, **Then** they find the specific error and resolution steps.
3. **Given** the Claude Code guide, **When** compared to the Cursor guide format, **Then** it follows the same structure (Prerequisites, Step 1-4, Troubleshooting, FAQ, Next Steps).

---

### User Story 2 - GitHub Copilot Setup (Priority: P1)

A developer using GitHub Copilot wants to connect it to Mittwald MCP. They find the Getting Started guide and complete OAuth setup.

**Why this priority**: GitHub Copilot has massive adoption. Missing this guide blocks a significant user segment.

**Independent Test**: A developer can complete OAuth setup for GitHub Copilot within 10 minutes following the guide.

**Acceptance Scenarios**:

1. **Given** the GitHub Copilot getting-started guide exists, **When** a developer follows all steps, **Then** they successfully authenticate.
2. **Given** GitHub Copilot's MCP integration specifics (VS Code extension, OAuth flow), **When** the guide addresses them, **Then** all Copilot-specific configuration is documented.
3. **Given** the guide exists, **When** the Getting Started index page is viewed, **Then** all 4 tools (Claude Code, Copilot, Cursor, Codex CLI) are listed with links.

---

### User Story 3 - Freelancer Finds Relevant Tutorial (Priority: P2)

A freelance web developer wants to see practical examples of MCP usage for their workflow. They browse case studies and find tutorials relevant to their segment.

**Why this priority**: Case studies demonstrate real-world value and help developers understand how to apply MCP to their specific needs.

**Independent Test**: Each of the 5 customer segments has exactly 2 discoverable, well-formatted tutorials.

**Acceptance Scenarios**:

1. **Given** the case studies section exists, **When** a developer looks for their segment (Freelancer, Agency, E-commerce, TYPO3, Modern Stack), **Then** they find exactly 2 case studies for their segment.
2. **Given** a case study page, **When** a developer reads it, **Then** it includes: persona, problem, solution walkthrough, outcomes, and tools reference.
3. **Given** CS-001 through CS-010 from Feature 015 research, **When** transformed to tutorials, **Then** each tutorial references real MCP tools with links to reference docs.

---

### User Story 4 - Developer Follows Tutorial End-to-End (Priority: P2)

A developer selects a case study tutorial and follows it step-by-step to accomplish a real task with Mittwald MCP.

**Why this priority**: Tutorials must be actionable, not just informational.

**Independent Test**: Each tutorial contains executable steps that a developer can follow with real MCP tools.

**Acceptance Scenarios**:

1. **Given** any case study tutorial, **When** a developer follows the solution steps, **Then** each step clearly indicates which MCP tool to use and what to expect.
2. **Given** the tutorial references MCP tools, **When** the developer needs more detail, **Then** each tool name links to the reference documentation page.
3. **Given** all 10 tutorials, **When** reviewed for consistency, **Then** they follow the same Divio tutorial format.

---

### Edge Cases

- **Tool not yet available in Claude Code/Copilot**: Document workarounds or state "coming soon" with expected timeline if known.
- **OAuth flow differences between tools**: Each guide addresses tool-specific OAuth configuration clearly.
- **Case study workflow requires tools not available**: All 10 case studies from Feature 015 use only tools that exist in the 115-tool inventory.
- **Cross-linking between sites**: Case studies link to reference docs on the separate reference site; verify links work.

## Requirements

### Functional Requirements

**OAuth Getting-Started Guides:**

- **FR-001**: Documentation MUST provide a getting-started guide for **Claude Code** including:
  - OAuth registration steps (DCR endpoint, client name, redirect URI)
  - Claude Code MCP configuration (`claude mcp add` command or settings)
  - Step-by-step verification and testing
  - Troubleshooting for common OAuth errors
  - FAQ section addressing common questions

- **FR-002**: Documentation MUST provide a getting-started guide for **GitHub Copilot** including:
  - OAuth registration steps specific to VS Code extension environment
  - Copilot MCP configuration in VS Code settings
  - Step-by-step verification and testing
  - Troubleshooting for common OAuth errors
  - FAQ section addressing common questions

- **FR-003**: Each guide MUST follow the same format as existing guides (Cursor, Codex CLI):
  - Prerequisites section
  - Step 1: Register OAuth Client
  - Step 2: Add MCP to Tool
  - Step 3: Authenticate
  - Step 4: Verify Connection
  - Troubleshooting section with specific error scenarios
  - FAQ section
  - Next Steps with links to explainers, case studies, reference

- **FR-004**: The Getting Started index page (`getting-started/index.md`) MUST be updated to include links to Claude Code and GitHub Copilot guides.

**Case Study Tutorials:**

- **FR-005**: Documentation MUST provide exactly 10 case study tutorial pages, one for each case study from Feature 015:
  - CS-001: Freelancer Client Onboarding Automation
  - CS-002: Agency Multi-Project Management
  - CS-003: E-commerce Launch Day Preparation
  - CS-004: TYPO3 Multi-Site Deployment
  - CS-005: Container Stack Deployment
  - CS-006: Automated Backup Monitoring
  - CS-007: Developer Onboarding
  - CS-008: Database Performance Optimization
  - CS-009: Security Audit Automation
  - CS-010: CI/CD Pipeline Integration

- **FR-006**: Each case study tutorial MUST be transformed from Feature 015 research format to Divio tutorial format with sections:
  - Persona (who this tutorial is for)
  - Problem (what challenge they face)
  - Solution (step-by-step walkthrough with MCP tool usage)
  - Outcomes (what they achieve, time saved)
  - Tools Reference (table of tools used with links)

- **FR-007**: Each case study MUST be placed in `docs/setup-and-guides/src/content/docs/case-studies/` with a slug matching the case study ID (e.g., `freelancer-client-onboarding.md`).

- **FR-008**: Each MCP tool mentioned in a case study MUST link to its reference documentation page.

- **FR-009**: Case studies MUST cover all 5 customer segments with exactly 2 tutorials each:
  - Freelancer: CS-001, CS-006
  - Agency: CS-002, CS-007
  - E-commerce: CS-003, CS-008
  - Enterprise TYPO3: CS-004, CS-009
  - Modern Stack: CS-005, CS-010

- **FR-010**: A case studies index page MUST be created at `docs/setup-and-guides/src/content/docs/case-studies/index.md` with:
  - Overview of what case studies are available
  - Grouping by customer segment
  - Links to all 10 tutorials

**Documentation Quality:**

- **FR-011**: All new documentation MUST use consistent Astro Starlight frontmatter format matching existing docs.

- **FR-012**: All new documentation MUST follow the tone and style of existing docs (Cursor, Codex CLI guides; explainers).

- **FR-013**: All cross-site links (to reference documentation) MUST use absolute URLs or be validated to work at build time.

### Key Entities

- **OAuth Guide**: A getting-started document for a specific LLM tool (Claude Code, Copilot, Cursor, Codex CLI)
- **Case Study Tutorial**: A practical walkthrough demonstrating MCP usage for a specific customer segment and workflow
- **Customer Segment**: One of 5 target audiences (Freelancer, Agency, E-commerce, TYPO3, Modern Stack)
- **MCP Tool Reference**: A link to the reference documentation site for a specific tool

## Success Criteria

### Measurable Outcomes

- **SC-001**: 2 new OAuth guides published (Claude Code, GitHub Copilot) with complete step-by-step instructions
- **SC-002**: All 4 OAuth guides follow identical format and structure
- **SC-003**: 10 case study tutorials published, one for each Feature 015 case study
- **SC-004**: Each of 5 customer segments has exactly 2 discoverable tutorials
- **SC-005**: 100% of MCP tools referenced in tutorials have working links to reference docs
- **SC-006**: Case studies index page provides clear navigation by customer segment
- **SC-007**: Getting Started index page lists all 4 tools with working links
- **SC-008**: Documentation builds successfully with `npm run build` in docs/setup-and-guides

## Assumptions

- Feature 015 case study content (CS-001 through CS-010) is complete and accurate
- Existing OAuth guides (Cursor, Codex CLI) provide the correct format template
- Claude Code and GitHub Copilot both support MCP with OAuth authentication
- The reference documentation site is deployed and URLs are stable
- Astro Starlight configuration is already correct from Feature 016

## Key Concepts & Terminology

- **DCR (Dynamic Client Registration)**: RFC 7591 mechanism for registering OAuth clients programmatically
- **PKCE**: Proof Key for Code Exchange; security mechanism for OAuth authorization code flow
- **MCP (Model Context Protocol)**: Anthropic's protocol for LLMs to interact with external tools
- **Divio Tutorial Format**: Documentation format with clear persona, problem, solution, and outcomes
- **Customer Segment**: Target audience category (Freelancer, Agency, E-commerce, TYPO3, Modern Stack)

## Deliverable Organization

```
docs/setup-and-guides/src/content/docs/
├── getting-started/
│   ├── index.md           # UPDATE: Add links to Claude Code and Copilot
│   ├── cursor.md          # EXISTS
│   ├── codex-cli.md       # EXISTS
│   ├── claude-code.md     # NEW: Claude Code OAuth guide
│   └── github-copilot.md  # NEW: GitHub Copilot OAuth guide
│
└── case-studies/
    ├── index.md                           # NEW: Case studies landing page
    ├── freelancer-client-onboarding.md    # NEW: CS-001
    ├── agency-multi-project-management.md # NEW: CS-002
    ├── ecommerce-launch-day.md            # NEW: CS-003
    ├── typo3-multisite-deployment.md      # NEW: CS-004
    ├── container-stack-deployment.md      # NEW: CS-005
    ├── automated-backup-monitoring.md     # NEW: CS-006
    ├── developer-onboarding.md            # NEW: CS-007
    ├── database-performance.md            # NEW: CS-008
    ├── security-audit-automation.md       # NEW: CS-009
    └── cicd-pipeline-integration.md       # NEW: CS-010
```

**Total New Files**: 13 (2 OAuth guides + 10 case study tutorials + 1 case studies index)
**Updated Files**: 1 (getting-started/index.md)

## Input Sources

- **OAuth Guide Format**: `docs/setup-and-guides/src/content/docs/getting-started/cursor.md`
- **Case Study Content**: `kitty-specs/015-mittwald-mcp-use-case-research/findings/CS-*.md`
- **Segment Mapping**: `kitty-specs/015-mittwald-mcp-use-case-research/findings/segment-coverage-matrix.md`
