# Tasks: Mittwald MCP Documentation & Static Site

**Feature**: 016-mittwald-mcp-documentation
**Mission**: documentation
**Created**: 2025-01-23

## Overview

This feature creates comprehensive end-user documentation for developers integrating Mittwald MCP with agentic coding tools. The documentation includes OAuth setup guides, conceptual explainers, auto-generated reference for 115 MCP tools, and 10 case study tutorials.

**Critical Path**: OAuth authentication documentation - all downstream usage depends on successful setup.

## Work Package Organization

**Total**: 14 work packages across 6 implementation phases
**Subtasks**: 39 discrete implementation steps
**Estimated Effort**: 180-220 hours

### Implementation Flow

1. **Phase A (WP01-WP02)**: Infrastructure & Setup - 2 WPs, 4 subtasks
2. **Phase B (WP03-WP05)**: OAuth Getting-Started Guides - 3 WPs, 9 subtasks
3. **Phase C (WP06)**: Conceptual Explainers - 1 WP, 3 subtasks
4. **Phase D (WP07-WP08)**: Auto-Generation Pipeline - 2 WPs, 7 subtasks
5. **Phase E (WP09-WP12)**: Case Study Tutorials - 4 WPs, 11 subtasks
6. **Phase F (WP13-WP14)**: Quality Assurance - 2 WPs, 5 subtasks

---

## Phase A: Infrastructure & Setup

Foundation work that enables all subsequent documentation work.

### WP01: Initialize Astro Starlight Projects

**Goal**: Set up two independent Starlight projects with branding and BASE_URL configuration
**Priority**: P0 (Foundational - blocks all other work)
**Estimated Prompt Size**: ~350 lines
**Dependencies**: None

**Included Subtasks**:
- [T001] Initialize Site 1 (Setup + Guides) Starlight project
- [T002] Initialize Site 2 (Reference) Starlight project
- [T003] Extract and integrate Mittwald branding (logo, colors, CSS variables)
- [T004] Configure BASE_URL support and cross-site navigation

**Implementation Notes**:
- Create both Starlight projects in `docs/` directory
- Apply Mittwald branding consistently across both sites
- Configure dynamic BASE_URL via environment variable
- Set up cross-site navigation links

**Independent Test**: Both sites build successfully and display Mittwald branding

**Parallel Opportunities**: None (foundational work)

**Risks**:
- Starlight theme customization may be complex
- CSS variable conflicts with Starlight defaults

---

### WP02: Astro Site Configuration & Navigation

**Goal**: Complete site configuration, navigation structure, and verify builds
**Priority**: P0 (Foundational)
**Estimated Prompt Size**: ~280 lines
**Dependencies**: WP01

**This work package has been consolidated into WP01 for efficiency**

---

## Phase B: OAuth Getting-Started Guides

Critical path - OAuth setup is the gating factor for all MCP usage.

### WP03: Claude Code & Copilot OAuth Guides

**Goal**: Research and write OAuth setup guides for Claude Code and GitHub Copilot
**Priority**: P1 (Critical - highest user impact)
**Estimated Prompt Size**: ~480 lines
**Dependencies**: WP01

**Included Subtasks**:
- [T005] Research Claude Code OAuth + MCP integration patterns
- [T006] Write Claude Code getting-started guide
- [T007] Research GitHub Copilot OAuth + MCP integration patterns
- [T008] Write GitHub Copilot getting-started guide

**Implementation Notes**:
- Each tool requires independent research before writing
- Focus on OAuth callback mechanics, PKCE configuration, redirect URI patterns
- Include troubleshooting for common OAuth errors
- Link to official tool documentation for MCP setup

**Independent Test**: Developer can complete OAuth setup for either tool within 10 minutes

**Parallel Opportunities**: [P] Claude Code and Copilot guides can be written in parallel after research

**Risks**:
- Tool-specific OAuth patterns may not be well-documented
- OAuth flow differences between tools require careful research

