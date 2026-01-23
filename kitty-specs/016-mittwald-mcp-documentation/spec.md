# Feature Specification: Mittwald MCP Documentation & Static Site

**Feature Branch**: `016-mittwald-mcp-documentation`
**Created**: 2025-01-23
**Status**: Draft
**Mission**: documentation

## Overview

This feature creates comprehensive end-user documentation for developers integrating Mittwald MCP with popular agentic coding tools. The documentation emphasizes OAuth setup as the critical first step, provides conceptual foundations, auto-generates complete reference material for all 115 MCP tools, and publishes 10 tutorial-based case studies derived from 015 research.

**Critical Success Factor**: Users must successfully authenticate via OAuth before accessing any MCP tools. The documentation prioritizes this authentication journey.

## Primary Research Question

How do we create a comprehensive, developer-friendly documentation experience that:
1. Enables developers to set up OAuth with mittwald-mcp on their preferred tool (Claude Code, Copilot, Cursor, Codex CLI)?
2. Explains the foundational concepts (MCP, agentic coding, OAuth architecture)?
3. Provides complete technical reference for all 115 MCP tools across 14 domains?
4. Demonstrates real-world usage patterns through 10 case study tutorials?
5. Delivers all content as two separate, Astro-based static sites with Mittwald branding?

## Scope

### In Scope

**OAuth Getting-Started Documentation (Critical)**:
- Tool-specific guides for Claude Code, GitHub Copilot, Cursor, and Codex CLI
- Step-by-step OAuth registration process (Dynamic Client Registration, PKCE, redirect URIs)
- Tool-specific callback configuration (RFC 8252 native app patterns, CLI patterns, IDE extension patterns)
- Verification and troubleshooting for each tool
- Links to official tool documentation for MCP integration mechanics

**Conceptual Documentation**:
- Explanation: What is the Model Context Protocol (MCP)?
- Explanation: What is agentic coding and how does it relate to MCP?
- Explanation: How Mittwald OAuth integrates with MCP authentication flows

**Reference Documentation** (Auto-generated):
- Complete technical reference for all 115 MCP tools across 14 domains
- Generated directly from MCP server source code
- Organized by domain with alphabetical tool listings
- Each tool includes: syntax, parameters, return values, examples
- No rate limits, authentication details, or error codes (kept minimal per requirements)

**Case Study Documentation**:
- 10 separate tutorial pages (one per case study from 015 research)
- Tutorials cover customer personas: Freelancer, Agency, E-commerce, Enterprise TYPO3, Modern Stack
- Each tutorial: persona overview, problem statement, solution walkthrough, outcomes
- Ready-to-follow practical patterns for developers in each segment

**Static Site Delivery**:
- Two separate Astro-based static sites:
  - **Site 1 (Setup + Guides)**: OAuth getting-started, conceptual explainers, case studies
  - **Site 2 (Reference)**: Complete technical reference for all 115 tools
- Mittwald.de branding integration (logo, color palette)
- Configurable base URL at build time (for flexible deployment)
- Astro documentation theme integration (find and configure existing theme)
- Navigation and discovery optimized for developer workflows

### Out of Scope