---

### WP04: Cursor & Codex CLI OAuth Guides

**Goal**: Research and write OAuth setup guides for Cursor and Codex CLI
**Priority**: P1 (Critical)
**Estimated Prompt Size**: ~480 lines
**Dependencies**: WP01

**Included Subtasks**:
- [T009] Research Cursor OAuth + MCP integration patterns
- [T010] Write Cursor getting-started guide
- [T011] Research Codex CLI OAuth + MCP integration (RFC 8252 loopback patterns)
- [T012] Write Codex CLI getting-started guide

**Implementation Notes**:
- Codex CLI requires special attention to RFC 8252 loopback mechanics
- Cursor may follow similar patterns to other IDE extensions
- Both tools need verification and testing sections

**Independent Test**: Developer can complete OAuth setup for either tool

**Parallel Opportunities**: [P] Cursor and Codex CLI guides can be written in parallel after research

**Risks**:
- Codex CLI loopback patterns may differ from Claude Code
- Limited public documentation on some tools' MCP support

---

### WP05: OAuth Guides Landing Page & Final Polish

**Goal**: Create OAuth guides landing page with tool comparison and final review
**Priority**: P1 (Critical)
**Estimated Prompt Size**: ~200 lines
**Dependencies**: WP03, WP04

**Included Subtasks**:
- [T013] Create OAuth guides landing page with tool comparison table

**Implementation Notes**:
- Comparison table: Tool vs. OAuth pattern vs. Redirect URI vs. Complexity
- Overview of OAuth authentication for MCP
- Links to all 4 individual guides
- Navigation breadcrumbs

**Independent Test**: Developer can compare tools and navigate to appropriate guide

**Parallel Opportunities**: None (depends on all OAuth guides)

**Risks**: None

---

## Phase C: Conceptual Explainers

Understanding-oriented documentation that provides context for developers.

### WP06: Write Conceptual Explainers

**Goal**: Write 3 conceptual explainers (MCP, Agentic Coding, OAuth Integration)
**Priority**: P2 (Important)
**Estimated Prompt Size**: ~420 lines
**Dependencies**: WP01

**Included Subtasks**:
- [T014] Write "What is MCP?" explainer with architecture diagrams
- [T015] Write "What is Agentic Coding?" explainer
- [T016] Write "How OAuth Integration Works" explainer with flow diagrams

**Implementation Notes**:
- Use Divio "Explanation" format (understanding-oriented)
- Include diagrams: MCP architecture, OAuth flow with PKCE
- Written for developers without prior MCP knowledge
- Explain design decisions and trade-offs

**Independent Test**: Non-specialist can understand core concepts after reading

**Parallel Opportunities**: [P] All 3 explainers can be written in parallel

**Risks**:
- Diagrams may require additional tools (Mermaid, draw.io)
- Balancing technical accuracy with accessibility

---

## Phase D: Auto-Generation Pipeline

Scripts to auto-generate reference documentation for 115 MCP tools.

### WP07: Auto-Generation Pipeline - Schema & Extraction

**Goal**: Design schema and implement tool handler extraction
**Priority**: P1 (Critical - enables Phase E)
**Estimated Prompt Size**: ~450 lines
**Dependencies**: WP01

**Included Subtasks**:
- [T017] Design auto-generation schema and contracts (tools-manifest.json structure)
- [T018] Implement tool handler extraction script (parse `/src/handlers/tools/`)
- [T019] Implement OpenAPI schema generation script
- [T020] Implement markdown conversion script

**Implementation Notes**:
- Define TypeScript interfaces for tools-manifest.json
- Extract tool metadata from handler files (name, domain, parameters, return type)
- Generate OpenAPI 3.0 schema from manifest
- Convert OpenAPI to Starlight markdown pages

**Independent Test**: All 115 tools are extracted and converted to markdown

**Parallel Opportunities**: [P] Schema design and extraction script can be developed in parallel

**Risks**:
- Tool handler structure may be inconsistent
- Parameter extraction from TypeScript types may be complex

---

### WP08: Auto-Generation Pipeline - Validation & Integration

**Goal**: Implement validation and integrate into build pipeline
**Priority**: P1 (Critical)
**Estimated Prompt Size**: ~380 lines
**Dependencies**: WP07

**Included Subtasks**:
- [T021] Implement coverage validation script
- [T022] Create 14 domain landing pages
- [T023] Integrate auto-generation into build pipeline

**Implementation Notes**:
- Validation: verify 115 tools present, no duplicates, all fields populated
- Domain landing pages: overview, tool list, common use cases
- Build pipeline: add prebuild hooks to package.json

**Independent Test**: Build succeeds and all 115 tool pages are present

**Parallel Opportunities**: [P] Domain landing pages can be created in parallel with validation

**Risks**:
- Build failures if validation detects missing tools
- Prebuild hooks may conflict with Starlight

---

## Phase E: Case Study Tutorials

Convert 10 case studies from 015 research to Divio tutorial format.

### WP09: Case Studies - Freelancer & Agency Segments

**Goal**: Convert 4 case studies for Freelancer and Agency segments
**Priority**: P2 (Important)
**Estimated Prompt Size**: ~500 lines
**Dependencies**: WP08 (need tool reference links)

**Included Subtasks**:
- [T024] Convert CS-001 (Freelancer Client Onboarding)
- [T025] Convert CS-002 (Agency Multi-Project Management)
- [T026] Convert CS-006 (Automated Backup Monitoring - Freelancer)
- [T027] Convert CS-007 (Developer Onboarding - Agency)

**Implementation Notes**:
- Source data from `kitty-specs/015/findings/CS-00X-*.md`
- Follow Divio Tutorial format: persona, problem, solution, implementation, outcomes
- Add links to Site 2 reference docs for each tool used
- Include troubleshooting sections
- Add estimated completion time

**Independent Test**: All tool references link correctly; steps are actionable

**Parallel Opportunities**: [P] All 4 case studies can be converted in parallel

**Risks**:
- Tool references may not exist yet (depends on WP08)
- Original case study data may need clarification

---

### WP10: Case Studies - E-commerce & TYPO3 Segments

**Goal**: Convert 4 case studies for E-commerce and TYPO3 segments
**Priority**: P2 (Important)
**Estimated Prompt Size**: ~500 lines
**Dependencies**: WP08

**Included Subtasks**:
- [T028] Convert CS-003 (E-commerce Launch Day Preparation)
- [T029] Convert CS-004 (TYPO3 Multi-Site Deployment)
- [T030] Convert CS-008 (Database Performance Optimization - E-commerce)
- [T031] Convert CS-009 (Security Audit Automation - TYPO3)

**Implementation Notes**:
- Same conversion process as WP09
- TYPO3 case studies may reference specialized tools
- E-commerce cases focus on performance and reliability

**Independent Test**: All case studies complete and linked

**Parallel Opportunities**: [P] All 4 case studies can be converted in parallel

**Risks**: Same as WP09

---

### WP11: Case Studies - Modern Stack Segment

**Goal**: Convert 2 case studies for Modern Stack segment
**Priority**: P2 (Important)
**Estimated Prompt Size**: ~280 lines
**Dependencies**: WP08

**Included Subtasks**:
- [T032] Convert CS-005 (Container Stack Deployment)
- [T033] Convert CS-010 (CI/CD Pipeline Integration)

**Implementation Notes**:
- Modern Stack cases emphasize containerization and DevOps workflows
- Both cases involve multi-step orchestration

**Independent Test**: Case studies complete with accurate tool references

**Parallel Opportunities**: [P] Both case studies can be converted in parallel

**Risks**: Same as WP09

---

### WP12: Case Studies Landing Page