- Implementation of new MCP tools
- Mittwald product marketing materials
- Video content or interactive walkthroughs
- Custom Astro theme design (use existing documentation theme)
- Rate limiting or authentication deep-dives (reference only what's needed for setup)
- Hosting infrastructure and deployment automation (that's for later)

## User Scenarios & Testing

### Scenario 1: New Developer Onboarding with Claude Code (Priority: P1 - CRITICAL)

**User**: A developer wants to use Mittwald MCP with Claude Code for the first time.

**Journey**:
1. Finds "Getting Started: Claude Code" guide
2. Reads OAuth registration process (DCR)
3. Follows step-by-step instructions for Claude Code MCP setup
4. Configures OAuth redirect URI, PKCE, and client registration
5. Tests connection by running a simple MCP tool via Claude Code
6. Successfully completes authentication flow
7. Proceeds to use case tutorials or reference documentation

**Why this priority**: If OAuth setup fails or is unclear, no developer can use the tool. This is the gating factor for all downstream use.

**Independent Test**: A new developer with no prior Mittwald MCP experience can complete OAuth setup for Claude Code within 10 minutes following the guide.

**Acceptance Scenarios**:
1. **Given** the Claude Code getting-started guide, **When** a developer follows all steps, **Then** they successfully register with Mittwald OAuth and can authenticate via Claude Code.
2. **Given** a developer encounters an OAuth error, **When** they consult the troubleshooting section, **Then** they find the specific error and resolution steps.

---

### Scenario 2: Developer Explores All Tool Options (Priority: P1)

**User**: A developer is evaluating which tool (Claude Code, Copilot, Cursor, Codex CLI) works best for their workflow.

**Journey**:
1. Finds the "Getting Started" landing page
2. Sees all 4 tool guides presented with clear differentiation
3. Reads brief overview of each tool's OAuth flow and MCP integration approach
4. Selects their preferred tool and proceeds to detailed guide

**Independent Test**: The getting-started landing page clearly presents all 4 tools with enough information to make a choice.

**Acceptance Scenarios**:
1. **Given** the getting-started landing page, **When** a developer reads it, **Then** they understand the differences between each tool's OAuth setup.
2. **Given** a developer chooses a tool, **When** they click into that guide, **Then** the guide is comprehensive and actionable.

---

### Scenario 3: Developer Understands MCP Concepts (Priority: P2)

**User**: A developer wants to understand what MCP is and why it matters before diving into setup.

**Journey**:
1. Lands on documentation home
2. Finds "What is MCP?" explanation
3. Reads about the protocol, its benefits, and how it enables agentic coding
4. Feels confident to proceed with tool setup
5. (Optional) Reads "What is Agentic Coding?" explanation for deeper context

**Independent Test**: The MCP explanation clearly articulates what MCP is without requiring technical protocol knowledge.

**Acceptance Scenarios**:
1. **Given** the "What is MCP?" explanation, **When** a non-specialist reads it, **Then** they understand the core concept and why developers use it.
2. **Given** the explanation, **When** a developer finishes reading, **Then** they understand how Mittwald OAuth fits into the MCP authentication flow.

---

### Scenario 4: Developer Finds a Real-World Example (Priority: P2)

**User**: A freelance web developer wants to see practical examples of MCP usage in their segment.

**Journey**:
1. Reads introduction to case studies
2. Finds "Freelancer Client Onboarding" case study (their segment)
3. Reads persona, problem, and solution sections
4. Learns how MCP tools accelerated their workflow
5. (Optional) Tries the workflow themselves

**Independent Test**: Each of the 10 case study pages is discoverable and relevant to the target persona.

**Acceptance Scenarios**:
1. **Given** the case studies are published, **When** a developer looks for their segment (Freelancer, Agency, E-commerce, TYPO3, Modern Stack), **Then** they find exactly 2 case studies for their segment.
2. **Given** a case study, **When** a developer follows the solution walkthrough, **Then** the steps reference real MCP tools and workflows.

---

### Scenario 5: Developer Needs Technical Reference for a Specific Tool (Priority: P2)

**User**: A developer needs to look up parameters and examples for a specific MCP tool (e.g., `app/list`).

**Journey**:
1. Navigates to the Reference Documentation site
2. Searches or browses to find the tool by domain (e.g., "apps" domain)
3. Finds the tool reference page with syntax, parameters, and examples
4. Quickly finds the information they need without extraneous detail

**Independent Test**: All 115 tools are documented with consistent formatting and searchability.

**Acceptance Scenarios**:
1. **Given** the Reference Documentation site, **When** a developer searches for a tool, **Then** they find it with complete technical details.
2. **Given** a tool reference page, **When** a developer reads the parameters, **Then** each parameter is clearly described with type and usage.
3. **Given** 10 random tools from different domains, **When** a developer looks them up, **Then** all 10 are present and well-formatted.

---

### Edge Cases

- **Developer uses multiple tools** (Claude Code + Cursor): Documentation supports cross-tool workflows with clear separations.
- **Developer using non-English environment**: Astro site supports i18n (if applicable; may be future scope).
- **Tool documentation becomes outdated**: Reference docs auto-generate from source, ensuring freshness; getting-started guides link to official tool docs as source of truth.
- **OAuth changes in OAuth server**: Guides reference architectural docs from mittwald-oauth repo; updates flow back to documentation.
- **New MCP tool added in future**: Reference docs auto-generate; no manual updates needed.
- **Developer with no prior OAuth knowledge**: Getting-started guide explains PKCE, redirect URIs, and DCR in simple terms; troubleshooting covers common OAuth errors.

## Functional Requirements

### FR-001 to FR-010: OAuth Getting-Started Documentation

- **FR-001**: Documentation MUST provide a separate getting-started guide for **Claude Code** including:
  - OAuth registration steps (DCR endpoint, client name, redirect URI)
  - PKCE configuration
  - Claude Code MCP integration mechanics (per official Claude documentation)
  - Step-by-step verification and testing
  - Troubleshooting for common OAuth errors

- **FR-002**: Documentation MUST provide a separate getting-started guide for **GitHub Copilot** with equivalent structure to FR-001

- **FR-003**: Documentation MUST provide a separate getting-started guide for **Cursor** with equivalent structure to FR-001

- **FR-004**: Documentation MUST provide a separate getting-started guide for **Codex CLI** including:
  - OAuth registration steps specific to CLI environments
  - Loopback redirect URI configuration (RFC 8252)
  - CLI-specific PKCE flow
  - Testing via CLI commands

- **FR-005**: Each getting-started guide MUST include clear troubleshooting section covering:
  - OAuth registration errors
  - Redirect URI mismatches
  - PKCE validation failures
  - Tool-specific integration issues

- **FR-006**: Documentation MUST provide a comparison table or overview showing OAuth flow differences between the 4 tools

- **FR-007**: Each guide MUST link to official tool documentation for the most current MCP integration mechanics

- **FR-008**: OAuth guides MUST emphasize that authentication is the prerequisite for all MCP usage

- **FR-009**: Documentation MUST reference Mittwald OAuth architecture from mittwald-oauth repo (ARCHITECTURE.md, RFC 7591, RFC 8252)

- **FR-010**: Getting-started guides MUST be organized on a clear landing page with tool differentiation and quick-access links

### FR-011 to FR-015: Conceptual Documentation

- **FR-011**: Documentation MUST provide an "Explanation: What is MCP?" section covering:
  - Definition of Model Context Protocol
  - Why it matters for developers
  - How it enables agentic coding
  - Mittwald's role in the ecosystem
  - Common misconceptions

- **FR-012**: Documentation MUST provide an "Explanation: What is Agentic Coding?" section covering:
  - Definition of agentic coding
  - Relationship to LLMs and AI assistants
  - Practical examples with Mittwald MCP
  - When to use agentic coding vs. manual workflows

- **FR-013**: Documentation MUST provide an "Explanation: How Mittwald OAuth Integrates with MCP" section covering:
  - OAuth 2.1 flow overview
  - Dynamic Client Registration (DCR)
  - Token storage and encryption
  - Scope management
  - Security considerations (PKCE, HTTPS redirect URIs)

- **FR-014**: Explanations MUST be written for developers without prior MCP/OAuth knowledge; no assumed expertise

- **FR-015**: Each explanation MUST include diagrams or flowcharts where helpful for understanding (e.g., OAuth flow diagram, MCP architecture diagram)

### FR-016 to FR-025: Auto-Generated Reference Documentation

- **FR-016**: Documentation MUST auto-generate technical reference for all 115 MCP tools from the MCP server source code

- **FR-017**: Reference documentation MUST be organized by the 14 MCP domains (apps, backups, certificates, containers, context, databases, domains-mail, identity, misc, organization, project-foundation, sftp, ssh, automation)

- **FR-018**: Each tool reference MUST include: tool name, domain, description, syntax/signature, parameters with type and description, return value, at least one example, no authentication details/rate limits/error codes

- **FR-019**: Reference documentation MUST be searchable by tool name and keyword

- **FR-020**: Reference docs MUST be in a separate Astro site from getting-started and case studies

- **FR-021**: Auto-generation script MUST be documented and maintainable for future tool additions

- **FR-022**: Reference tool pages MUST use consistent formatting across all domains

- **FR-023**: Each tool reference MUST include a link to related tools in the same domain

- **FR-024**: Reference documentation MUST indicate which tools are used in case studies (backreference)

- **FR-025**: Reference docs MUST be published as a separate "Reference" site with independent branding and navigation

### FR-026 to FR-035: Case Study Documentation

- **FR-026**: Documentation MUST include exactly 10 case study tutorial pages (one per case study from 015 research)

- **FR-027**: Case studies MUST cover all 5 customer segments with 2 case studies each (Freelancer, Agency, E-commerce, TYPO3, Modern Stack)

- **FR-028**: Each case study MUST follow Divio Tutorial format with sections: persona, problem, solution, implementation, outcomes

- **FR-029**: Each case study MUST reference real MCP tools from the reference documentation (with links)

- **FR-030**: Case studies MUST be discoverable by customer segment

- **FR-031**: Each case study MUST be a separate documentation page with its own URL

- **FR-032**: Case studies MUST include estimated time to complete the workflow

- **FR-033**: Case studies MUST reference the underlying use case research from 015 (CS-00X names)

- **FR-034**: Case studies MUST be published in the "Setup + Guides" site (Site 1)

- **FR-035**: Case study pages MUST include a troubleshooting section with common implementation issues

### FR-036 to FR-050: Static Site Infrastructure & Branding

- **FR-036**: Documentation MUST be built as two separate Astro-based static sites (Setup + Guides, Reference)

- **FR-037**: Each Astro site MUST be configured with Mittwald logo and color palette using existing documentation theme

- **FR-038**: Build process MUST accept a `BASE_URL` environment variable for flexible deployment paths

- **FR-039**: Each site MUST be self-contained and independently deployable

- **FR-040**: Navigation MUST clearly distinguish between Site 1 and Site 2

- **FR-041**: Site 1 and Site 2 MUST be linkable from each other (cross-site navigation)

- **FR-042**: Astro site MUST include search function (via theme or custom implementation)

- **FR-043**: Build output MUST be static HTML/CSS/JS with no runtime dependencies

- **FR-044**: Documentation source MUST be in `docs/` directory within repository (organized by site)

- **FR-045**: Astro theme MUST be properly configured and documented for maintenance

- **FR-046**: All pages MUST incorporate Mittwald branding (logo, colors)

- **FR-047**: Documentation MUST follow Write the Docs accessibility best practices

- **FR-048**: Documentation MUST be responsive and mobile-friendly

- **FR-049**: Navigation MUST be keyboard-accessible and screen-reader friendly

- **FR-050**: Code examples MUST use inclusive naming conventions

## Success Criteria

- **SC-001**: All 4 tool-specific OAuth getting-started guides complete with step-by-step instructions and troubleshooting
- **SC-002**: First-time developers can authenticate via OAuth within 10 minutes using any guide
- **SC-003**: All 3 conceptual explainers complete and understandable by non-specialists
- **SC-004**: Reference documentation auto-generates with all 115 MCP tools correctly formatted
- **SC-005**: All 10 case study pages published in Divio tutorial format with real tool references
- **SC-006**: Each of 5 customer segments has exactly 2 discoverable case study pages
- **SC-007**: Two separate Astro sites built and deployable with configurable BASE_URL
- **SC-008**: Both sites incorporate Mittwald branding consistently
- **SC-009**: Documentation meets Write the Docs accessibility standards
- **SC-010**: Cross-site navigation between Setup site and Reference site works smoothly

## Assumptions

- Mittwald.de brand guidelines (colors, logo files) are accessible
- Astro documentation theme ecosystem has suitable pre-built themes available
- MCP server source code structure supports auto-generation script
- Official tool documentation (Claude, Copilot, Cursor, Codex) can be referenced as source of truth
- Case study data from 015 research is complete and ready for documentation
- Developers reading docs have basic command-line competency

## Key Concepts & Terminology

- **MCP (Model Context Protocol)**: Anthropic's protocol enabling LLMs to use external tools via standardized interfaces
- **Agentic Coding**: Using AI assistants as active agents to autonomously solve development tasks
- **OAuth 2.1**: Modern authorization protocol with PKCE required for security
- **Dynamic Client Registration (DCR)**: RFC 7591 mechanism for clients to register with OAuth servers
- **PKCE**: Proof Key for Code Exchange; prevents authorization code interception
- **Redirect URI**: Callback endpoint where OAuth server redirects after authentication
- **LLM Client**: IDE/editor integration supporting MCP tools (Claude Code, Copilot, Cursor, Codex CLI)
- **Divio Documentation System**: Framework organizing docs into tutorials, how-tos, explanations, reference
- **Astro**: JavaScript static site generator optimized for fast content-focused sites

## Deliverable Organization

```
docs/
├── setup-and-guides/                    # Site 1: Setup + Guides
│   ├── src/pages/
│   │   ├── getting-started/             # OAuth guides (4)
│   │   ├── explainers/                  # Conceptual docs (3)
│   │   └── case-studies/                # Tutorials (10)
│   ├── astro.config.mjs
│   └── README.md
│
├── reference/                           # Site 2: Reference
│   ├── src/pages/tools/
│   │   ├── apps/                        # 8 tools
│   │   ├── backups/                     # 8 tools
│   │   ├── databases/                   # 14 tools
│   │   ├── domains-mail/                # 22 tools
│   │   └── ...                          # 10 more domains
│   ├── scripts/
│   │   └── generate-tool-refs.ts        # Auto-generation script
│   ├── astro.config.mjs
│   └── README.md
│
└── scripts/
    ├── generate-tool-references.ts
    ├── extract-mcp-tools.ts
    └── validate-coverage.ts
```

## Acceptance Criteria Summary

For completion:
- ✅ All 4 OAuth getting-started guides written and tested
- ✅ All 3 conceptual explainers complete and accessible
- ✅ Auto-generation script produces 115 tool references with no gaps
- ✅ All 10 case study pages in Divio tutorial format
- ✅ Two Astro sites configured, branded, and deployable
- ✅ BASE_URL configuration works at build time
- ✅ Cross-site navigation functional
- ✅ All content meets accessibility standards
- ✅ Documentation ready for publication