**Goal**: Create case studies landing page with segment navigation
**Priority**: P2 (Important)
**Estimated Prompt Size**: ~220 lines
**Dependencies**: WP09, WP10, WP11

**Included Subtasks**:
- [T034] Create case studies landing page with segment-based navigation

**Implementation Notes**:
- Navigation by segment: Freelancer (2), Agency (2), E-commerce (2), TYPO3 (2), Modern Stack (2)
- Summary of each case study (persona, problem, outcome)
- Visual segment badges or icons

**Independent Test**: All 10 case studies are discoverable by segment

**Parallel Opportunities**: None (depends on all case studies)

**Risks**: None

---

## Phase F: Quality Assurance & Validation

Final testing, validation, and publication readiness.

### WP13: Accessibility & Link Validation

**Goal**: Audit accessibility and validate all links
**Priority**: P1 (Critical for publication)
**Estimated Prompt Size**: ~380 lines
**Dependencies**: All content WPs (WP03-WP12)

**Included Subtasks**:
- [T035] Accessibility audit (WCAG 2.1 AA compliance)
- [T036] Link validation (cross-site and external links)
- [T037] Build verification and BASE_URL configuration testing

**Implementation Notes**:
- Accessibility: heading hierarchy, alt text, contrast, keyboard navigation
- Link validation: internal, cross-site (Site 1 ↔ Site 2), external links
- BASE_URL testing: build with multiple values (/docs, /mcp-docs, etc.)

**Independent Test**: All accessibility checks pass; no broken links

**Parallel Opportunities**: [P] Accessibility and link validation can run in parallel

**Risks**:
- Accessibility violations may require content rework
- Cross-site links may break with different BASE_URLs

---

### WP14: User Testing & Final Publication Review

**Goal**: Test OAuth guides with real tools and final documentation review
**Priority**: P1 (Critical for publication)
**Estimated Prompt Size**: ~340 lines
**Dependencies**: WP13

**Included Subtasks**:
- [T038] OAuth guide user testing (follow each guide with actual tools)
- [T039] Final documentation review and publication readiness check

**Implementation Notes**:
- Test each OAuth guide step-by-step with actual tool setup
- Gather feedback and apply improvements
- Final QA checklist: all content complete, builds successful, branding consistent

**Independent Test**: All OAuth guides tested successfully; publication checklist complete

**Parallel Opportunities**: None (final validation)

**Risks**:
- OAuth guide testing may reveal issues requiring fixes
- User testing may be time-consuming (6-8 hours per WP38)

---

## Subtask Reference

### Phase A: Infrastructure & Setup (T001-T004)

- **T001**: Initialize Site 1 (Setup + Guides) Starlight project
  - Create `docs/setup-and-guides/` with package.json, astro.config.mjs
  - Set up basic folder structure (getting-started/, explainers/, case-studies/)
  - Configure Starlight plugin

- **T002**: Initialize Site 2 (Reference) Starlight project
  - Create `docs/reference/` with package.json, astro.config.mjs
  - Set up scripts/ folder for auto-generation
  - Configure Starlight plugin

- **T003**: Extract and integrate Mittwald branding
  - Extract logo (SVG) and colors from mittwald.de
  - Create mittwald-colors.css with CSS custom properties
  - Apply branding to both sites via astro.config.mjs

- **T004**: Configure BASE_URL support and cross-site navigation
  - Add BASE_URL environment variable support to both sites
  - Create cross-site navigation links
  - Test with multiple BASE_URL values

### Phase B: OAuth Getting-Started Guides (T005-T013)

- **T005**: Research Claude Code OAuth + MCP integration patterns
  - Investigate OAuth callback mechanics (RFC 8252 loopback?)
  - Document redirect URI patterns
  - Document PKCE configuration
  - Identify common errors

- **T006**: Write Claude Code getting-started guide
  - Follow Divio How-To format
  - Sections: Overview, Prerequisites, Steps 1-5, Troubleshooting, Next Steps
  - Test with actual Claude Code setup (if possible)

- **T007**: Research GitHub Copilot OAuth + MCP integration patterns
  - Similar research process to T005

- **T008**: Write GitHub Copilot getting-started guide
  - Similar guide structure to T006

- **T009**: Research Cursor OAuth + MCP integration patterns
  - Similar research process to T005

- **T010**: Write Cursor getting-started guide
  - Similar guide structure to T006

- **T011**: Research Codex CLI OAuth + MCP integration
  - Focus on CLI-specific patterns (RFC 8252 loopback)
  - Document terminal-based OAuth flow

- **T012**: Write Codex CLI getting-started guide
  - CLI-specific setup instructions

- **T013**: Create OAuth guides landing page
  - Tool comparison table
  - Overview of OAuth for MCP
  - Links to all 4 guides

### Phase C: Conceptual Explainers (T014-T016)

- **T014**: Write "What is MCP?" explainer
  - Definition, why it matters, how it works
  - MCP architecture diagram
  - Common misconceptions
  - Practical implications

- **T015**: Write "What is Agentic Coding?" explainer
  - Definition, relationship to LLMs/MCP
  - Practical examples with Mittwald MCP
  - When to use agentic coding vs. manual workflows

- **T016**: Write "How OAuth Integration Works" explainer
  - OAuth 2.1 flow overview
  - Dynamic Client Registration (DCR)
  - PKCE, token storage, encryption
  - OAuth flow diagram

### Phase D: Auto-Generation Pipeline (T017-T023)

- **T017**: Design auto-generation schema and contracts
  - Define tools-manifest.json structure
  - Define OpenAPI 3.0 template
  - Document data flow

- **T018**: Implement tool handler extraction script
  - Parse `/src/handlers/tools/` directory
  - Extract tool metadata (name, domain, parameters, return type, description)
  - Output: tools-manifest.json

- **T019**: Implement OpenAPI schema generation script
  - Convert tools-manifest.json to OpenAPI 3.0
  - Output: openapi.json

- **T020**: Implement markdown conversion script
  - Convert OpenAPI schema to Starlight markdown pages
  - Organize by domain: `tools/{domain}/{tool}.md`
  - Include frontmatter for Starlight

- **T021**: Implement coverage validation script
  - Verify 115 tools present
  - Check for duplicates, missing fields
  - Output: coverage-report.json

- **T022**: Create 14 domain landing pages
  - One per domain: apps, backups, certificates, etc.
  - Domain description, tool count, tool list, use cases

- **T023**: Integrate auto-generation into build pipeline
  - Add prebuild hooks to package.json
  - Run generation + validation before build
  - Test end-to-end build

### Phase E: Case Study Tutorials (T024-T034)

- **T024**: Convert CS-001 (Freelancer Client Onboarding)
- **T025**: Convert CS-002 (Agency Multi-Project Management)
- **T026**: Convert CS-006 (Automated Backup Monitoring)
- **T027**: Convert CS-007 (Developer Onboarding)
- **T028**: Convert CS-003 (E-commerce Launch Day)
- **T029**: Convert CS-004 (TYPO3 Multi-Site Deployment)
- **T030**: Convert CS-008 (Database Performance Optimization)
- **T031**: Convert CS-009 (Security Audit Automation)
- **T032**: Convert CS-005 (Container Stack Deployment)
- **T033**: Convert CS-010 (CI/CD Pipeline Integration)

**All case study conversion tasks follow the same pattern**:
- Source: `kitty-specs/015/findings/CS-00X-*.md`
- Extract persona, problem, solution, outcomes
- Create step-by-step implementation
- Add tool references with links to Site 2
- Add troubleshooting section
- Output: `case-studies/CS-00X-*.md`

- **T034**: Create case studies landing page
  - Navigation by segment (Freelancer, Agency, E-commerce, TYPO3, Modern Stack)
  - Summary of each case study
  - Links to all 10 case studies

### Phase F: Quality Assurance (T035-T039)

- **T035**: Accessibility audit (WCAG 2.1 AA)
  - Test heading hierarchy, alt text, contrast, keyboard navigation
  - Use WAVE, Lighthouse, axe DevTools
  - Document and fix violations

- **T036**: Link validation
  - Verify internal links (within site)
  - Verify cross-site links (Site 1 ↔ Site 2)
  - Verify external links (official docs, mittwald.de)
  - Fix broken links

- **T037**: Build verification and BASE_URL testing
  - Build both sites with multiple BASE_URL values
  - Verify links work correctly with each BASE_URL
  - Test cross-site navigation

- **T038**: OAuth guide user testing
  - Follow each guide step-by-step with actual tools
  - Note unclear instructions, missing steps, errors
  - Apply improvements

- **T039**: Final documentation review
  - Comprehensive review of all content
  - Verify all 115 tools present
  - Verify all 4 OAuth guides complete
  - Verify all 10 case studies complete
  - Publication readiness checklist

---

## Success Criteria

- ✅ All 115 MCP tools auto-generated and present in reference site
- ✅ All 4 OAuth guides complete, tested, and actionable
- ✅ All 3 conceptual explainers complete and understandable
- ✅ All 10 case studies converted with tool references
- ✅ Both sites build without warnings
- ✅ BASE_URL configuration works with multiple paths
- ✅ Mittwald branding consistent across both sites
- ✅ Navigation clear and functional
- ✅ All links working (internal, cross-site, external)
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Search functionality works (Starlight Pagefind)
- ✅ Mobile responsive design verified

---

## MVP Scope Recommendation

**Minimum viable documentation** (for initial user feedback):
- **WP01**: Infrastructure setup (both sites with branding)
- **WP03**: Claude Code OAuth guide (most popular tool)
- **WP06**: MCP explainer (foundational understanding)
- **WP07-WP08**: Auto-generation pipeline (115 tool references)
- **WP09**: First 4 case studies (2 segments covered)

This MVP provides:
- One complete OAuth setup path (Claude Code)
- Conceptual foundation (What is MCP?)
- Complete reference documentation (all 115 tools)
- Real-world examples (4 case studies)

**Estimated effort**: ~60-80 hours
**Value**: Developers can start using Mittwald MCP with Claude Code and have complete reference docs

---

## Parallelization Strategy

**Can run in parallel**:
- WP03 (Claude/Copilot) || WP04 (Cursor/Codex) - after WP01
- WP06 explainers (all 3 can be written concurrently) - after WP01
- WP09 || WP10 || WP11 case studies - after WP08
- T035 (accessibility) || T036 (links) within WP13

**Must run sequentially**:
- WP01 → (everything else)
- WP07 → WP08 (pipeline scripts before integration)
- WP08 → WP09/WP10/WP11 (case studies need tool references)
- WP03/WP04 → WP05 (landing page needs all guides)
- WP09/WP10/WP11 → WP12 (landing page needs all case studies)
- All content → WP13 → WP14 (QA must be last)

**Critical path**: WP01 → WP07 → WP08 → WP09 → WP13 → WP14
**Est. duration**: ~90-110 hours (if parallelization is maximized)

---

## Risk Mitigation

**High-risk work packages**:
- **WP03/WP04**: OAuth research may reveal complex tool-specific patterns
  - Mitigation: Budget extra time for research; link to official docs as fallback
- **WP07**: Tool handler extraction script may encounter inconsistent structure
  - Mitigation: Start with sample tools; add special-case handling as needed
- **WP13**: Accessibility violations may require content rework
  - Mitigation: Follow Starlight best practices from start; use templates

**Dependencies**:
- All content depends on WP01 (infrastructure)
- Case studies depend on WP08 (tool references must exist for links)
- QA depends on all content (nothing to validate until content exists)
